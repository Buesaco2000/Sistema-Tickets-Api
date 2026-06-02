const router = require('express').Router();
const svc    = require('./recepcion.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const ROLES            = require('../../utils/roles');

router.use(authenticate);

const SALUD_ADMIN_ING = [ROLES.ADMIN, ROLES.SALUD, ROLES.INGENIERO];

router.get('/', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findAll(req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/items', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findAllItems(req.user.empresa_id, req.user.id, req.user.rol_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── BORRADOR: obtener el borrador activo del usuario autenticado ──────────────
router.get('/borrador/mio', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.findBorradorByUser(req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── BORRADOR: guardar o actualizar borrador ───────────────────────────────────
router.post('/borrador', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.saveBorrador(req.body, req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── BORRADOR: eliminar borrador ───────────────────────────────────────────────
router.delete('/borrador/:id', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    await svc.deleteBorrador(Number(req.params.id), req.user.id, req.user.empresa_id);
    res.json({ success: true });
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

module.exports = router;
