const pool = require('../../config/database');
const AppError = require('../../utils/AppError');

const search = async (q, empresaId) => {
  const like = `%${q}%`;
  const [rows] = await pool.query(
    `SELECT id, codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado
     FROM catalogo_medicamentos
     WHERE empresa_id = ? AND deleted_at IS NULL
       AND (codigo_interno LIKE ? OR nombre LIKE ?)
     ORDER BY codigo_interno ASC
     LIMIT 4`,
    [empresaId, like, like]
  );
  return rows;
};

const findAll = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT id, codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado, created_at
     FROM catalogo_medicamentos
     WHERE empresa_id = ? AND deleted_at IS NULL
     ORDER BY codigo_interno ASC`,
    [empresaId]
  );
  return rows;
};

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT * FROM catalogo_medicamentos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!row) throw new AppError('Medicamento no encontrado.', 404);
  return row;
};

const create = async (data, empresaId) => {
  const { codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado } = data;
  const [result] = await pool.query(
    `INSERT INTO catalogo_medicamentos
       (empresa_id, codigo_interno, nombre, presentacion, concentracion, precio_2026, precio_regulado)
     VALUES (?,?,?,?,?,?,?)`,
    [empresaId, codigo_interno, nombre, presentacion || null,
     concentracion || null, precio_2026 || null, precio_regulado || null]
  );
  return findById(result.insertId, empresaId);
};

const update = async (id, data, empresaId) => {
  await findById(id, empresaId);
  const allowed = ['codigo_interno', 'nombre', 'presentacion', 'concentracion', 'precio_2026', 'precio_regulado'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key] ?? null); }
  }
  if (!fields.length) throw new AppError('Sin campos para actualizar.', 400);
  fields.push('updated_at = NOW()');
  values.push(id, empresaId);
  await pool.query(
    `UPDATE catalogo_medicamentos SET ${fields.join(', ')} WHERE id = ? AND empresa_id = ?`,
    values
  );
  return findById(id, empresaId);
};

const softDelete = async (id, empresaId) => {
  const [result] = await pool.query(
    `UPDATE catalogo_medicamentos SET deleted_at = NOW() WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Medicamento no encontrado.', 404);
};

module.exports = { search, findAll, findById, create, update, softDelete };
