const router  = require('express').Router();
const { z }   = require('zod');
const pool    = require('../../../Config/database');
const { authenticate } = require('../../../Middlewares/auth.middleware');
const { authorize }    = require('../../../Middlewares/rbac.middleware');
const validate         = require('../../../Middlewares/validate.middleware');
const { success }      = require('../../../Utils/response');
const AppError         = require('../../../Utils/AppError');
const ROLES            = require('../../../Utils/roles');

const schema = z.object({
  body: z.object({
    nombre: z.string().min(1).max(50),
    scope:  z.enum(['TICKET', 'MANTENIMIENTO']),
  }),
});

const querySchema = z.object({
  query: z.object({
    scope: z.enum(['TICKET', 'MANTENIMIENTO']).optional(),
  }),
});

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

// Lectura disponible para todos los autenticados
router.use(authenticate);

router.get('/', validate(querySchema), async (req, res, next) => {
  try {
    const { scope } = req.query;
    const [rows] = scope
      ? await pool.query('SELECT id, nombre, scope FROM estados WHERE scope = ? ORDER BY nombre', [scope])
      : await pool.query('SELECT id, nombre, scope FROM estados ORDER BY scope, nombre');
    return success(res, rows);
  } catch (e) { next(e); }
});

router.get('/:id', validate(idParam), async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, scope FROM estados WHERE id = ?', [req.params.id]);
    if (!rows[0]) return next(new AppError('Estado no encontrado.', 404));
    return success(res, rows[0]);
  } catch (e) { next(e); }
});

// Solo ADMIN puede crear, actualizar o eliminar estados
router.use(authorize(ROLES.ADMIN));

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const { nombre, scope } = req.body;
    const [result] = await pool.query('INSERT INTO estados (nombre, scope) VALUES (?, ?)', [nombre.trim(), scope]);
    const [rows]   = await pool.query('SELECT id, nombre, scope FROM estados WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Estado creado.', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return next(new AppError('Ya existe ese estado para ese scope.', 409));
    next(e);
  }
});

router.put('/:id', validate(idParam), validate(schema), async (req, res, next) => {
  try {
    const { nombre, scope } = req.body;
    const [result] = await pool.query('UPDATE estados SET nombre = ?, scope = ? WHERE id = ?', [nombre.trim(), scope, req.params.id]);
    if (!result.affectedRows) return next(new AppError('Estado no encontrado.', 404));
    const [rows] = await pool.query('SELECT id, nombre, scope FROM estados WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Estado actualizado.');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return next(new AppError('Ya existe ese estado para ese scope.', 409));
    next(e);
  }
});

router.delete('/:id', validate(idParam), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM estados WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return next(new AppError('Estado no encontrado.', 404));
    return success(res, null, 'Estado eliminado.');
  } catch (e) { next(e); }
});

module.exports = router;
