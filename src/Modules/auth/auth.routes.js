const router    = require('express').Router();
const { z }     = require('zod');
const rateLimit = require('express-rate-limit');
const ctrl      = require('./auth.controller');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const validate         = require('../../Middlewares/validate.middleware');
const ROLES            = require('../../Utils/roles');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { success: false, message: 'Demasiados intentos de autenticación.' },
});

const loginSchema = z.object({
  body: z.object({
    email:      z.string().email('Email inválido.'),
    password:   z.string().min(1, 'Password requerido.'),
    empresa_id: z.number().int().positive('ID de empresa requerido.'),
  }),
});

const registerSchema = z.object({
  body: z.object({
    nombres:      z.string().min(2).max(150),
    apellidos:    z.string().min(2).max(150),
    email:        z.string().email(),
    password:     z.string().min(8, 'Mínimo 8 caracteres.').max(100),
    empresa_id:   z.number().int().positive(),
    rol_id:       z.number().int().positive().optional().nullable(),
    cargo_id:     z.number().int().positive().optional().nullable(),
    municipio_id: z.number().int().positive().optional().nullable(),
    telefono:     z.string().max(15).optional().nullable(),
  }),
});

const registerPublicSchema = z.object({
  body: z.object({
    nombres:      z.string().min(2).max(150),
    apellidos:    z.string().min(2).max(150),
    email:        z.string().email(),
    password:     z.string().min(8, 'Mínimo 8 caracteres.').max(100),
    empresa_id:   z.number().int().positive(),
    cargo_id:     z.number().int().positive().optional().nullable(),
    municipio_id: z.number().int().positive().optional().nullable(),
    telefono:     z.string().max(15).optional().nullable(),
  }),
});

const forgotSchema = z.object({
  body: z.object({
    email:      z.string().email(),
    empresa_id: z.number().int().positive().optional().nullable(),
  }),
});

const resetSchema = z.object({
  body: z.object({
    token:    z.string().min(1),
    password: z.string().min(8, 'Mínimo 8 caracteres.').max(100),
  }),
});

const destinatarioSchema = z.object({
  body: z.object({
    nombres: z
      .string()
      .trim()
      .min(2, 'Los nombres deben tener al menos 2 caracteres.')
      .max(150),

    apellidos: z
      .string()
      .trim()
      .min(2, 'Los apellidos deben tener al menos 2 caracteres.')
      .max(150),

    municipio_id: z
      .number()
      .int()
      .positive('El municipio es obligatorio.'),

    sede_id: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),
  }),
});

router.post('/forgot-password', authLimiter, validate(forgotSchema), ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, validate(resetSchema),  ctrl.resetPassword);
router.post('/login',    authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   authenticate, ctrl.logout);
router.get('/me',        authenticate, ctrl.me);
// Registro público — no requiere autenticación, rol forzado = SALUD
router.post('/registro', authLimiter, validate(registerPublicSchema), ctrl.registerPublic);
// Registro admin — solo ADMIN puede crear con cualquier rol
router.post('/register', authLimiter, authenticate, authorize(ROLES.ADMIN), validate(registerSchema), ctrl.register );

router.post( '/destinatario', authenticate, validate(destinatarioSchema), ctrl.crearDestinatario );

module.exports = router;