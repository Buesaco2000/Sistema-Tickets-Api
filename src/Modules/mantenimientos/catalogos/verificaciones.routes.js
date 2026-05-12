const router  = require('express').Router();
const pool    = require('../../../Config/database');
const { authenticate } = require('../../../Middlewares/auth.middleware');
const { success }      = require('../../../Utils/response');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM catalogo_verificacion_preventivo ORDER BY id');
    return success(res, rows);
  } catch (e) { next(e); }
});

module.exports = router;
