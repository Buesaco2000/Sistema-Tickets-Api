const router   = require('express').Router();
const { z }    = require('zod');
const ctrl     = require('./user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize }    = require('../../middlewares/rbac.middleware');
const validate         = require('../../middlewares/validate.middleware');
const ROLES            = require('../../utils/roles');

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

const updateSchema = z.object({
  body: z.object({
    nombres:      z.string().min(2).max(150).optional(),
    apellidos:    z.string().min(2).max(150).optional(),
    telefono:     z.string().max(15).optional().nullable(),
    rol_id:       z.number().int().positive().optional().nullable(),
    cargo_id:     z.number().int().positive().optional().nullable(),
    municipio_id: z.number().int().positive().optional().nullable(),
  }).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo.' }),
});

const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, 'Contraseña actual requerida.'),
    new_password:     z.string().min(8, 'Mínimo 8 caracteres.').max(100),
  }),
});

const estadoSchema = z.object({
  body: z.object({ activo: z.boolean() }),
});

router.use(authenticate);

// Directorio de nombres — accesible a todos los roles autenticados
router.get('/directorio', ctrl.getDirectorio);

router.get('/',     authorize(ROLES.ADMIN), ctrl.getAll);
router.get('/:id',  validate(idParam), ctrl.getOne);
router.put('/:id',  validate(idParam), validate(updateSchema), ctrl.update);
router.patch('/:id/password', validate(idParam), validate(changePasswordSchema), ctrl.changePassword);
router.patch('/:id/estado',   validate(idParam), validate(estadoSchema), authorize(ROLES.ADMIN), ctrl.setActivo);
router.delete('/:id',         validate(idParam), authorize(ROLES.ADMIN), ctrl.remove);

module.exports = router;
