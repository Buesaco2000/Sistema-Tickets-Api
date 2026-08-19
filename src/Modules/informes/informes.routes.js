const { Router } = require('express');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { uploadInforme } = require('../../Utils/uploadFile');
const ctrl = require('./informes.controller');
const router = Router();

router.get('/resumen', authenticate, ctrl.getResumen);
router.get('/', authenticate, ctrl.getAll);
router.patch('/:id/estado', authenticate, ctrl.cambiarEstado);
router.post('/:id/evidencias', authenticate, uploadInforme.single('archivo'), ctrl.subirEvidencia);
router.delete('/evidencias/:id', authenticate, ctrl.remove);
router.get('/:id', authenticate, ctrl.getOne);

module.exports = router;