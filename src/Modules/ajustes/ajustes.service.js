const pool      = require('../../Config/database');
const AppError  = require('../../Utils/AppError');

const CONCEPTOS_VALIDOS = [
  'DIFERENCIA_INVENTARIO',
  'DETERIORO',
  'PERDIDA',
  'BAJA',
  'CORRECCION',
];

const create = async ({ item_id, cantidad, concepto, motivo }, userId, empresaId) => {
  if (!CONCEPTOS_VALIDOS.includes(concepto)) {
    throw new AppError('Concepto de ajuste inválido.', 400);
  }
  if (!Number.isInteger(cantidad) || cantidad === 0) {
    throw new AppError('La cantidad debe ser un número entero distinto de 0.', 400);
  }
  if (!motivo || motivo.trim().length < 5) {
    throw new AppError('El motivo debe tener al menos 5 caracteres.', 400);
  }

  // Verificar que el ítem pertenece a la empresa
  const [[item]] = await pool.query(
    `SELECT i.id,
            GREATEST(0,
              COALESCE(i.cant_recepcionada, 0)
              - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                          WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
              - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                          JOIN dispensaciones d ON d.id = di.dispensacion_id
                          WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
              + COALESCE((SELECT SUM(a.cantidad) FROM ajustes_inventario a
                          WHERE a.item_id = i.id), 0)
            ) AS stock_actual
     FROM items_recepcion_inventario i
     JOIN recepciones_inventario r ON r.id = i.recepcion_id
     WHERE i.id = ? AND r.empresa_id = ? AND r.deleted_at IS NULL`,
    [item_id, empresaId],
  );
  if (!item) throw new AppError('Ítem no encontrado.', 404);

  // Si el ajuste es negativo, validar que no deje stock en negativo
  if (cantidad < 0 && item.stock_actual + cantidad < 0) {
    throw new AppError(
      `Stock insuficiente para este ajuste. Stock actual: ${item.stock_actual}`,
      400,
    );
  }

  const [result] = await pool.query(
    `INSERT INTO ajustes_inventario (empresa_id, item_id, cantidad, concepto, motivo, creado_por)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [empresaId, item_id, cantidad, concepto, motivo.trim(), userId],
  );

  return { id: result.insertId, stock_nuevo: item.stock_actual + cantidad };
};

const findByItem = async (itemId, empresaId) => {
  const [[item]] = await pool.query(
    `SELECT i.id FROM items_recepcion_inventario i
     JOIN recepciones_inventario r ON r.id = i.recepcion_id
     WHERE i.id = ? AND r.empresa_id = ?`,
    [itemId, empresaId],
  );
  if (!item) throw new AppError('Ítem no encontrado.', 404);

  const [rows] = await pool.query(
    `SELECT a.id, a.cantidad, a.concepto, a.motivo, a.created_at,
            CONCAT(u.nombres, ' ', u.apellidos) AS creado_por_nombre
     FROM ajustes_inventario a
     JOIN users u ON u.id = a.creado_por
     WHERE a.item_id = ? AND a.empresa_id = ?
     ORDER BY a.created_at DESC`,
    [itemId, empresaId],
  );
  return rows;
};

module.exports = { create, findByItem };
