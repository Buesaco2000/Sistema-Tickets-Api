const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const ROLES    = require('../../utils/roles');
const { buildMeta }  = require('../../utils/pagination');
const { logAudit }   = require('../../utils/auditLog');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: qué tipos puede ver un cargo
// ─────────────────────────────────────────────────────────────────────────────
// Regla de negocio:
//   - Director Técnico → crea y ve todo (filtrado por director_id)
//   - Enfermero/a Jefe → ve los 4 tipos (asignados a él)
//   - Auxiliar          → ve solo URGENCIAS y HOSPITALIZACION (asignados a él)
//   - ADMIN             → ve todo
//
// Se usa cargo en texto porque los roles del sistema (ADMIN/INGENIERO/SALUD)
// son demasiado generales; el cargo es más específico (ej: "Director Tecnico").
// ─────────────────────────────────────────────────────────────────────────────
const TIPOS_TODOS = ['KIT', 'URGENCIAS', 'HOSPITALIZACION', 'CARRO_PARO'];

function tiposPermitidos(cargo = '') {
  const c = cargo.toLowerCase();
  if (c.includes('director tecnico')) return TIPOS_TODOS;
  if (c.includes('jefe'))             return TIPOS_TODOS;       // Enfermero/a Jefe
  if (c.includes('auxiliar'))         return ['URGENCIAS', 'HOSPITALIZACION'];
  return TIPOS_TODOS; // fallback: si no hay regla definida, ve todo
}

// ─────────────────────────────────────────────────────────────────────────────
// CREAR dispensación
// ─────────────────────────────────────────────────────────────────────────────
// Recibe:
//   tipo           → 'KIT' | 'URGENCIAS' | 'HOSPITALIZACION' | 'CARRO_PARO'
//   municipio_id   → municipio donde se dispensa
//   destinatario_id→ ID del usuario que recibe
//   observaciones  → texto opcional
//   items          → array de { item_id, cantidad }
//
// Valida:
//   1. Que cada item_id exista y pertenezca a la empresa
//   2. Que la cantidad pedida no supere el stock disponible
//      (cant_recepcionada - salidas ACTIVAS - dispensaciones PENDIENTES/ACEPTADAS)
// ─────────────────────────────────────────────────────────────────────────────
const crear = async (data, directorId, empresaId) => {
  const { tipo, destinatario_id, observaciones, items } = data;

  if (!Array.isArray(items) || items.length === 0)
    throw new AppError('Debes incluir al menos un medicamento.', 400);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Obtener municipio_id del director desde la BD (no confiar en el cliente)
    const [[director]] = await conn.query(
      'SELECT municipio_id FROM users WHERE id = ? LIMIT 1',
      [directorId]
    );

    let municipio_id = director?.municipio_id ?? null;

    // ADMIN no tiene municipio propio: derivarlo del primer ítem (recepción → municipio)
    if (!municipio_id) {
      const [[itemRec]] = await conn.query(
        `SELECT r.municipio_id
         FROM items_recepcion_inventario i
         JOIN recepciones_inventario r ON r.id = i.recepcion_id
         WHERE i.id = ? AND r.empresa_id = ?
         LIMIT 1`,
        [items[0].item_id, empresaId]
      );
      municipio_id = itemRec?.municipio_id ?? null;
    }

    if (!municipio_id)
      throw new AppError('No se pudo determinar el municipio de los medicamentos.', 400);

    // Insertar cabecera de la dispensación
    const [res] = await conn.query(
      `INSERT INTO dispensaciones
         (empresa_id, tipo, municipio_id, director_id, destinatario_id, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [empresaId, tipo, municipio_id, directorId, destinatario_id, observaciones || null]
    );
    const dispensacionId = res.insertId;

    // Insertar cada medicamento de la dispensación
    for (const it of items) {
      // Obtener datos del ítem e información de stock
      // stock = cant_recepcionada - suma de salidas ACTIVAS o PENDIENTES
      // No contamos las RECHAZADAS porque esas devuelven el stock
      const [[item]] = await conn.query(
        `SELECT i.id, i.nombre, i.lote, i.fecha_vencimiento,
                COALESCE(i.cant_recepcionada, 0) AS cant_recepcionada,
                COALESCE(SUM(
                  CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END
                ), 0) AS total_salidas
         FROM items_recepcion_inventario i
         JOIN recepciones_inventario r ON r.id = i.recepcion_id
         LEFT JOIN salidas_medicamentos s ON s.item_id = i.id
         WHERE i.id = ? AND r.empresa_id = ?
         GROUP BY i.id`,
        [it.item_id, empresaId]
      );
      if (!item) throw new AppError(`Ítem ${it.item_id} no encontrado.`, 404);

      const stockDisponible = Math.max(0, item.cant_recepcionada - item.total_salidas);
      if (it.cantidad > stockDisponible)
        throw new AppError(
          `Stock insuficiente para "${item.nombre}". Disponible: ${stockDisponible}`,
          400
        );

      await conn.query(
        `INSERT INTO dispensacion_items
           (dispensacion_id, item_id, medicamento_nombre, cantidad, lote, fecha_vencimiento)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dispensacionId,
          it.item_id,
          item.nombre,
          it.cantidad,
          item.lote            || null,
          item.fecha_vencimiento || null,
        ]
      );
    }

    await conn.commit();
    return dispensacionId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LISTAR dispensaciones según quién consulta
