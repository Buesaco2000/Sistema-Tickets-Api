// src/models/Municipios.js
const pool = require("../database");

const Municipios = {
  // Crear un nuevo municipio
  create: async (data) => {
    const { nombre } = data;
    const query = `INSERT INTO municipios (nombre) VALUES (?)`;
    const [result] = await pool.query(query, [nombre]);

    const [municipio] = await pool.query(
      `SELECT * FROM municipios WHERE id = ?`,
      [result.insertId]
    );
    return municipio[0];
  },

  // Recuperar todos los municipios
  findAll: async () => {
    const [rows] = await pool.query(`SELECT * FROM municipios`);
    return rows;
  },

  findAllNombre: async (nombre) => {
    const [rows] = await pool.query(
      `SELECT 
      m.nombre 
      municipios m 
      WHERE id = ?`,
      [nombre]
    );
    return rows;
  },

  // Recuperar un municipio por ID
  findById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM municipios WHERE id = ?`, [
      id,
    ]);
    return rows[0];
  },

  // Actualizar un municipio por ID
  updateById: async (id, data) => {
    const { nombre } = data;
    await pool.query(`UPDATE municipios SET nombre = ? WHERE id = ?`, [
      nombre,
      id,
    ]);

    const [rows] = await pool.query(`SELECT * FROM municipios WHERE id = ?`, [
      id,
    ]);
    return rows[0];
  },

  // Eliminar un municipio por ID
  deleteById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM municipios WHERE id = ?`, [
      id,
    ]);
    await pool.query(`DELETE FROM municipios WHERE id = ?`, [id]);
    return rows[0];
  },
};

module.exports = Municipios;
