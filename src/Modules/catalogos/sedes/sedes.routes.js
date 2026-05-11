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
    nombre:       z.string().min(2).max(100),
    municipio_id: z.number().int().positive(),
  }),
});

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

router.use(authenticate);

// Devuelve solo las sedes de la empresa del usuario autenticado
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.nombre, s.municipio_id, m.nombre AS municipio
       FROM sedes s
       JOIN municipios m ON m.id = s.municipio_id
       WHERE s.empresa_id = ?
       ORDER BY s.nombre`,
      [req.user.empresa_id]
    );
    return success(res, rows);
  } catch (e) { next(e); }
});

router.get('/:id', validate(idParam), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.nombre, s.municipio_id, m.nombre AS municipio
       FROM sedes s
       JOIN municipios m ON m.id = s.municipio_id
       WHERE s.id = ? AND s.empresa_id = ?`,
      [req.params.id, req.user.empresa_id]
    );
    if (!rows[0]) return next(new AppError('Sede no encontrada.', 404));
    return success(res, rows[0]);
  } catch (e) { next(e); }
});

// Solo ADMIN puede crear, actualizar o eliminar sedes
router.use(authorize(ROLES.ADMIN));

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const { nombre, municipio_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO sedes (nombre, municipio_id, empresa_id) VALUES (?, ?, ?)',
      [nombre.trim(), municipio_id, req.user.empresa_id]
    );
    const [rows] = await pool.query(
      `SELECT s.id, s.nombre, s.municipio_id, m.nombre AS municipio
       FROM sedes s JOIN municipios m ON m.id = s.municipio_id
       WHERE s.id = ?`,
      [result.insertId]
    );
    return success(res, rows[0], 'Sede creada.', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return next(new AppError('Ya existe una sede con ese nombre en esta empresa.', 409));
    next(e);
  }
});

router.put('/:id', validate(idParam), validate(schema), async (req, res, next) => {
  try {
    const { nombre, municipio_id } = req.body;
    const [result] = await pool.query(
      'UPDATE sedes SET nombre = ?, municipio_id = ? WHERE id = ? AND empresa_id = ?',
      [nombre.trim(), municipio_id, req.params.id, req.user.empresa_id]
    );
    if (!result.affectedRows) return next(new AppError('Sede no encontrada.', 404));
    const [rows] = await pool.query(
      `SELECT s.id, s.nombre, s.municipio_id, m.nombre AS municipio
       FROM sedes s JOIN municipios m ON m.id = s.municipio_id
       WHERE s.id = ?`,
      [req.params.id]
    );
    return success(res, rows[0], 'Sede actualizada.');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return next(new AppError('Ya existe una sede con ese nombre en esta empresa.', 409));
    next(e);
  }
});

router.delete('/:id', validate(idParam), async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM sedes WHERE id = ? AND empresa_id = ?',
      [req.params.id, req.user.empresa_id]
    );
    if (!result.affectedRows) return next(new AppError('Sede no encontrada.', 404));
    return success(res, null, 'Sede eliminada.');
  } catch (e) { next(e); }
});

module.exports = router;
