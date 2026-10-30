const pool  = require('../../Config/database');
const ROLES = require('../../Utils/roles');

// Determina si el usuario puede ver cada bloque y su municipio_id de filtro
function resolveAcceso(user) {
  const c = (user.cargo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const isAdmin       = user.rol_id === ROLES.ADMIN;
  const esDirector    = c.includes('director tecnico');
  const esAlmacen     = c.includes('almacen');
  const esCoordAdm    = c.includes('coordinador administrativo');

  const verInventario   = isAdmin || esDirector || esAlmacen;
  const verCumplimiento = isAdmin || esCoordAdm;
  const verTickets      = isAdmin;

  // Almacén ve TODO el inventario sin filtro de municipio (igual que ADMIN para esos bloques)
  // Solo el Director Técnico queda filtrado por su municipio
  const municipioFiltro = (isAdmin || esAlmacen) ? null : (user.municipio_id ?? null);

  return { isAdmin, verInventario, verCumplimiento, verTickets, municipioFiltro };
}

// ─── BLOQUE INVENTARIO ───────────────────────────────────────────────────────
async function getInventario(empresaId, municipioId) {
  const munCond  = municipioId ? ' AND r.municipio_id = ?' : '';
  const munParam = municipioId ? [municipioId] : [];

  // KPIs principales con stock calculado
  const [[kpis]] = await pool.query(`
    WITH sc AS (
      SELECT i.id, i.fecha_vencimiento, i.precio_unitario, i.tipo_recepcion,
        GREATEST(0,
          COALESCE(i.cant_recepcionada, 0)
          - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                      WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
          - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                      JOIN dispensaciones d ON d.id = di.dispensacion_id
                      WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
          + COALESCE((SELECT SUM(a.cantidad) FROM ajustes_inventario a
                      WHERE a.item_id = i.id), 0)
        ) AS stock
      FROM items_recepcion_inventario i
      JOIN recepciones_inventario r ON r.id = i.recepcion_id
      WHERE r.empresa_id = ? AND r.deleted_at IS NULL AND r.estado = 'COMPLETADA'${munCond}
    )
    SELECT
      COUNT(*) AS total_items,
      COALESCE(SUM(stock), 0) AS total_stock,
      COALESCE(SUM(stock * COALESCE(precio_unitario, 0)), 0) AS valor_total,
      COUNT(CASE WHEN fecha_vencimiento < CURDATE() AND stock > 0 THEN 1 END) AS vencidos,
      COUNT(CASE WHEN fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND stock > 0 THEN 1 END) AS por_vencer
    FROM sc
  `, [empresaId, ...munParam]);

  // Stock por categoría (top 5)
  const [porCategoria] = await pool.query(`
    SELECT i.tipo_recepcion AS categoria,
      COALESCE(SUM(GREATEST(0,
        COALESCE(i.cant_recepcionada, 0)
        - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                    WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
        - COALESCE((SELECT SUM(di2.cantidad) FROM dispensacion_items di2
                    JOIN dispensaciones d2 ON d2.id = di2.dispensacion_id
                    WHERE di2.item_id = i.id AND d2.estado != 'RECHAZADO'), 0)
        + COALESCE((SELECT SUM(aj.cantidad) FROM ajustes_inventario aj
                    WHERE aj.item_id = i.id), 0)
      )), 0) AS stock
    FROM items_recepcion_inventario i
    JOIN recepciones_inventario r ON r.id = i.recepcion_id
    WHERE r.empresa_id = ? AND r.deleted_at IS NULL AND r.estado = 'COMPLETADA'${munCond}
    GROUP BY i.tipo_recepcion
    ORDER BY stock DESC
  `, [empresaId, ...munParam]);

  return {
    total_items:  Number(kpis.total_items),
    total_stock:  Number(kpis.total_stock),
    valor_total:  Number(kpis.valor_total),
    vencidos:     Number(kpis.vencidos),
    por_vencer:   Number(kpis.por_vencer),
    por_categoria: porCategoria.map(r => ({
      categoria: r.categoria,
      stock: Number(r.stock),
    })),
  };
}

// ─── BLOQUE DISPENSACIONES ───────────────────────────────────────────────────
async function getDispensaciones(empresaId, municipioId) {
  const munCond  = municipioId ? ' AND d.municipio_id = ?' : '';
  const munParam = municipioId ? [municipioId] : [];

  // KPIs del mes actual
  const [[mes]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(estado = 'ACEPTADO')  AS aceptadas,
      SUM(estado = 'PENDIENTE') AS pendientes,
      SUM(estado = 'RECHAZADO') AS rechazadas
    FROM dispensaciones d
    WHERE d.empresa_id = ?
      AND YEAR(d.created_at)  = YEAR(CURDATE())
      AND MONTH(d.created_at) = MONTH(CURDATE())${munCond}
  `, [empresaId, ...munParam]);

  // Tendencia últimos 6 meses
  const [tendencia] = await pool.query(`
    SELECT DATE_FORMAT(d.created_at, '%Y-%m') AS mes,
           COUNT(DISTINCT d.id) AS total
    FROM dispensaciones d
    WHERE d.empresa_id = ? AND d.estado != 'RECHAZADO'
      AND d.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)${munCond}
    GROUP BY mes
    ORDER BY mes ASC
  `, [empresaId, ...munParam]);

  // Top 5 medicamentos (últimos 30 días)
  const [top5] = await pool.query(`
    SELECT di.medicamento_nombre AS nombre, SUM(di.cantidad) AS cantidad
    FROM dispensacion_items di
    JOIN dispensaciones d ON d.id = di.dispensacion_id
    WHERE d.empresa_id = ? AND d.estado != 'RECHAZADO'
      AND d.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)${munCond}
    GROUP BY di.medicamento_nombre
    ORDER BY cantidad DESC
    LIMIT 5
  `, [empresaId, ...munParam]);

  return {
    mes_actual: {
      total:      Number(mes.total),
      aceptadas:  Number(mes.aceptadas  || 0),
      pendientes: Number(mes.pendientes || 0),
      rechazadas: Number(mes.rechazadas || 0),
    },
    tendencia: tendencia.map(r => ({ mes: r.mes, total: Number(r.total) })),
    top5:      top5.map(r => ({ nombre: r.nombre, cantidad: Number(r.cantidad) })),
  };
}

// ─── BLOQUE CUMPLIMIENTO ─────────────────────────────────────────────────────
async function getCumplimiento(empresaId, municipioId) {
  const munCond  = municipioId ? ' AND u.municipio_id = ?' : '';
  const munParam = municipioId ? [municipioId] : [];
  const anio     = new Date().getFullYear();

  // KPIs resumen
  const [[kpis]] = await pool.query(`
    SELECT
      COUNT(CASE WHEN e.nombre = 'VENCIDO' THEN 1 END) AS vencidos,
      COUNT(CASE WHEN e.nombre NOT IN ('PRESENTADO','NO_APLICA','VENCIDO')
                  AND DATEDIFF(ei.fecha_limite, CURDATE()) <= 15 THEN 1 END) AS criticos,
      COUNT(CASE WHEN e.nombre NOT IN ('PRESENTADO','NO_APLICA','VENCIDO')
                  AND DATEDIFF(ei.fecha_limite, CURDATE()) BETWEEN 16 AND 30 THEN 1 END) AS proximos,
      COUNT(CASE WHEN e.nombre = 'PRESENTADO' THEN 1 END) AS cumplidos,
      COUNT(CASE WHEN e.nombre != 'NO_APLICA' THEN 1 END) AS total_validos
    FROM ejecucion_informe ei
    JOIN estados e    ON e.id  = ei.estado_id
    JOIN obligacion o ON o.id  = ei.obligacion_id
    LEFT JOIN users u ON u.id  = o.responsable_id
    WHERE ei.empresa_id = ? AND ei.deleted_at IS NULL AND YEAR(ei.fecha_corte) = ?${munCond}
  `, [empresaId, anio, ...munParam]);

  const pct = kpis.total_validos > 0
    ? Math.round((kpis.cumplidos / kpis.total_validos) * 100)
    : 0;

  // Informes urgentes (≤7 días o vencidos, máx 5)
  const [urgentes] = await pool.query(`
    SELECT ei.id, o.codigo, o.nombre AS informe,
           er.nombre AS ente_rector, ei.etiqueta_corte, ei.fecha_limite,
           DATEDIFF(ei.fecha_limite, CURDATE()) AS dias_restantes,
           e.nombre AS estado
    FROM ejecucion_informe ei
    JOIN obligacion   o  ON o.id  = ei.obligacion_id
    JOIN ente_rector  er ON er.id = o.ente_rector_id
    JOIN estados      e  ON e.id  = ei.estado_id
    LEFT JOIN users   u  ON u.id  = o.responsable_id
    WHERE ei.empresa_id = ? AND ei.deleted_at IS NULL
      AND e.nombre NOT IN ('PRESENTADO','NO_APLICA')
      AND DATEDIFF(ei.fecha_limite, CURDATE()) <= 7
      AND YEAR(ei.fecha_corte) = ?${munCond}
    ORDER BY dias_restantes ASC
    LIMIT 5
  `, [empresaId, anio, ...munParam]);

  return {
    anio,
    vencidos:        Number(kpis.vencidos),
    criticos:        Number(kpis.criticos),
    proximos:        Number(kpis.proximos),
    cumplidos:       Number(kpis.cumplidos),
    pct_oportunidad: pct,
    urgentes:        urgentes.map(r => ({
      id:             r.id,
      codigo:         r.codigo,
      informe:        r.informe,
      ente_rector:    r.ente_rector,
      etiqueta_corte: r.etiqueta_corte,
      dias_restantes: Number(r.dias_restantes),
      estado:         r.estado,
    })),
  };
}

// ─── BLOQUE TICKETS ──────────────────────────────────────────────────────────
async function getTickets(empresaId) {
  // KPIs del mes actual
  const [[mes]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(t.fecha_cierre IS NULL) AS abiertos,
      SUM(t.fecha_cierre IS NOT NULL) AS cerrados
    FROM tickets t
    WHERE t.empresa_id = ?
      AND YEAR(t.created_at)  = YEAR(CURDATE())
      AND MONTH(t.created_at) = MONTH(CURDATE())
  `, [empresaId]);

  // Abiertos acumulados (sin fecha_cierre, cualquier fecha)
  const [[acum]] = await pool.query(`
    SELECT COUNT(*) AS abiertos_total
    FROM tickets t
    WHERE t.empresa_id = ? AND t.fecha_cierre IS NULL
  `, [empresaId]);

  // Por tipo (este año)
  const [porTipo] = await pool.query(`
    SELECT ts.nombre AS tipo, COUNT(*) AS total
    FROM tickets t
    JOIN tipos_soporte ts ON ts.id = t.tipo_soporte_id
    WHERE t.empresa_id = ? AND YEAR(t.created_at) = YEAR(CURDATE())
    GROUP BY ts.nombre
    ORDER BY total DESC
  `, [empresaId]);

  // Tendencia creación últimos 6 meses
  const [tendencia] = await pool.query(`
    SELECT DATE_FORMAT(t.created_at, '%Y-%m') AS mes, COUNT(*) AS total
    FROM tickets t
    WHERE t.empresa_id = ?
      AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY mes
    ORDER BY mes ASC
  `, [empresaId]);

  return {
    mes_actual: {
      total:    Number(mes.total),
      abiertos: Number(mes.abiertos  || 0),
      cerrados: Number(mes.cerrados  || 0),
    },
    abiertos_total: Number(acum.abiertos_total),
    por_tipo:  porTipo.map(r => ({ tipo: r.tipo, total: Number(r.total) })),
    tendencia: tendencia.map(r => ({ mes: r.mes, total: Number(r.total) })),
  };
}

// ─── ENDPOINT PRINCIPAL ──────────────────────────────────────────────────────
async function getEjecutivo(user) {
  const { verInventario, verCumplimiento, verTickets, municipioFiltro } = resolveAcceso(user);

  const [inventario, dispensaciones, cumplimiento, tickets] = await Promise.all([
    verInventario   ? getInventario(user.empresa_id, municipioFiltro)     : Promise.resolve(null),
    verInventario   ? getDispensaciones(user.empresa_id, municipioFiltro) : Promise.resolve(null),
    verCumplimiento ? getCumplimiento(user.empresa_id, municipioFiltro)   : Promise.resolve(null),
    verTickets      ? getTickets(user.empresa_id)                         : Promise.resolve(null),
  ]);

  return { inventario, dispensaciones, cumplimiento, tickets };
}

module.exports = { getEjecutivo, resolveAcceso };
