const pool     = require('../../Config/database');
const AppError = require('../../Utils/AppError');

const STOCK_CALC = `GREATEST(0,
  COALESCE(i.cant_recepcionada, 0)
  - COALESCE((SELECT SUM(sm.cantidad) FROM salidas_medicamentos sm
              WHERE sm.item_id = i.id AND sm.estado != 'RECHAZADO'), 0)
  - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
              JOIN dispensaciones d ON d.id = di.dispensacion_id
              WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
  + COALESCE((SELECT SUM(aj.cantidad) FROM ajustes_inventario aj
              WHERE aj.item_id = i.id), 0))`;

const listar = async (empresaId) => {
  const [rows] = await pool.query(`
    SELECT cf.id, cf.fecha, cf.estado, cf.observaciones, cf.created_at,
           mu.nombre AS municipio, s.nombre AS sede,
           COUNT(ci.id)                                                  AS total_items,
           COALESCE(SUM(ci.estado = 'PENDIENTE'), 0)                     AS pendientes,
           COALESCE(SUM(ci.estado = 'CUADRADO'), 0)                      AS cuadrados,
           COALESCE(SUM(ci.estado IN ('SOBRANTE','FALTANTE')), 0)        AS con_diferencia,
           CONCAT(u.nombres, ' ', u.apellidos)                           AS creado_por
    FROM conteos_fisicos cf
    LEFT JOIN municipios mu ON mu.id = cf.municipio_id
    LEFT JOIN sedes      s  ON s.id  = cf.sede_id
    LEFT JOIN conteo_items ci ON ci.conteo_id = cf.id
    LEFT JOIN users u ON u.id = cf.created_by
    WHERE cf.empresa_id = ?
    GROUP BY cf.id, mu.nombre, s.nombre, u.nombres, u.apellidos
    ORDER BY cf.created_at DESC
  `, [empresaId]);
  return rows;
};

