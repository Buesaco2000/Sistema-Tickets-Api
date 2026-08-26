const pool = require("../../Config/database");
const AppError = require("../../Utils/AppError");

// ── Listar todos los mínimos de la empresa ─────────────────────────────────
const listar = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT smp.id,
            smp.catalogo_id,
            ci.nombre       AS producto,
            ci.categoria    AS tipo_recepcion,
            ci.codigo_interno,
            smp.municipio_id,
            m.nombre        AS municipio,
            smp.sede_id,
            s.nombre        AS sede,
            smp.stock_minimo,
            smp.updated_at
     FROM   stock_minimo_punto smp
     JOIN   catalogo_items ci ON ci.id = smp.catalogo_id
     LEFT JOIN municipios  m  ON m.id  = smp.municipio_id
     LEFT JOIN sedes        s  ON s.id  = smp.sede_id
     WHERE  smp.empresa_id = ?
     ORDER  BY ci.nombre, m.nombre, s.nombre`,
    [empresaId]
  );
  return rows;
};

// ── Alertas: stock actual < mínimo, agrupado por producto + punto ──────────
const getAlertas = async (empresaId, municipioId = null, sedeId = null) => {
  // Stock actual por catalogo + municipio + sede (sumando todos los lotes)
  const [stocks] = await pool.query(
    `SELECT i.catalogo_id,
            i.codigo_interno,
            i.nombre,
            i.tipo_recepcion,
            r.municipio_id,
            mu.nombre AS municipio,
            r.sede_id,
            se.nombre AS sede,
            SUM(GREATEST(0,
              COALESCE(i.cant_recepcionada, 0)
              - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                          WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
              - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                          JOIN dispensaciones d ON d.id = di.dispensacion_id
                          WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
            )) AS stock_actual
     FROM   items_recepcion_inventario i
     JOIN   recepciones_inventario r  ON r.id = i.recepcion_id
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      se ON se.id = r.sede_id
     WHERE  r.empresa_id    = ?
       AND  r.deleted_at    IS NULL
       AND  r.estado        = 'COMPLETADA'
       AND  i.catalogo_id   IS NOT NULL
     GROUP  BY i.catalogo_id, i.codigo_interno, i.nombre, i.tipo_recepcion,
               r.municipio_id, mu.nombre, r.sede_id, se.nombre`,
    [empresaId]
  );

  // Mínimos configurados
  const [minimos] = await pool.query(
    `SELECT catalogo_id, municipio_id, sede_id, stock_minimo
     FROM   stock_minimo_punto
     WHERE  empresa_id = ?`,
    [empresaId]
  );

  // Cruzar stock actual con mínimos
  const alertas = [];
  for (const s of stocks) {
    // Buscar mínimo: primero por catalogo+municipio+sede, luego solo catalogo+municipio, luego global
    const minimo =
      minimos.find(
        (m) =>
          m.catalogo_id === s.catalogo_id &&
          m.municipio_id === s.municipio_id &&
          m.sede_id === s.sede_id
      ) ||
      minimos.find(
        (m) =>
          m.catalogo_id === s.catalogo_id &&
          m.municipio_id === s.municipio_id &&
          m.sede_id === null
      ) ||
      minimos.find(
        (m) =>
          m.catalogo_id === s.catalogo_id &&
          m.municipio_id === null &&
          m.sede_id === null
      );

    if (!minimo) continue;
    if (s.stock_actual >= minimo.stock_minimo) continue;

    // Aplicar filtros de ubicación si vienen en el query
    if (municipioId && s.municipio_id !== Number(municipioId)) continue;
    if (sedeId && s.sede_id !== Number(sedeId)) continue;

    alertas.push({
      catalogo_id:   s.catalogo_id,
      codigo_interno: s.codigo_interno,
      nombre:        s.nombre,
      tipo_recepcion: s.tipo_recepcion,
      municipio_id:  s.municipio_id,
      municipio:     s.municipio,
      sede_id:       s.sede_id,
      sede:          s.sede,
      stock_actual:  Number(s.stock_actual),
      stock_minimo:  minimo.stock_minimo,
      deficit:       minimo.stock_minimo - Number(s.stock_actual),
    });
  }

  // Ordenar por déficit descendente (los más críticos primero)
  alertas.sort((a, b) => b.deficit - a.deficit);
  return alertas;
};

// ── Crear o actualizar mínimo para un producto + punto ────────────────────
const upsert = async (empresaId, { catalogo_id, municipio_id, sede_id, stock_minimo }) => {
  if (!catalogo_id || stock_minimo == null || stock_minimo < 0) {
    throw new AppError("catalogo_id y stock_minimo son requeridos.", 400);
  }

  const munId  = municipio_id ?? null;
  const sedeId = sede_id ?? null;

  // Verificar que el catálogo pertenece a la empresa
  const [ci] = await pool.query(
    "SELECT id FROM catalogo_items WHERE id = ? AND empresa_id = ? LIMIT 1",
    [catalogo_id, empresaId]
  );
  if (!ci.length) throw new AppError("Producto no encontrado.", 404);

  await pool.query(
    `INSERT INTO stock_minimo_punto
       (empresa_id, catalogo_id, municipio_id, sede_id, stock_minimo)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE stock_minimo = VALUES(stock_minimo), updated_at = NOW()`,
    [empresaId, catalogo_id, munId, sedeId, stock_minimo]
  );

  const [[updated]] = await pool.query(
    `SELECT smp.*, ci.nombre AS producto, m.nombre AS municipio, s.nombre AS sede
     FROM   stock_minimo_punto smp
     JOIN   catalogo_items ci ON ci.id = smp.catalogo_id
     LEFT JOIN municipios  m  ON m.id  = smp.municipio_id
     LEFT JOIN sedes        s  ON s.id  = smp.sede_id
     WHERE  smp.empresa_id = ? AND smp.catalogo_id = ?
       AND  (smp.municipio_id <=> ?) AND (smp.sede_id <=> ?)`,
    [empresaId, catalogo_id, munId, sedeId]
  );
  return updated;
};

// ── Eliminar mínimo ─────────────────────────────────────────────────────────
const eliminar = async (empresaId, id) => {
  const [r] = await pool.query(
    "DELETE FROM stock_minimo_punto WHERE id = ? AND empresa_id = ?",
    [id, empresaId]
  );
  if (!r.affectedRows) throw new AppError("Registro no encontrado.", 404);
};

module.exports = { listar, getAlertas, upsert, eliminar };
