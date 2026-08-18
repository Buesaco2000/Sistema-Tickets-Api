const router   = require('express').Router();
const svc      = require('./dispensaciones.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const validate         = require('../../Middlewares/validate.middleware');
const { getPagination } = require('../../utils/pagination');
const { crearSchema, idParamSchema } = require('./dispensaciones.schema');
const ROLES            = require('../../utils/roles');

// Todas las rutas requieren sesión activa
router.use(authenticate);

// Los roles que pueden usar dispensaciones: ADMIN y SALUD
const SALUD_ADMIN = [ROLES.ADMIN, ROLES.SALUD];

router.post('/', authorize(...SALUD_ADMIN), validate(crearSchema), async (req, res, next) => {
  try {
    const id = await svc.crear(req.body, req.user.id, req.user.empresa_id);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
});


router.get('/', authorize(...SALUD_ADMIN), async (req, res, next) => {
  try {
    const pag    = getPagination(req.query);
    const result = await svc.listar(
      req.user.empresa_id,
      req.user.id,
      req.user.rol_id,
      req.user.cargo,
      pag
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});


router.get('/pendientes/mias', authorize(...SALUD_ADMIN), async (req, res, next) => {
  try {
    const data = await svc.pendientesParaUsuario(req.user.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});


router.get('/:id', authorize(...SALUD_ADMIN), validate(idParamSchema), async (req, res, next) => {
  try {
    const data = await svc.detalle(req.params.id, req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/:id/aceptar', authorize(...SALUD_ADMIN), validate(idParamSchema), async (req, res, next) => {
  try {
    const nombre = `${req.user.nombres} ${req.user.apellidos}`;
    await svc.aceptar(req.params.id, req.user.empresa_id, req.user.id, nombre);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/rechazar', authorize(...SALUD_ADMIN), validate(idParamSchema), async (req, res, next) => {
  try {
    await svc.rechazar(req.params.id, req.user.empresa_id, req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
