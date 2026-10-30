const router = require('express').Router();
const svc    = require('./recepcion.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const ROLES            = require('../../Utils/roles');

router.use(authenticate);

const SALUD_ADMIN_ING = [ROLES.ADMIN, ROLES.SALUD, ROLES.INGENIERO];

router.get('/resumen', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const pool       = require('../../Config/database');
    const eid        = req.user.empresa_id;
    const municipioId = req.query.municipio_id ? parseInt(req.query.municipio_id, 10) : null;

    const munCond  = municipioId ? ' AND r.municipio_id = ?' : '';
    const munCond2 = municipioId ? ' AND municipio_id = ?'   : '';
    const munParam = municipioId ? [municipioId] : [];

    const [[totales], [porCategoria], [recientes]] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                     AS total_recepciones,
          SUM(estado = 'COMPLETADA')   AS completadas,
          SUM(estado = 'BORRADOR')     AS borradores,
          0                            AS pendientes,
          (SELECT COUNT(*)
           FROM items_recepcion_inventario i
           JOIN recepciones_inventario r2 ON r2.id = i.recepcion_id
           WHERE r2.empresa_id = ? AND r2.deleted_at IS NULL
             AND r2.estado = 'COMPLETADA'
             ${municipioId ? 'AND r2.municipio_id = ?' : ''}
             AND i.fecha_vencimiento IS NOT NULL
             AND i.fecha_vencimiento < CURDATE()
             AND (COALESCE(i.cant_recepcionada, 0)
                  - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                              WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
                  - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                              JOIN dispensaciones d ON d.id = di.dispensacion_id
                              WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
                 ) > 0
          )                            AS items_vencidos,
          (SELECT COUNT(*)
           FROM items_recepcion_inventario i
           JOIN recepciones_inventario r2 ON r2.id = i.recepcion_id
           WHERE r2.empresa_id = ? AND r2.deleted_at IS NULL
             AND r2.estado = 'COMPLETADA'
             ${municipioId ? 'AND r2.municipio_id = ?' : ''}
             AND i.fecha_vencimiento IS NOT NULL
             AND i.fecha_vencimiento >= CURDATE()
             AND i.fecha_vencimiento < DATE_ADD(CURDATE(), INTERVAL 123 DAY)
             AND (COALESCE(i.cant_recepcionada, 0)
                  - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                              WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
                  - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                              JOIN dispensaciones d ON d.id = di.dispensacion_id
                              WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
                 ) > 0
          )                            AS proximos_vencer
        FROM recepciones_inventario
        WHERE empresa_id = ?${munCond2} AND deleted_at IS NULL`,
        [eid, ...(municipioId ? [municipioId] : []), eid, ...(municipioId ? [municipioId] : []), eid, ...munParam]),

      pool.query(`
        SELECT i.tipo_recepcion AS categoria, COUNT(*) AS total
        FROM items_recepcion_inventario i
        JOIN recepciones_inventario r ON r.id = i.recepcion_id
        WHERE r.empresa_id = ?${munCond} AND r.deleted_at IS NULL AND r.estado = 'COMPLETADA'
        GROUP BY i.tipo_recepcion`, [eid, ...munParam]),

      pool.query(`
        SELECT r.id, r.municipio_id, m.nombre AS municipio, r.estado,
               r.remision_factura,
               r.created_at, CONCAT(u.nombres,' ',u.apellidos) AS creado_por,
               COUNT(i.id) AS total_items
        FROM recepciones_inventario r
        LEFT JOIN municipios m ON m.id = r.municipio_id
        LEFT JOIN users u ON u.id = r.created_by
        LEFT JOIN items_recepcion_inventario i ON i.recepcion_id = r.id
        WHERE r.empresa_id = ?${munCond} AND r.deleted_at IS NULL AND r.estado = 'COMPLETADA'
        GROUP BY r.id, m.nombre, r.estado, r.remision_factura, r.created_at, u.nombres, u.apellidos, r.municipio_id
        ORDER BY r.created_at DESC LIMIT 6`, [eid, ...munParam]),
    ]);

    res.json({ success: true, data: { ...totales[0], porCategoria, recientes } });
  } catch (err) { next(err); }
});

// Endpoint ligero para el badge del Sidebar — solo cuenta ítems por vencer y vencidos con stock > 0
router.get('/alertas-badge', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const pool = require('../../Config/database');
    const eid  = req.user.empresa_id;
    const cargo = (req.user.cargo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const verTodo = req.user.rol_id === 1
      || cargo.includes('almacen')
      || cargo.includes('director tecnico');
    const municipioId = !verTodo && req.user.municipio_id ? req.user.municipio_id : null;
    const munCond = municipioId ? ' AND r2.municipio_id = ?' : '';

    const stockCalc = `(
      COALESCE(i.cant_recepcionada, 0)
      - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                  WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
      - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                  JOIN dispensaciones d ON d.id = di.dispensacion_id
                  WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
      + COALESCE((SELECT SUM(a.cantidad) FROM ajustes_inventario a
                  WHERE a.item_id = i.id), 0)
    )`;

    const base = [eid, ...(municipioId ? [municipioId] : [])];

    const [rows] = await pool.query(`
      SELECT
        i.tipo_recepcion,
        COALESCE(SUM(
          i.fecha_vencimiento IS NOT NULL
          AND i.fecha_vencimiento < CURDATE()
          AND ${stockCalc} > 0
        ), 0) AS vencidos,
        COALESCE(SUM(
          i.fecha_vencimiento IS NOT NULL
          AND i.fecha_vencimiento >= CURDATE()
          AND i.fecha_vencimiento < DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          AND ${stockCalc} > 0
        ), 0) AS proximos_vencer
      FROM items_recepcion_inventario i
      JOIN recepciones_inventario r2 ON r2.id = i.recepcion_id
      WHERE r2.empresa_id = ?${munCond}
        AND r2.deleted_at IS NULL
        AND r2.estado = 'COMPLETADA'
      GROUP BY i.tipo_recepcion
    `, base);

    // Totales globales + desglose por categoría
    let totalVencidos = 0, totalProximos = 0;
    const porCategoria = {};
    for (const r of rows) {
      const v = Number(r.vencidos), p = Number(r.proximos_vencer);
      totalVencidos += v;
      totalProximos += p;
      porCategoria[r.tipo_recepcion] = { vencidos: v, proximos_vencer: p };
    }

    res.json({
      success: true,
      data: {
        vencidos:        totalVencidos,
        proximos_vencer: totalProximos,
        por_categoria:   porCategoria,
      },
    });
  } catch (err) { next(err); }
});

// Listado individual de ítems vencidos/próximos — para campana in-app
router.get('/alertas-vencimiento', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const pool     = require('../../Config/database');
    const eid      = req.user.empresa_id;
    const cargo    = (req.user.cargo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const verTodo  = req.user.rol_id === 1 || cargo.includes('almacen') || cargo.includes('director tecnico');
    const munId    = !verTodo && req.user.municipio_id ? req.user.municipio_id : null;
    const munCond  = munId ? ' AND r.municipio_id = ?' : '';
    const params   = [eid, ...(munId ? [munId] : [])];

    const STOCK = `(
      COALESCE(i.cant_recepcionada, 0)
      - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
                  WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
      - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
                  JOIN dispensaciones d ON d.id = di.dispensacion_id
                  WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
      + COALESCE((SELECT SUM(a.cantidad) FROM ajustes_inventario a
                  WHERE a.item_id = i.id), 0)
    )`;

    const [rows] = await pool.query(`
      SELECT i.nombre, i.lote, i.tipo_recepcion,
             i.fecha_vencimiento,
             DATEDIFF(i.fecha_vencimiento, CURDATE()) AS dias_restantes,
             CAST(${STOCK} AS SIGNED)                 AS stock,
             mu.nombre AS municipio,
             CASE WHEN i.fecha_vencimiento < CURDATE() THEN 'VENCIDO' ELSE 'PROXIMO' END AS estado
      FROM items_recepcion_inventario i
      JOIN recepciones_inventario r ON r.id = i.recepcion_id
      LEFT JOIN municipios mu ON mu.id = r.municipio_id
      WHERE r.empresa_id = ?${munCond}
        AND r.deleted_at IS NULL
        AND r.estado = 'COMPLETADA'
        AND i.fecha_vencimiento IS NOT NULL
        AND i.fecha_vencimiento < DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND ${STOCK} > 0
      ORDER BY i.fecha_vencimiento ASC
      LIMIT 20
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── Reporte valorizado ─────────────────────────────────────────────────────
router.get('/valorizado/reporte', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const { formato = 'json', ...filters } = req.query;
    const rows = await svc.getValorizadoReporte(
      req.user.empresa_id, req.user.id, req.user.rol_id, req.user.cargo, filters,
    );

    if (formato === 'xlsx') {
      const XLSX   = require('xlsx');
      const LABELS = {
        MEDICAMENTOS: 'Medicamentos', LABORATORIO: 'Laboratorio',
        MEDICO_QUIRURGICO: 'Méd. Quirúrgico', ASEO_PAPELERIA: 'Aseo y Papelería',
        ODONTOLOGIA: 'Odontología',
      };
      const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';
      const fmtCop  = (n) => n != null ? Number(n) : 0;

      const data = rows.map((r, i) => ({
        '#':                      i + 1,
        'Categoría':              LABELS[r.tipo_recepcion] ?? r.tipo_recepcion,
        'Código':                 r.codigo_interno ?? '—',
        'Nombre':                 r.nombre,
        'Concentración':          r.concentracion ?? '—',
        'Presentación':           r.presentacion_comercial ?? '—',
        'Lote':                   r.lote ?? '—',
        'Vencimiento':            fmtDate(r.fecha_vencimiento),
        'Fecha recepción':        fmtDate(r.fecha_recepcion),
        'Proveedor':              r.proveedor ?? '—',
        'N° Factura':             r.remision_factura ?? '—',
        'Municipio':              r.municipio ?? '—',
        'Sede':                   r.sede ?? '—',
        'Cant. recepcionada':     Number(r.cant_recepcionada ?? 0),
        'Stock actual':           Number(r.stock ?? 0),
        'Precio unitario (COP)':  fmtCop(r.precio_unitario),
        'Valor total (COP)':      fmtCop(r.valor_total),
      }));

      const wb  = XLSX.utils.book_new();
      const ws  = XLSX.utils.json_to_sheet(data);
      // Ajuste de ancho de columnas
      ws['!cols'] = [
        {wch:4},{wch:16},{wch:10},{wch:40},{wch:16},{wch:18},{wch:12},{wch:12},
        {wch:14},{wch:24},{wch:14},{wch:14},{wch:14},{wch:16},{wch:12},{wch:20},{wch:18},
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario Valorizado');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="inventario_valorizado_${fecha}.xlsx"`);
      return res.send(buf);
    }

    // JSON: agregar totales en la respuesta
    const totalValor = rows.reduce((acc, r) => acc + Number(r.valor_total ?? 0), 0);
    const sinPrecio  = rows.filter((r) => r.precio_unitario == null).length;
    res.json({ success: true, data: { rows, totalValor, sinPrecio, total: rows.length } });
  } catch (err) { next(err); }
});

router.get('/', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findAll(req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/items', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findAllItems(req.user.empresa_id, req.user.id, req.user.rol_id, req.user.cargo);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/items/reporte', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findItemsForReport(req.user.empresa_id, req.user.id, req.user.rol_id, req.user.cargo);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

//  BORRADOR 
router.get('/borrador/mio', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findBorradorByUser(req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/borrador', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.saveBorrador(req.body, req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/borrador/:id', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    await svc.deleteBorrador(Number(req.params.id), req.user.id, req.user.empresa_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// REPORTE DE SALIDAS (directas + distribución)
router.get('/salidas-reporte', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.getSalidasReporte(
      req.user.empresa_id,
      req.user.id,
      req.user.rol_id,
      req.user.cargo,
      req.query
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

//  SALIDAS
router.post('/salidas', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const id = await svc.createSalida(req.body, req.user.id, req.user.empresa_id);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
});

router.get('/salidas/:item_id', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.getSalidasByItem(Number(req.params.item_id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

//  DISPENSACIONES 
router.get('/dispensaciones/:item_id', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.getDispensacionesByItem(Number(req.params.item_id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/items/:id/trazabilidad', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.getTrazabilidad(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.create(req.body, req.user.id, req.user.empresa_id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findById(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    await svc.softDelete(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
