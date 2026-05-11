const bcrypt   = require('bcrypt');
const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

const findAll = async (empresaId, filters, pag) => {
  const { page, limit, offset } = pag;
  const conds  = ['u.empresa_id = ?', 'u.deleted_at IS NULL'];
  const params = [empresaId];

  if (filters.rol_id)   { conds.push('u.rol_id = ?');   params.push(filters.rol_id); }
  if (filters.cargo_id) { conds.push('u.cargo_id = ?'); params.push(filters.cargo_id); }
  if (typeof filters.activo === 'boolean') {
    conds.push('u.activo = ?');
    params.push(filters.activo);
  }

  const where = conds.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u WHERE ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT u.id, u.nombres, u.apellidos, u.email, u.telefono, u.activo, u.created_at,
            r.nombre AS rol, c.nombre AS cargo, m.nombre AS municipio
     FROM users u
     LEFT JOIN roles      r ON r.id = u.rol_id
     LEFT JOIN cargos     c ON c.id = u.cargo_id
     LEFT JOIN municipios m ON m.id = u.municipio_id
     WHERE ${where}
     ORDER BY u.nombres ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, meta: buildMeta(total, page, limit) };
};

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT u.id, u.nombres, u.apellidos, u.email, u.telefono, u.activo,
            u.rol_id, u.cargo_id, u.municipio_id, u.created_at, u.updated_at,
            r.nombre AS rol, c.nombre AS cargo, m.nombre AS municipio
     FROM users u
     LEFT JOIN roles      r ON r.id = u.rol_id
     LEFT JOIN cargos     c ON c.id = u.cargo_id
     LEFT JOIN municipios m ON m.id = u.municipio_id
     WHERE u.id = ? AND u.empresa_id = ? AND u.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!row) throw new AppError('Usuario no encontrado.', 404);
  return row;
};

const update = async (id, data, userId, empresaId) => {
  await findById(id, empresaId);

  const allowed = ['nombres', 'apellidos', 'telefono', 'rol_id', 'cargo_id', 'municipio_id'];
  const fields  = [];
  const values  = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  }

  if (!fields.length) throw new AppError('Sin campos para actualizar.', 400);

  fields.push('updated_by = ?', 'updated_at = NOW()');
  values.push(userId, id, empresaId);

  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND empresa_id = ?`,
    values
  );

  return findById(id, empresaId);
};

const changePassword = async (id, currentPassword, newPassword, empresaId) => {
  const [[user]] = await pool.query(
    'SELECT id, password FROM users WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
    [id, empresaId]
  );
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Contraseña actual incorrecta.', 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.query(
    'UPDATE users SET password = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
    [hashed, id, id]
  );
};

const setActivo = async (id, activo, userId, empresaId) => {
  const [result] = await pool.query(
    `UPDATE users SET activo = ?, updated_by = ?, updated_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [activo, userId, id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Usuario no encontrado.', 404);
};

const softDelete = async (id, userId, empresaId) => {
  // Evitar que un admin se elimine a sí mismo
  if (id === userId) throw new AppError('No puedes eliminar tu propia cuenta.', 400);

  const [result] = await pool.query(
    `UPDATE users SET deleted_at = NOW(), activo = 0, updated_by = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [userId, id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Usuario no encontrado.', 404);
};

module.exports = { findAll, findById, update, changePassword, setActivo, softDelete };
