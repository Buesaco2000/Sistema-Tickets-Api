const router   = require('express').Router();
const svc      = require('./conteoFisico.service');
const AppError = require('../../Utils/AppError');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const ROLES            = require('../../Utils/roles');

router.use(authenticate);

const ADMIN_SALUD = [ROLES.ADMIN, ROLES.SALUD];

const esPrivilegiado = (user) => {
  const c = (user.cargo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return user.rol_id === ROLES.ADMIN || c.includes('almacen') || c.includes('director');
};

router.get('/', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    const data = await svc.listar(req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('Solo ADMIN o Almacén puede crear conteos.', 403);
    const data = await svc.crear(req.body, req.user.id, req.user.empresa_id);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/:id', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    const data = await svc.getById(Number(req.params.id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.patch('/:id/items', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('No tienes permiso para editar este conteo.', 403);
    await svc.actualizarItems(Number(req.params.id), req.body.items ?? [], req.user.empresa_id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post('/:id/cerrar', authorize(...ADMIN_SALUD), async (req, res, next) => {
  try {
    if (!esPrivilegiado(req.user)) throw new AppError('Solo ADMIN o Almacén puede cerrar conteos.', 403);
    const { crearAjustes = false } = req.body;
    const data = await svc.cerrar(Number(req.params.id), crearAjustes, req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

module.exports = router;
