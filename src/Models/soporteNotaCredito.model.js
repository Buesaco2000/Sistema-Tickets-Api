const pool = require("../database");

const SoporteNotaCredito = {
  create: async (ticket_id, data) => {
    if (!ticket_id) {
      throw new Error("ticket_id es obligatorio");
    }

    const {
      fecha_facturacion,
      factura_anular,
      factura_copago_anular,
      valor_copago_anulado,
      factura_refacturar,
      centro_atencion,
      nombre_facturador,
      motivo,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO soporte_notas_credito 
     (ticket_id, fecha_facturacion, factura_anular, factura_copago_anular, valor_copago_anulado, factura_refacturar, centro_atencion, nombre_facturador, motivo) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_id,
        fecha_facturacion,
        factura_anular,
        factura_copago_anular,
        valor_copago_anulado,
        factura_refacturar,
        centro_atencion,
        nombre_facturador,
        motivo,
      ]
    );

    return result.insertId;
  },

  // Para rol SALUD: ve sus propios tickets
  findByUsuario: async (userId, tipoSoporteId) => {
    const query = `
      SELECT
        t.id,
        t.estado,
        t.created_at,
        snc.motivo AS tipo_error,
        snc.centro_atencion,
        snc.fecha_facturacion,
        snc.valor_copago_anulado,
        u.nombres AS nombresIng,
        u.apellidos AS apellidosIng
      FROM tickets t
      JOIN soporte_notas_credito snc ON snc.ticket_id = t.id
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
        snc.motivo AS tipo_error,
        snc.centro_atencion,
        snc.fecha_facturacion,
        snc.valor_copago_anulado,
        u.nombres AS nombresIng,
        u.apellidos AS apellidosIng
      FROM tickets t
      JOIN soporte_notas_credito snc ON snc.ticket_id = t.id
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
        snc.motivo AS tipo_error,
        snc.centro_atencion,
        snc.fecha_facturacion,
        snc.valor_copago_anulado,
        u.nombres AS nombresIng,
        u.apellidos AS apellidosIng
      FROM tickets t
      JOIN soporte_notas_credito snc ON snc.ticket_id = t.id
      JOIN users u ON u.id = t.ingeniero_id
      WHERE t.tipo_soporte_id = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.query(query, [tipoSoporteId]);
    return rows;
  },
};

module.exports = SoporteNotaCredito;