// ─────────────────────────────────────────────────────────────────────────────
// Lógica de visibilidad:
//   - ADMIN          → ve todas las de la empresa
//   - Director Técnico → ve las que él creó (director_id = userId)
//   - Cualquier otro → ve solo las que le asignaron (destinatario_id = userId)
//                      filtradas por los tipos que su cargo permite
//
// En todos los casos se filtra por municipio del usuario (no ADMIN).
// ─────────────────────────────────────────────────────────────────────────────
const listar = async (empresaId, userId, rolId, cargo, pag = { page: 1, limit: 100, offset: 0 }) => {
  // Si no es ADMIN, obtener municipio del usuario
  let municipioId = null;
  if (rolId !== ROLES.ADMIN) {
    const [[profile]] = await pool.query(
      'SELECT municipio_id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (profile) municipioId = profile.municipio_id;
  }

  const conds  = ['d.empresa_id = ?'];
  const params = [empresaId];

  // Filtro por municipio (no ADMIN)
  if (municipioId) {
    conds.push('d.municipio_id = ?');
    params.push(municipioId);
  }

  const c = (cargo || '').toLowerCase();

  if (rolId !== ROLES.ADMIN) {
    if (c.includes('director tecnico')) {
      // El Director ve lo que él creó
      conds.push('d.director_id = ?');
      params.push(userId);
    } else {
      // Enfermeros/Auxiliares: ven lo que les asignaron
      conds.push('d.destinatario_id = ?');
      params.push(userId);

      // Solo los tipos que su cargo permite ver
      const tipos = tiposPermitidos(cargo);
      // Genera placeholders: ?,?,? según cantidad de tipos
      conds.push(`d.tipo IN (${tipos.map(() => '?').join(',')})`);
      params.push(...tipos);
    }
  }

  const { page, limit, offset } = pag;
  const where = conds.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT d.id) AS total FROM dispensaciones d WHERE ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT d.id, d.tipo, d.estado, d.observaciones,
            d.aceptado_por, d.fecha_aceptacion, d.created_at,
            mu.nombre  AS municipio,
            ud.nombres AS director_nombre, ud.apellidos AS director_apellidos,
            ur.nombres AS dest_nombre,    ur.apellidos AS dest_apellidos,
            ur.cargo   AS dest_cargo,
            COUNT(di.id)           AS total_items,
            COALESCE(SUM(di.cantidad), 0) AS total_unidades
     FROM dispensaciones d
     JOIN municipios mu ON mu.id = d.municipio_id
     JOIN users ud      ON ud.id = d.director_id
     JOIN users ur      ON ur.id = d.destinatario_id
     LEFT JOIN dispensacion_items di ON di.dispensacion_id = d.id
     WHERE ${where}
     GROUP BY d.id
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows, meta: buildMeta(total, page, limit) };
};

