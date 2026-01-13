const pool = require("../database");

const SoportePlataforma = {
  create: async ({ ticket_id, descripcion, imagen }) => {
    const query = `INSERT INTO soporte_plataforma (ticket_id, descripcion, imagen_url)
       VALUES (?, ?, ?)`;

    const [result] = await pool.query(query, [
      ticket_id,
      descripcion,
      imagen || null,
    ]);

    return result.insertId;
  },

  // Para rol SALUD: ve sus propios tickets
  findByUsuario: async (userId, tipoSoporteId) => {
    const query = `
      SELECT
        t.id,
        t.estado,
        t.created_at,
        sp.descripcion AS tipo_error,
        sp.imagen_url,
        u.nombres AS nombresIng,
        u.apellidos AS apellidosIng
      FROM tickets t
      JOIN soporte_plataforma sp ON sp.ticket_id = t.id
      JOIN users u ON u.id = t.ingeniero_id
      WHERE t.usuario_salud_id = ? AND t.tipo_soporte_id = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.query(query, [userId, tipoSoporteId]);
    return rows;
  },

  // Para rol INGENIERO: ve tickets de su municipio
  findByMunicipio: async (municipioId, tipoSoporteId) => {
    const query = `
      SELECT
        t.id,
        t.estado,
        t.created_at,
        sp.descripcion AS tipo_error,
        sp.imagen_url,
        u.nombres AS nombresIng,
        u.apellidos AS apellidosIng
      FROM tickets t
      JOIN soporte_plataforma sp ON sp.ticket_id = t.id
      JOIN users u ON u.id = t.ingeniero_id
      WHERE t.municipio_id = ? AND t.tipo_soporte_id = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.query(query, [municipioId, tipoSoporteId]);
    return rows;
  },

  // Para rol ADMIN: ve todos los tickets
  findAll: async (tipoSoporteId) => {
    const query = `
      SELECT
        t.id,
        t.estado,
        t.created_at,
        sp.descripcion AS tipo_error,
        sp.imagen_url,
        u.nombres AS nombresIng,
        u.apellidos AS apellidosIng
      FROM tickets t
      JOIN soporte_plataforma sp ON sp.ticket_id = t.id
      JOIN users u ON u.id = t.ingeniero_id
      WHERE t.tipo_soporte_id = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.query(query, [tipoSoporteId]);
    return rows;
  },
};

module.exports = SoportePlataforma;
