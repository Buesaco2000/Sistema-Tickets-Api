const router   = require('express').Router();
const pool     = require('../../config/database');
const { z }    = require('zod');
const validate = require('../../middlewares/validate.middleware');

const createSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'Nombre mínimo 2 caracteres.').max(100),
  }),
});

// Público — el login y el registro necesitan listar empresas sin token
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM empresa ORDER BY nombre ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Público — cualquier persona puede crear su empresa al registrarse
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { nombre } = req.body;
    const [result] = await pool.query(
      'INSERT INTO empresa (nombre) VALUES (?)',
      [nombre.trim()]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, nombre: nombre.trim() },
    });
  } catch (err) { next(err); }
});

module.exports = router;
