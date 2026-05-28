const router = require('express').Router();
const svc    = require('./traslados.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const ROLES            = require('../../utils/roles');

router.use(authenticate);

const SALUD_ADMIN_ING = [ROLES.ADMIN, ROLES.SALUD, ROLES.INGENIERO];

// GET /traslados/pendientes  — traslados que llegan a la sede del usuario
router.get('/pendientes', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const data = await svc.getPendientes(req.user.empresa_id, req.user.id, req.user.rol_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /traslados/pendientes/count  — badge contador
router.get('/pendientes/count', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const count = await svc.contarPendientes(req.user.empresa_id, req.user.id, req.user.rol_id);
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

// POST /traslados/:id/confirmar
router.post('/:id/confirmar', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    const responsable = req.body.responsable_destino ||
      (await require('../../config/database').query(
        'SELECT CONCAT(nombres," ",apellidos) AS n FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
      ).then(([[r]]) => r?.n ?? 'Desconocido'));

    const result = await svc.confirmar(
      Number(req.params.id), req.user.empresa_id, req.user.id, responsable
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /traslados/:id/rechazar
router.post('/:id/rechazar', authorize(...SALUD_ADMIN_ING), async (req, res, next) => {
  try {
    await svc.rechazar(Number(req.params.id), req.user.empresa_id, req.user.id, req.user.rol_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
