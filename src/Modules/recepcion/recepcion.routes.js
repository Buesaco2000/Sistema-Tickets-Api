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
             ${municipioId ? 'AND r2.municipio_id = ?' : ''}
             AND i.fecha_vencimiento IS NOT NULL
             AND i.fecha_vencimiento < CURDATE()
          )                            AS items_vencidos
        FROM recepciones_inventario
        WHERE empresa_id = ?${munCond2} AND deleted_at IS NULL`,
        [eid, ...(municipioId ? [municipioId] : []), eid, ...munParam]),

      pool.query(`
        SELECT i.tipo_recepcion AS categoria, COUNT(*) AS total
        FROM items_recepcion_inventario i
        JOIN recepciones_inventario r ON r.id = i.recepcion_id
        WHERE r.empresa_id = ?${munCond} AND r.deleted_at IS NULL AND r.estado = 'COMPLETADA'
        GROUP BY i.tipo_recepcion`, [eid, ...munParam]),

      pool.query(`
        SELECT r.id, r.municipio_id, m.nombre AS municipio, r.estado,
               r.created_at, CONCAT(u.nombres,' ',u.apellidos) AS creado_por,
               COUNT(i.id) AS total_items
        FROM recepciones_inventario r
        LEFT JOIN municipios m ON m.id = r.municipio_id
        LEFT JOIN users u ON u.id = r.created_by
        LEFT JOIN items_recepcion_inventario i ON i.recepcion_id = r.id
        WHERE r.empresa_id = ?${munCond} AND r.deleted_at IS NULL
        GROUP BY r.id, m.nombre, r.estado, r.created_at, u.nombres, u.apellidos, r.municipio_id
        ORDER BY r.created_at DESC LIMIT 6`, [eid, ...munParam]),
    ]);

    res.json({ success: true, data: { ...totales[0], porCategoria, recientes } });
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
