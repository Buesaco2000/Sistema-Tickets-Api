const router   = require('express').Router();
const { z }    = require('zod');
const ctrl     = require('./correctivo.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize }    = require('../../middlewares/rbac.middleware');
const validate         = require('../../middlewares/validate.middleware');
const ROLES            = require('../../utils/roles');
const { uploadMantImagen } = require('../../utils/uploadFile');

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

const createSchema = z.object({
  body: z.object({
    equipo_id:            z.number().int().positive(),
    estado_id:            z.number().int().positive(),
    fecha_inicio:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    falla_reportada:      z.string().min(5),
    accion_correctiva:    z.string().min(5),
    fecha_entrega:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tipo_servicio:        z.enum([
      'CORRECTIVO', 'PREVENTIVO', 'INSTALACION',
      'LLAMADO_EMERGENCIA', 'REVISION', 'ACTUALIZACION',
    ]).optional().nullable(),
    se_instalaron_partes: z.boolean().optional(),
    observaciones:        z.string().optional().nullable(),
    duracion_horas:       z.number().int().min(0).max(255).optional().nullable(),
    duracion_minutos:     z.number().int().min(0).max(59).optional().nullable(),
    costo_servicio:       z.number().nonnegative().optional().nullable(),
    realizado_por:        z.number().int().positive().optional().nullable(),
    aprobado_por:         z.number().int().positive().optional().nullable(),
    repuestos: z.array(z.object({
      repuesto_id:  z.number().int().positive().optional().nullable(),
      descripcion:  z.string().optional().nullable(),
      cantidad:     z.number().int().min(1),
    })).optional(),
    imagen_antes:   z.string().optional().nullable(),
    imagen_despues: z.string().optional().nullable(),
  }),
});

router.use(authenticate);

router.post('/upload-imagen', authorize(ROLES.ADMIN, ROLES.INGENIERO), uploadMantImagen.single('file'), ctrl.uploadImagen);
router.get('/',    ctrl.getAll);
router.get('/:id', validate(idParam), ctrl.getOne);
router.post('/',   authorize(ROLES.ADMIN, ROLES.INGENIERO), validate(createSchema), ctrl.create);
router.put('/:id', validate(idParam), authorize(ROLES.ADMIN, ROLES.INGENIERO), ctrl.update);
router.delete('/:id', validate(idParam), authorize(ROLES.ADMIN), ctrl.remove);

module.exports = router;