const crear = async ({ municipio_id, sede_id, fecha, observaciones }, userId, empresaId) => {
  if (!fecha) throw new AppError('La fecha es obligatoria.', 400);

  const conds  = ["r.empresa_id = ?", "r.deleted_at IS NULL", "r.estado = 'COMPLETADA'"];
  const params = [empresaId];
  if (municipio_id) { conds.push('r.municipio_id = ?'); params.push(Number(municipio_id)); }
  if (sede_id)      { conds.push('r.sede_id = ?');      params.push(Number(sede_id)); }

  const [items] = await pool.query(`
    SELECT i.id AS item_id,
           CAST(${STOCK_CALC} AS SIGNED) AS stock_sistema
    FROM items_recepcion_inventario i
    JOIN recepciones_inventario r ON r.id = i.recepcion_id
    WHERE ${conds.join(' AND ')}
    HAVING stock_sistema > 0
  `, params);

  if (items.length === 0) {
    throw new AppError('No hay ítems con stock para ese filtro.', 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [{ insertId: conteoId }] = await conn.query(
      `INSERT INTO conteos_fisicos (empresa_id, municipio_id, sede_id, fecha, estado, observaciones, created_by)
       VALUES (?, ?, ?, ?, 'EN_PROGRESO', ?, ?)`,
      [empresaId, municipio_id || null, sede_id || null, fecha, observaciones || null, userId],
    );

    const vals = items.map(it => [conteoId, it.item_id, it.stock_sistema]);
    await conn.query(`INSERT INTO conteo_items (conteo_id, item_id, stock_sistema) VALUES ?`, [vals]);

    await conn.commit();
    return { id: conteoId, total_items: items.length };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const getById = async (id, empresaId) => {
  const [[conteo]] = await pool.query(`
    SELECT cf.id, cf.fecha, cf.estado, cf.observaciones, cf.created_at, cf.closed_at,
           cf.municipio_id, cf.sede_id,
           mu.nombre AS municipio, s.nombre AS sede,
           CONCAT(u.nombres,  ' ', u.apellidos)  AS creado_por,
           CONCAT(uc.nombres, ' ', uc.apellidos) AS cerrado_por
    FROM conteos_fisicos cf
    LEFT JOIN municipios mu ON mu.id = cf.municipio_id
    LEFT JOIN sedes      s  ON s.id  = cf.sede_id
    LEFT JOIN users u  ON u.id  = cf.created_by
    LEFT JOIN users uc ON uc.id = cf.closed_by
    WHERE cf.id = ? AND cf.empresa_id = ?
  `, [id, empresaId]);
  if (!conteo) throw new AppError('Conteo no encontrado.', 404);

  const [items] = await pool.query(`
    SELECT ci.id, ci.item_id, ci.stock_sistema, ci.cantidad_contada,
           (ci.cantidad_contada - ci.stock_sistema) AS diferencia,
           ci.estado, ci.observacion,
           i.nombre, i.tipo_recepcion, i.lote, i.codigo_interno,
           mu2.nombre AS municipio_item, s2.nombre AS sede_item
    FROM conteo_items ci
    JOIN items_recepcion_inventario i ON i.id = ci.item_id
    JOIN recepciones_inventario r ON r.id = i.recepcion_id
    LEFT JOIN municipios mu2 ON mu2.id = r.municipio_id
    LEFT JOIN sedes      s2  ON s2.id  = r.sede_id
    WHERE ci.conteo_id = ?
    ORDER BY i.tipo_recepcion, i.nombre
  `, [id]);

  return { ...conteo, items };
};

const actualizarItems = async (conteoId, updates, empresaId) => {
  const [[conteo]] = await pool.query(
    `SELECT id, estado FROM conteos_fisicos WHERE id = ? AND empresa_id = ?`,
    [conteoId, empresaId],
  );
  if (!conteo) throw new AppError('Conteo no encontrado.', 404);
  if (conteo.estado === 'CERRADO') throw new AppError('No se puede modificar un conteo cerrado.', 400);

  const [existingItems] = await pool.query(
    `SELECT id, stock_sistema FROM conteo_items WHERE conteo_id = ?`,
    [conteoId],
  );
  const snapMap = new Map(existingItems.map(it => [it.id, Number(it.stock_sistema)]));

  for (const upd of updates) {
    const stockSistema = snapMap.get(upd.id);
    if (stockSistema === undefined) continue;

    let estado = 'PENDIENTE';
    if (upd.cantidad_contada != null) {
      const dif = upd.cantidad_contada - stockSistema;
      estado = dif === 0 ? 'CUADRADO' : dif > 0 ? 'SOBRANTE' : 'FALTANTE';
    }

    await pool.query(
      `UPDATE conteo_items SET cantidad_contada = ?, observacion = ?, estado = ?
       WHERE id = ? AND conteo_id = ?`,
      [upd.cantidad_contada ?? null, upd.observacion ?? null, estado, upd.id, conteoId],
    );
  }
};

const cerrar = async (id, crearAjustes, userId, empresaId) => {
  const [[conteo]] = await pool.query(
    `SELECT id, estado FROM conteos_fisicos WHERE id = ? AND empresa_id = ?`,
    [id, empresaId],
  );
  if (!conteo) throw new AppError('Conteo no encontrado.', 404);
  if (conteo.estado === 'CERRADO') throw new AppError('El conteo ya está cerrado.', 400);

  let ajustesCreados = 0;

  if (crearAjustes) {
    const [items] = await pool.query(`
      SELECT ci.item_id, ci.stock_sistema, ci.cantidad_contada,
             (ci.cantidad_contada - ci.stock_sistema) AS diferencia
      FROM conteo_items ci
      WHERE ci.conteo_id = ?
        AND ci.cantidad_contada IS NOT NULL
        AND ci.cantidad_contada != ci.stock_sistema
    `, [id]);

    for (const it of items) {
      const diferencia = Math.round(Number(it.diferencia));
      if (diferencia === 0) continue;
      await pool.query(
        `INSERT INTO ajustes_inventario (empresa_id, item_id, cantidad, concepto, motivo, creado_por)
         VALUES (?, ?, ?, 'DIFERENCIA_INVENTARIO', ?, ?)`,
        [empresaId, it.item_id, diferencia, `Conteo fisico #${id}`, userId],
      );
      ajustesCreados++;
    }
  }

  await pool.query(
    `UPDATE conteos_fisicos SET estado = 'CERRADO', closed_by = ?, closed_at = NOW()
     WHERE id = ? AND empresa_id = ?`,
    [userId, id, empresaId],
  );

  return { ajustes_creados: ajustesCreados };
};

module.exports = { listar, crear, getById, actualizarItems, cerrar };
