// src/models/Cargos.js
const pool = require('../database');

const Cargos = {
  // Crear un nuevo cargo
  create: async (data) => {
    const { nombre } = data;
    const query = `INSERT INTO cargos (nombre) VALUES (?)`;
    const [result] = await pool.query(query, [nombre]);

    const [cargo] = await pool.query(`SELECT * FROM cargos WHERE id = ?`, [result.insertId]);
    return cargo[0];
  },

  // Recuperar todos los cargos
  findAll: async () => {
    const [rows] = await pool.query(`SELECT * FROM cargos`);
    return rows;
  },

  findAlRol: async () => {
    const [rows] = await pool.query(`SELECT * FROM roles WHERE id != 1`);
    return rows;
  },

  // Recuperar un cargo por ID
  findById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM cargos WHERE id = ?`, [id]);
    return rows[0];
  },

  // Actualizar un cargo por ID
  updateById: async (id, data) => {
    const { nombre } = data;
    await pool.query(`UPDATE cargos SET nombre = ? WHERE id = ?`, [nombre, id]);

    const [rows] = await pool.query(`SELECT * FROM cargos WHERE id = ?`, [id]);
    return rows[0];
  },

  // Eliminar un cargo por ID
  deleteById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM cargos WHERE id = ?`, [id]);
    await pool.query(`DELETE FROM cargos WHERE id = ?`, [id]);
    return rows[0];
  }
};

module.exports = Cargos;
