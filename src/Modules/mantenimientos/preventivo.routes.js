const router   = require('express').Router();
const { z }    = require('zod');
const ctrl     = require('./preventivo.controller');
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
    equipo_id:               z.number().int().positive(),
    numero_inventario:       z.number().int().positive(),
    fecha_mantenimiento:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    numero_mantenimiento:    z.number().int().positive(),
    tiempo_horas:            z.number().int().min(0).optional().default(0),
    tiempo_minutos:          z.number().int().min(0).max(59).optional().default(0),
    descripcion:             z.string().optional().nullable(),
    bioseguridad_verificada: z.boolean().optional(),
    equipo_limpio:           z.boolean().optional(),
    observaciones:           z.string().optional().nullable(),
    realizado_por:           z.number().int().positive().optional().nullable(),
    aprobado_por:            z.number().int().positive().optional().nullable(),
    repuestos: z.array(z.object({
      repuesto_id:         z.number().int().positive().optional().nullable(),
      cantidad:            z.number().int().min(0).optional().nullable(),
      verificacion_estado: z.string().max(100).optional().nullable(),
    })).optional(),
    herramientas: z.array(z.object({
      herramienta_id: z.number().int().positive().optional().nullable(),
    })).optional(),
    insumos: z.array(z.object({
      insumo_id: z.number().int().positive().optional().nullable(),
      cantidad:  z.number().int().min(0).optional().nullable(),
    })).optional(),
    actividades: z.array(z.number().int().positive()).optional(),
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
