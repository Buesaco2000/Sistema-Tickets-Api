const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');

const findByTicket = async (ticketId, empresaId) => {
  const [rows] = await pool.query(
    `SELECT
       s.id, s.ticket_id, s.tipo_soporte_id, s.descripcion, s.imagen_url, s.created_at,
       ts.nombre AS tipo_soporte,
       ts.requiere_detalle,
       sd.sede_id, sd.fecha_facturacion, sd.factura_anular, sd.factura_copago_anular,
       sd.valor_copago_anulado, sd.factura_refacturar, sd.nombre_facturador, sd.motivo,
       se.nombre AS sede
     FROM soportes s
     LEFT JOIN tipos_soporte ts ON ts.id = s.tipo_soporte_id
     LEFT JOIN soporte_detalle sd ON sd.soporte_id = s.id
     LEFT JOIN sedes se ON se.id = sd.sede_id
     WHERE s.ticket_id = ? AND s.empresa_id = ? AND s.deleted_at IS NULL
     ORDER BY s.created_at ASC`,
    [ticketId, empresaId]
  );
  return rows;
};

const findById = async (id, empresaId) => {
  const [rows] = await pool.query(
    `SELECT
       s.id, s.ticket_id, s.tipo_soporte_id, s.descripcion, s.imagen_url, s.created_at,
       ts.nombre AS tipo_soporte,
       ts.requiere_detalle,
       sd.sede_id, sd.fecha_facturacion, sd.factura_anular, sd.factura_copago_anular,
       sd.valor_copago_anulado, sd.factura_refacturar, sd.nombre_facturador, sd.motivo,
       se.nombre AS sede
     FROM soportes s
     LEFT JOIN tipos_soporte ts ON ts.id = s.tipo_soporte_id
     LEFT JOIN soporte_detalle sd ON sd.soporte_id = s.id
     LEFT JOIN sedes se ON se.id = sd.sede_id
     WHERE s.id = ? AND s.empresa_id = ? AND s.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!rows[0]) throw new AppError('Soporte no encontrado.', 404);
  return rows[0];
};

const create = async (data, empresaId) => {
  const { ticket_id, tipo_soporte_id, descripcion, imagen_url, detalle } = data;

  // Verificar que el ticket pertenece a la empresa
  const [[ticket]] = await pool.query(
    'SELECT id, tipo_soporte_id FROM tickets WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
    [ticket_id, empresaId]
  );
  if (!ticket) throw new AppError('Ticket no encontrado.', 404);

  // Determinar si el tipo de soporte requiere detalle
  const tipoId = tipo_soporte_id ?? ticket.tipo_soporte_id;
  let requiereDetalle = false;
  if (tipoId) {
    const [[tipo]] = await pool.query('SELECT requiere_detalle FROM tipos_soporte WHERE id = ?', [tipoId]);
    requiereDetalle = tipo?.requiere_detalle ?? false;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO soportes (empresa_id, ticket_id, tipo_soporte_id, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [empresaId, ticket_id, tipoId || null, descripcion, imagen_url || null]
    );
    const soporteId = result.insertId;

    if (requiereDetalle && detalle) {
      const { sede_id, fecha_facturacion, factura_anular, factura_copago_anular,
              valor_copago_anulado, factura_refacturar, nombre_facturador, motivo } = detalle;
      await conn.query(
        `INSERT INTO soporte_detalle
           (empresa_id, soporte_id, sede_id, fecha_facturacion, factura_anular,
            factura_copago_anular, valor_copago_anulado, factura_refacturar,
            nombre_facturador, motivo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [empresaId, soporteId, sede_id || null, fecha_facturacion || null, factura_anular || null,
         factura_copago_anular || null, valor_copago_anulado || null, factura_refacturar || null,
         nombre_facturador || null, motivo || null]
      );
    }

    await conn.commit();
    return findById(soporteId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const softDelete = async (id, empresaId) => {
  const [result] = await pool.query(
    'UPDATE soportes SET deleted_at = NOW() WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
    [id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Soporte no encontrado.', 404);
};

module.exports = { findByTicket, findById, create, softDelete };
