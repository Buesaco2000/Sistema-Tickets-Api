const router = require('express').Router();
const svc = require('./catalogoMedicamentos.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize } = require('../../Middlewares/rbac.middleware');

router.use(authenticate);

// Búsqueda abierta a todos los roles (regentes usan esto en la recepción)
router.get('/buscar', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });
    const data = await svc.search(q, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const data = await svc.findAll(req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await svc.findById(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Solo ADMIN puede gestionar el catálogo
router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = await svc.create(req.body, req.user.empresa_id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = await svc.update(Number(req.params.id), req.body, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await svc.softDelete(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
