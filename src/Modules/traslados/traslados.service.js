const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const ROLES    = require('../../utils/roles');

// Traslados pendientes visibles para el usuario (destino = su municipio)
const getPendientes = async (empresaId, userId, rolId) => {
  let municipioId = null;

  if (rolId !== ROLES.ADMIN) {
    const [[profile]] = await pool.query(
      'SELECT municipio_id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (profile) municipioId = profile.municipio_id;
  }

  const conds  = ['t.empresa_id = ?', "t.estado = 'PENDIENTE'"];
  const params = [empresaId];

  if (municipioId) { conds.push('(t.municipio_destino_id = ? OR t.municipio_destino_id IS NULL)'); params.push(municipioId); }

  const [rows] = await pool.query(
    `SELECT t.id, t.salida_id, t.item_id, t.cantidad, t.medicamento_nombre,
            t.responsable_origen, t.created_at,
            mo.nombre AS municipio_origen,  so.nombre AS sede_origen,
            md.nombre AS municipio_destino, sd.nombre AS sede_destino
     FROM traslados_pendientes t
     LEFT JOIN municipios mo ON mo.id = t.municipio_origen_id
     LEFT JOIN sedes      so ON so.id = t.sede_origen_id
     LEFT JOIN municipios md ON md.id = t.municipio_destino_id
     LEFT JOIN sedes      sd ON sd.id = t.sede_destino_id
     WHERE ${conds.join(' AND ')}
     ORDER BY t.created_at ASC`,
    params
  );
  return rows;
};

// Contador de traslados pendientes (para badge en menú)
const contarPendientes = async (empresaId, userId, rolId) => {
  const rows = await getPendientes(empresaId, userId, rolId);
  return rows.length;
};

// Confirmar traslado: crea recepción en destino y marca como CONFIRMADO
const confirmar = async (trasladoId, empresaId, userId, responsableDestino) => {
  const [[traslado]] = await pool.query(
    `SELECT t.*, i.codigo_interno, i.presentacion_comercial, i.concentracion,
            i.fecha_vencimiento, i.lote, i.registro_sanitario, i.estado_registro,
            i.cum, i.atc, i.laboratorio, i.cadena_frio, i.temperatura,
            i.snna, i.cod, i.acr, i.estado_empaque
     FROM traslados_pendientes t
     JOIN items_recepcion_medicamentos i ON i.id = t.item_id
     WHERE t.id = ? AND t.empresa_id = ? AND t.estado = 'PENDIENTE'`,
    [trasladoId, empresaId]
  );
  if (!traslado) throw new AppError('Traslado no encontrado o ya procesado.', 404);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Crear recepción en destino
    const hoy  = new Date().toISOString().slice(0, 10);
    const hora = new Date().toTimeString().slice(0, 8);

    const [recResult] = await conn.query(
      `INSERT INTO recepciones_medicamentos
         (empresa_id, fecha, hora, municipio_id, sede_id,
          proveedor, remision_factura, responsable_recibe, created_by)
       VALUES (?, ?, ?, ?, ?, 'Traslado interno', ?, ?, ?)`,
      [
        empresaId, hoy, hora,
        traslado.municipio_destino_id || null,
        traslado.sede_destino_id      || null,
        `Traslado #${traslado.id}`,
        responsableDestino,
        userId,
      ]
    );
    const recepcionId = recResult.insertId;

    // Copiar ítem con la cantidad trasladada
    await conn.query(
      `INSERT INTO items_recepcion_medicamentos
         (recepcion_id, nombre, codigo_interno, presentacion_comercial, concentracion,
          fecha_vencimiento, lote, registro_sanitario, estado_registro,
          cum, atc, laboratorio, cant_recepcionada, cant_solicitada,
          cadena_frio, temperatura, snna, cod, acr,
          estado_empaque)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        recepcionId,
        traslado.medicamento_nombre,
        traslado.codigo_interno      || null,
        traslado.presentacion_comercial || null,
        traslado.concentracion       || null,
        traslado.fecha_vencimiento   || null,
        traslado.lote                || null,
        traslado.registro_sanitario  || null,
        traslado.estado_registro     || null,
        traslado.cum                 || null,
        traslado.atc                 || null,
        traslado.laboratorio         || null,
        traslado.cantidad,
        traslado.cantidad,
        traslado.cadena_frio         ?? false,
        traslado.temperatura         || null,
        traslado.snna                || null,
        traslado.cod                 || null,
        traslado.acr                 || null,
        traslado.estado_empaque      || null,
      ]
    );

    // Marcar traslado como CONFIRMADO
    await conn.query(
      `UPDATE traslados_pendientes
       SET estado = 'CONFIRMADO', recepcion_destino_id = ?,
           confirmado_por = ?, fecha_confirmacion = NOW()
       WHERE id = ?`,
      [recepcionId, responsableDestino, trasladoId]
    );

    // Marcar salida como ACTIVO (ya procesada)
    await conn.query(
      "UPDATE salidas_medicamentos SET estado = 'ACTIVO' WHERE id = ?",
      [traslado.salida_id]
    );

    await conn.commit();
    return { recepcion_id: recepcionId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Rechazar traslado: anula la salida y devuelve el stock al origen
// MT-02: userId + rolId para validar que solo el municipio destino puede rechazar
const rechazar = async (trasladoId, empresaId, userId, rolId) => {
  const [[traslado]] = await pool.query(
    "SELECT * FROM traslados_pendientes WHERE id = ? AND empresa_id = ? AND estado = 'PENDIENTE'",
    [trasladoId, empresaId]
  );
  if (!traslado) throw new AppError('Traslado no encontrado o ya procesado.', 404);

  if (rolId !== ROLES.ADMIN && traslado.municipio_destino_id) {
    const [[profile]] = await pool.query(
      'SELECT municipio_id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (profile?.municipio_id !== traslado.municipio_destino_id)
      throw new AppError('Solo el municipio destino puede rechazar este traslado.', 403);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE traslados_pendientes SET estado = 'RECHAZADO' WHERE id = ?",
      [trasladoId]
    );
    await conn.query(
      "UPDATE salidas_medicamentos SET estado = 'RECHAZADO' WHERE id = ?",
      [traslado.salida_id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getPendientes, contarPendientes, confirmar, rechazar };
