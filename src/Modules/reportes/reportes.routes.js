const router = require('express').Router();
const pool   = require('../../Config/database');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const { success }      = require('../../Utils/response');
const ROLES            = require('../../Utils/roles');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.INGENIERO));

// GET /reportes/historico  — totales por mes/año
router.get('/historico', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         YEAR(t.created_at)                                               AS anio,
         MONTH(t.created_at)                                              AS mes,
         MONTHNAME(t.created_at)                                          AS nombre_mes,
         COUNT(*)                                                          AS total_tickets,
         SUM(CASE WHEN e.nombre LIKE '%bierto%'  THEN 1 ELSE 0 END)      AS abiertos,
         SUM(CASE WHEN e.nombre LIKE '%roceso%'
                    OR e.nombre LIKE '%rogreso%'  THEN 1 ELSE 0 END)     AS en_proceso,
         SUM(CASE WHEN e.nombre LIKE '%suelto%'
                    OR e.nombre LIKE '%errado%'   THEN 1 ELSE 0 END)     AS resueltos,
         SUM(CASE WHEN t.tipo_soporte_id = 2      THEN 1 ELSE 0 END)     AS rfast,
         SUM(CASE WHEN t.tipo_soporte_id = 3      THEN 1 ELSE 0 END)     AS notas_credito,
         SUM(CASE WHEN t.tipo_soporte_id = 1      THEN 1 ELSE 0 END)     AS otros_soportes
       FROM tickets t
       JOIN estados e ON e.id = t.estado_id
       WHERE t.empresa_id = ? AND t.deleted_at IS NULL
       GROUP BY YEAR(t.created_at), MONTH(t.created_at)
       ORDER BY anio DESC, mes DESC`,
      [req.user.empresa_id]
    );
    return success(res, rows);
  } catch (err) { next(err); }
});

// GET /reportes/tickets  — detalle de tickets con filtros de período
router.get('/tickets', async (req, res, next) => {
  try {
    const { periodo, fecha_inicio, fecha_fin, tipo_soporte_id } = req.query;

    const conds  = ['t.empresa_id = ?', 't.deleted_at IS NULL'];
    const params = [req.user.empresa_id];

    if (periodo === 'semana') {
      conds.push('t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    } else if (periodo === 'mes') {
      conds.push('YEAR(t.created_at) = YEAR(NOW()) AND MONTH(t.created_at) = MONTH(NOW())');
    } else if (periodo === 'anio') {
      conds.push('YEAR(t.created_at) = YEAR(NOW())');
    } else if (periodo === 'rango' && fecha_inicio && fecha_fin) {
      conds.push('DATE(t.created_at) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }

    if (tipo_soporte_id && tipo_soporte_id !== 'todos') {
      conds.push('t.tipo_soporte_id = ?');
      params.push(Number(tipo_soporte_id));
    }

    const where = conds.join(' AND ');

    const [rows] = await pool.query(
      `SELECT
         t.id,
         t.created_at                                           AS fecha_creacion,
         e.nombre                                               AS estado,
         ts.nombre                                              AS tipo_soporte,
         u.nombres                                              AS usuario_nombres,
         u.apellidos                                            AS usuario_apellidos,
         u.email                                                AS usuario_email,
         u.telefono                                             AS usuario_telefono,
         ing.nombres                                            AS ingeniero_nombres,
         ing.apellidos                                          AS ingeniero_apellidos,
         ing.email                                              AS ingeniero_email,
         m.nombre                                               AS municipio,
         s.descripcion,
         s.imagen_url                                           AS imagen,
         sd.fecha_facturacion,
         sd.factura_anular,
         sd.factura_copago_anular,
         sd.valor_copago_anulado,
         sd.factura_refacturar
       FROM tickets t
       JOIN estados        e   ON e.id  = t.estado_id
       JOIN tipos_soporte  ts  ON ts.id = t.tipo_soporte_id
       JOIN municipios     m   ON m.id  = t.municipio_incidente_id
       LEFT JOIN users     u   ON u.id  = t.created_by
       LEFT JOIN ticket_usuarios tu
              ON tu.ticket_id = t.id
             AND tu.empresa_id = t.empresa_id
       LEFT JOIN users     ing ON ing.id = tu.user_id
       LEFT JOIN soportes  s   ON s.ticket_id = t.id AND s.deleted_at IS NULL
       LEFT JOIN soporte_detalle sd ON sd.soporte_id = s.id
       WHERE ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    return success(res, rows);
  } catch (err) { next(err); }
});

// GET /reportes/resumen-mensual  — resumen por mes para un año dado
router.get('/resumen-mensual', async (req, res, next) => {
  try {
    const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear();

    const [rows] = await pool.query(
      `SELECT
         MONTH(t.created_at)                                           AS mes,
         MONTHNAME(t.created_at)                                       AS nombre_mes,
         COUNT(*)                                                       AS total_tickets,
         SUM(CASE WHEN e.nombre LIKE '%bierto%' THEN 1 ELSE 0 END)    AS abiertos,
         SUM(CASE WHEN e.nombre LIKE '%roceso%'
                    OR e.nombre LIKE '%rogreso%' THEN 1 ELSE 0 END)   AS en_proceso,
         SUM(CASE WHEN e.nombre LIKE '%suelto%'
                    OR e.nombre LIKE '%errado%'  THEN 1 ELSE 0 END)   AS resueltos
       FROM tickets t
       JOIN estados e ON e.id = t.estado_id
       WHERE t.empresa_id = ?
         AND YEAR(t.created_at) = ?
         AND t.deleted_at IS NULL
       GROUP BY MONTH(t.created_at)
       ORDER BY mes ASC`,
      [req.user.empresa_id, anio]
    );
    return success(res, rows);
  } catch (err) { next(err); }
});

module.exports = router;
