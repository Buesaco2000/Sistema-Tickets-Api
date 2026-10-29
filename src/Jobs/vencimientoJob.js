const cron   = require('node-cron');
const pool   = require('../Config/database');
const mailer = require('../Utils/mailer');
const logger = require('../Utils/logger');

const STOCK_CALC = `(
  COALESCE(i.cant_recepcionada, 0)
  - COALESCE((SELECT SUM(s.cantidad) FROM salidas_medicamentos s
              WHERE s.item_id = i.id AND s.estado != 'RECHAZADO'), 0)
  - COALESCE((SELECT SUM(di.cantidad) FROM dispensacion_items di
              JOIN dispensaciones d ON d.id = di.dispensacion_id
              WHERE di.item_id = i.id AND d.estado != 'RECHAZADO'), 0)
  + COALESCE((SELECT SUM(a.cantidad) FROM ajustes_inventario a
              WHERE a.item_id = i.id), 0)
)`;

async function runVencimientoJob() {
  logger.info('vencimientoJob: iniciando');
  try {
    const [empresas] = await pool.query(
      `SELECT DISTINCT r.empresa_id
       FROM recepciones_inventario r
       WHERE r.deleted_at IS NULL AND r.estado = 'COMPLETADA'`,
    );

    for (const { empresa_id } of empresas) {
      const [items] = await pool.query(
        `SELECT i.nombre, i.lote, i.tipo_recepcion,
                i.fecha_vencimiento,
                ${STOCK_CALC} AS stock,
                mu.nombre AS municipio,
                CASE WHEN i.fecha_vencimiento < CURDATE() THEN 'VENCIDO' ELSE 'PROXIMO' END AS estado
         FROM items_recepcion_inventario i
         JOIN recepciones_inventario r ON r.id = i.recepcion_id
         LEFT JOIN municipios mu       ON mu.id = r.municipio_id
         WHERE r.empresa_id = ?
           AND r.deleted_at IS NULL
           AND r.estado = 'COMPLETADA'
           AND i.fecha_vencimiento IS NOT NULL
           AND i.fecha_vencimiento < DATE_ADD(CURDATE(), INTERVAL 30 DAY)
           AND ${STOCK_CALC} > 0
         ORDER BY i.fecha_vencimiento ASC
         LIMIT 200`,
        [empresa_id],
      );

      if (items.length === 0) continue;

      // Admins de esta empresa
      const [admins] = await pool.query(
        `SELECT email FROM users
         WHERE empresa_id = ? AND rol_id = 1 AND deleted_at IS NULL`,
        [empresa_id],
      );
      if (admins.length === 0) continue;

      const emails = admins.map((a) => a.email);
      await mailer.sendVencimientoAlert(emails, items);
      logger.info(`vencimientoJob: empresa ${empresa_id} — ${items.length} ítems, ${emails.length} destinatarios`);
    }
  } catch (err) {
    logger.error({ message: 'vencimientoJob error', error: err.message, stack: err.stack });
  }
}

function startVencimientoJob() {
  // Todos los días a las 07:00 hora Colombia
  cron.schedule('0 7 * * *', runVencimientoJob, { timezone: 'America/Bogota' });
  logger.info('vencimientoJob: programado para las 07:00 America/Bogota');
}

module.exports = { startVencimientoJob, runVencimientoJob };
