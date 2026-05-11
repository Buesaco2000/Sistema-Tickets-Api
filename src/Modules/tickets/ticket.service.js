const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

const findAll = async (empresaId, filters, pag) => {
  const { page, limit, offset } = pag;
  const conds  = ['t.empresa_id = ?', 't.deleted_at IS NULL'];
  const params = [empresaId];

  if (filters.estado_id)      { conds.push('t.estado_id = ?');       params.push(filters.estado_id); }
  if (filters.tipo_soporte_id){ conds.push('t.tipo_soporte_id = ?'); params.push(filters.tipo_soporte_id); }
  if (filters.prioridad)      { conds.push('t.prioridad = ?');        params.push(filters.prioridad); }
  if (filters.equipo_id)      { conds.push('t.equipo_id = ?');        params.push(filters.equipo_id); }
  if (filters.fecha_desde)    { conds.push('t.created_at >= ?');      params.push(filters.fecha_desde); }
  if (filters.fecha_hasta)    { conds.push('t.created_at <= ?');      params.push(filters.fecha_hasta); }

  const where = conds.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets t WHERE ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
       t.id, t.estado_id, t.tipo_soporte_id, t.prioridad, t.fecha_cierre, t.created_at, t.updated_at,
       e.nombre  AS estado,
       ts.nombre AS tipo_soporte,
       m.nombre  AS municipio,
       eb.nombre AS equipo,
       eb.serie  AS equipo_serie,
       CONCAT(u.nombres, ' ', u.apellidos) AS creado_por
     FROM tickets t
     JOIN estados        e  ON e.id  = t.estado_id
     JOIN tipos_soporte  ts ON ts.id = t.tipo_soporte_id
     JOIN municipios     m  ON m.id  = t.municipio_incidente_id
     LEFT JOIN equipos_biomedicos eb ON eb.id = t.equipo_id
     LEFT JOIN users              u  ON u.id  = t.created_by
     WHERE ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, meta: buildMeta(total, page, limit) };
};

const findById = async (id, empresaId) => {
  const [rows] = await pool.query(
    `SELECT
       t.*,
       e.nombre  AS estado,
       ts.nombre AS tipo_soporte,
       m.nombre  AS municipio,
       eb.nombre AS equipo,
       CONCAT(u.nombres, ' ', u.apellidos) AS creado_por
     FROM tickets t
     JOIN estados        e  ON e.id  = t.estado_id
     JOIN tipos_soporte  ts ON ts.id = t.tipo_soporte_id
     JOIN municipios     m  ON m.id  = t.municipio_incidente_id
     LEFT JOIN equipos_biomedicos eb ON eb.id = t.equipo_id
     LEFT JOIN users              u  ON u.id  = t.created_by
     WHERE t.id = ? AND t.empresa_id = ? AND t.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!rows[0]) throw new AppError('Ticket no encontrado.', 404);
  return rows[0];
};

const create = async (data, userId, empresaId) => {
  const { municipio_incidente_id, tipo_soporte_id, equipo_id, estado_id, prioridad } = data;

  // Verificar que el equipo pertenece a la empresa
  if (equipo_id) {
    const [[eq]] = await pool.query(
      'SELECT id FROM equipos_biomedicos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
      [equipo_id, empresaId]
    );
    if (!eq) throw new AppError('El equipo no pertenece a esta empresa.', 403);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO tickets (empresa_id, municipio_incidente_id, tipo_soporte_id, equipo_id, estado_id, prioridad, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [empresaId, municipio_incidente_id, tipo_soporte_id, equipo_id || null, estado_id, prioridad || 'MEDIA', userId]
    );
    const ticketId = result.insertId;

    // Historial de estado inicial (atómico con la creación)
    await conn.query(
      'INSERT INTO ticket_historial_estado (ticket_id, estado_id, changed_by) VALUES (?, ?, ?)',
      [ticketId, estado_id, userId]
    );

    await conn.commit();
    return findById(ticketId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateEstado = async (id, estadoId, userId, empresaId) => {
  await findById(id, empresaId); // 404 si no existe o es de otra empresa

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE tickets
       SET estado_id = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ? AND empresa_id = ?`,
      [estadoId, userId, id, empresaId]
    );

    await conn.query(
      'INSERT INTO ticket_historial_estado (ticket_id, estado_id, changed_by) VALUES (?, ?, ?)',
      [id, estadoId, userId]
    );

    await conn.commit();
    return findById(id, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const softDelete = async (id, userId, empresaId) => {
  const [result] = await pool.query(
    `UPDATE tickets SET deleted_at = NOW(), updated_by = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [userId, id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Ticket no encontrado.', 404);
};

const assignUser = async (ticketId, targetUserId, rolTicketId, empresaId) => {
  await findById(ticketId, empresaId);

  // Verificar que el usuario a asignar pertenece a la misma empresa
  const [[user]] = await pool.query(
    'SELECT id FROM users WHERE id = ? AND empresa_id = ? AND activo = 1 AND deleted_at IS NULL',
    [targetUserId, empresaId]
  );
  if (!user) throw new AppError('El usuario no pertenece a esta empresa.', 403);

  await pool.query(
    `INSERT INTO ticket_usuarios (ticket_id, user_id, empresa_id, rol_ticket_id)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rol_ticket_id = VALUES(rol_ticket_id)`,
    [ticketId, targetUserId, empresaId, rolTicketId || null]
  );
};

module.exports = { findAll, findById, create, updateEstado, softDelete, assignUser };