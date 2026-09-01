const { Router } = require('express');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const ROLES            = require('../../Utils/roles');
const { uploadInforme } = require('../../Utils/uploadFile');
const ctrl = require('./informes.controller');

const router = Router();

const ARCHIVOS_ADMIN = [ROLES.ADMIN, ROLES.ARCHIVOS];

router.get('/resumen',              authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getResumen);
router.get('/anios',                authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getAnios);
router.get('/',                     authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getAll);
router.get('/:id',                  authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getOne);
router.patch('/:id/estado',         authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.cambiarEstado);
router.post('/:id/evidencias',      authenticate, authorize(...ARCHIVOS_ADMIN), uploadInforme.single('archivo'), ctrl.subirEvidencia);
router.delete('/evidencias/:id',    authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.remove);

module.exports = router;
