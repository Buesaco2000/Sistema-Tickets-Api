const pool = require('../../config/database');
const AppError = require('../../utils/AppError');

const search = async (q, empresaId, categoria) => {
  const like = `%${q}%`;
  const [rows] = await pool.query(
    `SELECT id, codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado
     FROM catalogo_items
     WHERE empresa_id = ? AND categoria = ? AND deleted_at IS NULL
       AND (codigo_interno LIKE ? OR nombre LIKE ?)
     ORDER BY codigo_interno ASC
     LIMIT 4`,
    [empresaId, categoria, like, like]
  );
  return rows;
};

const findAll = async (empresaId, categoria) => {
  const [rows] = await pool.query(
    `SELECT id, codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado, created_at
     FROM catalogo_items
     WHERE empresa_id = ? AND categoria = ? AND deleted_at IS NULL
     ORDER BY codigo_interno ASC`,
    [empresaId, categoria]
  );
  return rows;
};

const findById = async (id, empresaId, categoria) => {
  const [[row]] = await pool.query(
    `SELECT * FROM catalogo_items WHERE id = ? AND empresa_id = ? AND categoria = ? AND deleted_at IS NULL`,
    [id, empresaId, categoria]
  );
  if (!row) throw new AppError('Item no encontrado.', 404);
  return row;
};

const create = async (data, empresaId, categoria) => {
  const { codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado } = data;
  const [result] = await pool.query(
    `INSERT INTO catalogo_items
       (empresa_id, categoria, codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado)
     VALUES (?,?,?,?,?,?,?,?)`,
    [empresaId, categoria, codigo_interno, nombre, presentacion || null,
     concentracion || null, precio_2026 || null, precio_regulado || null]
  );
  return findById(result.insertId, empresaId, categoria);
};

const update = async (id, data, empresaId, categoria) => {
  await findById(id, empresaId, categoria);
  const allowed = ['codigo_interno', 'nombre', 'presentacion', 'concentracion', 'precio_2026', 'precio_regulado'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key] ?? null); }
  }
  if (!fields.length) throw new AppError('Sin campos para actualizar.', 400);
  fields.push('updated_at = NOW()');
  values.push(id, empresaId, categoria);
  await pool.query(
    `UPDATE catalogo_items SET ${fields.join(', ')} WHERE id = ? AND empresa_id = ? AND categoria = ?`,
    values
  );
  return findById(id, empresaId, categoria);
};

const softDelete = async (id, empresaId, categoria) => {
  const [result] = await pool.query(
    `UPDATE catalogo_items SET deleted_at = NOW() WHERE id = ? AND empresa_id = ? AND categoria = ? AND deleted_at IS NULL`,
    [id, empresaId, categoria]
  );
  if (!result.affectedRows) throw new AppError('Item no encontrado.', 404);
};

module.exports = { search, findAll, findById, create, update, softDelete };
