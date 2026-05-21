const router    = require('express').Router();
const { z }     = require('zod');
const rateLimit = require('express-rate-limit');
const ctrl      = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize }    = require('../../middlewares/rbac.middleware');
const validate         = require('../../middlewares/validate.middleware');
const ROLES            = require('../../utils/roles');

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

router.post('/login',    authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   authenticate, ctrl.logout);
router.get('/me',        authenticate, ctrl.me);
router.post('/register',
  authLimiter,
  authenticate,
  authorize(ROLES.ADMIN),
  validate(registerSchema),
  ctrl.register
);

module.exports = router;