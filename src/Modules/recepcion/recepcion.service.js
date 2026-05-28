const pool = require('../../config/database');
const AppError = require('../../utils/AppError');
const ROLES = require('../../utils/roles');

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT r.*,
            mu.nombre AS municipio,
            s.nombre  AS sede
     FROM recepciones_medicamentos r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.id = ? AND r.empresa_id = ? AND r.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!row) throw new AppError('Recepción no encontrada.', 404);

  const [medicamentos] = await pool.query(
    'SELECT * FROM items_recepcion_medicamentos WHERE recepcion_id = ? ORDER BY id',
    [id]
  );

  return { ...row, medicamentos };
};

const findAll = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.fecha, r.hora, r.proveedor, r.remision_factura,
            r.responsable_recibe, r.created_at,
            mu.nombre AS municipio, s.nombre AS sede
     FROM recepciones_medicamentos r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.empresa_id = ? AND r.deleted_at IS NULL
     ORDER BY r.fecha DESC, r.hora DESC`,
    [empresaId]
  );
  return rows;
};

const create = async (data, userId, empresaId) => {
  const {
    fecha, hora, municipio_id, sede_id, uas, proveedor,
    remision_factura, reactivos, responsable_recibe,
    medicamentos,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO recepciones_medicamentos
         (empresa_id, fecha, hora, municipio_id, sede_id, uas, proveedor,
          remision_factura, reactivos, responsable_recibe, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId, fecha, hora,
        municipio_id   || null,
        sede_id        || null,
        uas            || null,
        proveedor,
        remision_factura,
        reactivos      || null,
        responsable_recibe,
        userId,
      ]
    );
    const recepcionId = result.insertId;

    if (Array.isArray(medicamentos) && medicamentos.length) {
      for (const m of medicamentos) {
        await conn.query(
          `INSERT INTO items_recepcion_medicamentos
             (recepcion_id, catalogo_id, codigo_interno, nombre, presentacion_comercial,
              concentracion, fecha_vencimiento, registro_sanitario, estado_registro,
              cum, atc, laboratorio, cant_solicitada, cant_recepcionada, cant_faltante, lote,
              cadena_frio, temperatura, snna, ta, cod, acr,
              certificado_calidad, tipo_certificado_calidad,
              certificado_esterilizacion, estado_empaque,
              humedo, colapsado, manchado, etiquetas, tipo_etiquetas)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            recepcionId,
            m.catalogo_id                  || null,
            m.codigo_interno               || null,
            m.nombre,
            m.presentacion_comercial       || null,
            m.concentracion                || null,
            m.fecha_vencimiento            || null,
            m.registro_sanitario           || null,
            m.estado_registro              || null,
            m.cum                          || null,
            m.atc                          || null,
            m.laboratorio                  || null,
            m.cant_solicitada              || null,
            m.cant_recepcionada            || null,
            m.cant_faltante                || null,
            m.lote                         || null,
            m.cadena_frio                  ?? false,
            m.temperatura                  || null,
            m.snna                         || null,
            m.ta                           || null,
            m.cod                          || null,
            m.acr                          || null,
            m.certificado_calidad          ?? false,
            m.tipo_certificado_calidad     || null,
            m.certificado_esterilizacion   ?? false,
            m.estado_empaque               || null,
            m.humedo                       ?? false,
            m.colapsado                    ?? false,
            m.manchado                     ?? false,
            m.etiquetas                    ?? false,
            m.tipo_etiquetas               || null,
          ]
        );
      }
    }

    await conn.commit();
    return findById(recepcionId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const softDelete = async (id, empresaId) => {
  const [result] = await pool.query(
    `UPDATE recepciones_medicamentos SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Recepción no encontrada.', 404);
};

const findAllItems = async (empresaId, userId, rolId) => {
  // Si no es ADMIN, filtrar solo por municipio del usuario
  let municipioId = null;

  if (rolId !== ROLES.ADMIN) {
    const [[profile]] = await pool.query(
      'SELECT municipio_id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (profile) municipioId = profile.municipio_id;
  }

  const conds  = ['r.empresa_id = ?', 'r.deleted_at IS NULL'];
  const params = [empresaId];

  if (municipioId) {
    conds.push('r.municipio_id = ?');
    params.push(municipioId);
  }

  const where = conds.join(' AND ');

  const [rows] = await pool.query(
    `SELECT i.id, i.recepcion_id,
            i.codigo_interno, i.nombre, i.presentacion_comercial,
            i.concentracion, i.fecha_vencimiento, i.lote,
            i.cant_solicitada, i.cant_recepcionada,
            COALESCE(SUM(CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END), 0) AS total_salidas,
            GREATEST(0, COALESCE(i.cant_recepcionada, 0)
                      - COALESCE(SUM(CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END), 0)) AS stock,
            r.fecha AS fecha_recepcion, r.proveedor,
            -- Subquery: trae la dispensación activa más reciente para este ítem.
            -- Formato "TIPO|Nombre Destinatario" para parsear en el frontend.
            -- Solo muestra PENDIENTE o ACEPTADO; RECHAZADO se ignora.
            (SELECT CONCAT(d.tipo, '|', CONCAT(u.nombres, ' ', u.apellidos))
             FROM dispensacion_items di2
             JOIN dispensaciones d ON d.id = di2.dispensacion_id
             JOIN users u ON u.id = d.destinatario_id
             WHERE di2.item_id = i.id AND d.estado IN ('PENDIENTE','ACEPTADO')
             ORDER BY d.created_at DESC LIMIT 1
            ) AS dispensacion_activa
     FROM items_recepcion_medicamentos i
     JOIN recepciones_medicamentos r ON r.id = i.recepcion_id
     LEFT JOIN salidas_medicamentos s ON s.item_id = i.id
     WHERE ${where}
     GROUP BY i.id
     ORDER BY i.nombre ASC`,
    params
  );
  return rows;
};

const createSalida = async (data, userId, empresaId) => {
  const { item_id, cantidad, fecha, motivo, responsable,
          municipio_destino_id, sede_destino_id } = data;

  const [[item]] = await pool.query(
    `SELECT i.id, i.nombre,
            COALESCE(i.cant_recepcionada, 0) AS cant_recepcionada,
            COALESCE(SUM(CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END), 0) AS total_salidas,
            r.municipio_id AS municipio_origen_id,
            r.sede_id      AS sede_origen_id
     FROM items_recepcion_medicamentos i
     JOIN recepciones_medicamentos r ON r.id = i.recepcion_id
     LEFT JOIN salidas_medicamentos s ON s.item_id = i.id
     WHERE i.id = ? AND r.empresa_id = ?
     GROUP BY i.id`,
    [item_id, empresaId]
  );
  if (!item) throw new AppError('Ítem no encontrado.', 404);

  const stock = Math.max(0, item.cant_recepcionada - item.total_salidas);
  if (cantidad > stock) {
    throw new AppError(`Stock insuficiente. Disponible: ${stock}`, 400);
  }

  const esTraslado = motivo === 'Traslado';
  const estadoSalida = esTraslado ? 'PENDIENTE' : 'ACTIVO';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO salidas_medicamentos
         (empresa_id, item_id, cantidad, fecha, motivo, responsable, estado,
          municipio_destino_id, sede_destino_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [empresaId, item_id, cantidad, fecha, motivo, responsable, estadoSalida,
       municipio_destino_id || null, sede_destino_id || null, userId]
    );
    const salidaId = result.insertId;

    // Si es traslado, crear registro pendiente
    if (esTraslado) {
      await conn.query(
        `INSERT INTO traslados_pendientes
           (empresa_id, salida_id, item_id, cantidad, medicamento_nombre,
            responsable_origen, municipio_origen_id, sede_origen_id,
            municipio_destino_id, sede_destino_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [empresaId, salidaId, item_id, cantidad, item.nombre,
         responsable, item.municipio_origen_id || null, item.sede_origen_id || null,
         municipio_destino_id || null, sede_destino_id || null]
      );
    }

    await conn.commit();
    return salidaId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getSalidasByItem = async (itemId, empresaId) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.item_id, s.cantidad, s.fecha, s.motivo, s.responsable,
            s.estado, s.municipio_destino_id, s.sede_destino_id, s.created_at,
            mu.nombre AS municipio_destino, se.nombre AS sede_destino
     FROM salidas_medicamentos s
     JOIN items_recepcion_medicamentos i ON i.id = s.item_id
     JOIN recepciones_medicamentos r     ON r.id = i.recepcion_id
     LEFT JOIN municipios mu ON mu.id = s.municipio_destino_id
     LEFT JOIN sedes      se ON se.id = s.sede_destino_id
     WHERE s.item_id = ? AND r.empresa_id = ?
     ORDER BY s.fecha DESC, s.created_at DESC`,
    [itemId, empresaId]
  );
  return rows;
};

module.exports = { findAll, findAllItems, findById, create, softDelete, createSalida, getSalidasByItem };
