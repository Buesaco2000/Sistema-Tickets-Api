const router   = require('express').Router();
const svc      = require('./ajustes.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const validate         = require('../../Middlewares/validate.middleware');
const ROLES    = require('../../Utils/roles');
const AppError = require('../../Utils/AppError');
const { crearSchema } = require('./ajustes.schema');

router.use(authenticate);

// Solo ADMIN y SALUD pueden crear ajustes; el controller verificará además el cargo
router.post('/', authorize(ROLES.ADMIN, ROLES.SALUD), validate(crearSchema), async (req, res, next) => {
  try {
    if (req.user.rol_id !== ROLES.ADMIN && !req.user.es_almacen && !req.user.es_director_tecnico) {
      return next(new AppError('No autorizado para crear ajustes de inventario.', 403));
    }

    const data = await svc.create(req.body, req.user.id, req.user.empresa_id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/item/:item_id', authorize(ROLES.ADMIN, ROLES.SALUD), async (req, res, next) => {
  try {
    const data = await svc.findByItem(Number(req.params.item_id), req.user.empresa_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
