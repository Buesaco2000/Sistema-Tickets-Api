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
  body: z.object({ nombre: z.string().min(2).max(50) }),
});

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM roles_ticket ORDER BY nombre');
    return success(res, rows);
  } catch (e) { next(e); }
});

router.get('/:id', validate(idParam), async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM roles_ticket WHERE id = ?', [req.params.id]);
    if (!rows[0]) return next(new AppError('Rol de ticket no encontrado.', 404));
    return success(res, rows[0]);
  } catch (e) { next(e); }
});

router.use(authorize(ROLES.ADMIN));

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const [result] = await pool.query('INSERT INTO roles_ticket (nombre) VALUES (?)', [req.body.nombre.trim()]);
    const [rows]   = await pool.query('SELECT id, nombre FROM roles_ticket WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Rol de ticket creado.', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return next(new AppError('Ya existe un rol de ticket con ese nombre.', 409));
    next(e);
  }
});

router.put('/:id', validate(idParam), validate(schema), async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE roles_ticket SET nombre = ? WHERE id = ?', [req.body.nombre.trim(), req.params.id]);
    if (!result.affectedRows) return next(new AppError('Rol de ticket no encontrado.', 404));
    const [rows] = await pool.query('SELECT id, nombre FROM roles_ticket WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Rol de ticket actualizado.');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return next(new AppError('Ya existe un rol de ticket con ese nombre.', 409));
    next(e);
  }
});

router.delete('/:id', validate(idParam), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM roles_ticket WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return next(new AppError('Rol de ticket no encontrado.', 404));
    return success(res, null, 'Rol de ticket eliminado.');
  } catch (e) { next(e); }
});

module.exports = router;
