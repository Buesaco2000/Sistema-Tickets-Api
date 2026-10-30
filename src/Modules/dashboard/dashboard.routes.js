const router = require('express').Router();
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const AppError         = require('../../Utils/AppError');
const ROLES            = require('../../Utils/roles');
const svc              = require('./dashboard.service');

router.use(authenticate);

// Todos los roles autenticados pueden llamar al endpoint;
// el servicio decide qué bloques devolver según cargo/rol.
const TODOS = [ROLES.ADMIN, ROLES.SALUD, ROLES.INGENIERO, ROLES.ARCHIVOS];

router.get('/ejecutivo', authorize(...TODOS), async (req, res, next) => {
  try {
    const { verInventario, verCumplimiento } = svc.resolveAcceso(req.user);

    if (!verInventario && !verCumplimiento) {
      return next(new AppError('Sin acceso al dashboard ejecutivo.', 403));
    }

    const data = await svc.getEjecutivo(req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
