const router   = require('express').Router();
const { z }    = require('zod');
const ctrl     = require('./ticket.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize }    = require('../../middlewares/rbac.middleware');
const validate         = require('../../middlewares/validate.middleware');
const ROLES            = require('../../utils/roles');

const createSchema = z.object({
  body: z.object({
    titulo:                 z.string().min(1, 'El título es obligatorio.').max(255),
    municipio_incidente_id: z.number().int().positive(),
    tipo_soporte_id:        z.number().int().positive(),
    estado_id:              z.number().int().positive(),
    equipo_id:              z.number().int().positive().optional().nullable(),
    prioridad:              z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
  }),
});

const updateEstadoSchema = z.object({
  body: z.object({ estado_id: z.number().int().positive() }),
});

const assignSchema = z.object({
  body: z.object({
    user_id:      z.number().int().positive(),
    rol_ticket_id: z.number().int().positive().optional().nullable(),
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

// Todos los endpoints de tickets requieren autenticación
router.use(authenticate);

router.get('/',     ctrl.getAll);
router.get('/:id',  validate(idParamSchema), ctrl.getOne);
router.post('/',    validate(createSchema), ctrl.create);
router.patch('/:id/estado',
  validate(idParamSchema),
  validate(updateEstadoSchema),
  ctrl.updateEstado
);
router.delete('/:id',
  validate(idParamSchema),
  authorize(ROLES.ADMIN),
  ctrl.remove
);
router.post('/:id/usuarios',
  validate(idParamSchema),
  authorize(ROLES.ADMIN, ROLES.INGENIERO),
  validate(assignSchema),
  ctrl.assignUser
);

module.exports = router;
