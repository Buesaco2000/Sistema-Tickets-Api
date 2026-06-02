require('dotenv').config();
const app    = require('./app');
const pool   = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async (signal) => {
  logger.warn(`${signal} received — shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await pool.end();
    logger.info('DB pool closed.');
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ message: 'UnhandledRejection', reason });
  shutdown('unhandledRejection');
});