// ─────────────────────────────────────────────────────────────────────────────
// DETALLE de una dispensación (incluye los medicamentos)
// ─────────────────────────────────────────────────────────────────────────────
const detalle = async (dispensacionId, empresaId) => {
  const [[d]] = await pool.query(
    `SELECT d.id, d.tipo, d.estado, d.observaciones,
            d.aceptado_por, d.fecha_aceptacion, d.created_at,
            mu.nombre  AS municipio,
            ud.nombres AS director_nombre, ud.apellidos AS director_apellidos,
            ur.nombres AS dest_nombre,    ur.apellidos AS dest_apellidos,
            ur.cargo   AS dest_cargo
     FROM dispensaciones d
     JOIN municipios mu ON mu.id = d.municipio_id
     JOIN users ud      ON ud.id = d.director_id
     JOIN users ur      ON ur.id = d.destinatario_id
     WHERE d.id = ? AND d.empresa_id = ?`,
    [dispensacionId, empresaId]
  );
  if (!d) throw new AppError('Dispensación no encontrada.', 404);

  const [items] = await pool.query(
    `SELECT di.id, di.item_id, di.medicamento_nombre,
            di.cantidad, di.lote, di.fecha_vencimiento
     FROM dispensacion_items di
     WHERE di.dispensacion_id = ?
     ORDER BY di.id`,
    [dispensacionId]
  );

  return { ...d, items };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACEPTAR dispensación
// ─────────────────────────────────────────────────────────────────────────────
// Solo la puede aceptar el destinatario (destinatario_id = userId).
// Cambia estado a ACEPTADO y registra quién aceptó y cuándo.
// ─────────────────────────────────────────────────────────────────────────────
const aceptar = async (dispensacionId, empresaId, userId, nombreUsuario) => {
  const [[d]] = await pool.query(
    `SELECT id, destinatario_id, estado
     FROM dispensaciones
     WHERE id = ? AND empresa_id = ?`,
    [dispensacionId, empresaId]
  );
  if (!d) throw new AppError('Dispensación no encontrada.', 404);
  if (d.destinatario_id !== userId)
    throw new AppError('Solo el destinatario puede aceptar esta dispensación.', 403);
  if (d.estado !== 'PENDIENTE')
    throw new AppError(`Esta dispensación ya fue ${d.estado.toLowerCase()}.`, 400);

  await pool.query(
    `UPDATE dispensaciones
     SET estado = 'ACEPTADO', aceptado_por = ?, fecha_aceptacion = NOW()
     WHERE id = ?`,
    [nombreUsuario, dispensacionId]
  );

  logAudit({
    empresaId,
    usuarioId:   userId,
    tabla:       'dispensaciones',
    registroId:  dispensacionId,
    accion:      'APPROVE',
    modulo:      'DISPENSACIONES',
    descripcion: `Dispensación #${dispensacionId} aceptada por ${nombreUsuario}`,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// RECHAZAR dispensación
// ─────────────────────────────────────────────────────────────────────────────
// Solo la puede rechazar el destinatario.
// ─────────────────────────────────────────────────────────────────────────────
const rechazar = async (dispensacionId, empresaId, userId) => {
  const [[d]] = await pool.query(
    `SELECT id, destinatario_id, estado
     FROM dispensaciones
     WHERE id = ? AND empresa_id = ?`,
    [dispensacionId, empresaId]
  );
  if (!d) throw new AppError('Dispensación no encontrada.', 404);
  if (d.destinatario_id !== userId)
    throw new AppError('Solo el destinatario puede rechazar esta dispensación.', 403);
  if (d.estado !== 'PENDIENTE')
    throw new AppError(`Esta dispensación ya fue ${d.estado.toLowerCase()}.`, 400);

  await pool.query(
    "UPDATE dispensaciones SET estado = 'RECHAZADO' WHERE id = ?",
    [dispensacionId]
  );

  logAudit({
    empresaId,
    usuarioId:   userId,
    tabla:       'dispensaciones',
    registroId:  dispensacionId,
    accion:      'REJECT',
    modulo:      'DISPENSACIONES',
    descripcion: `Dispensación #${dispensacionId} rechazada`,
  });
};

module.exports = { crear, listar, detalle, aceptar, rechazar };
