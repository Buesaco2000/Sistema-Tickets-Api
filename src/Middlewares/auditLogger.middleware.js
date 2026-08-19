const logger = require('../Utils/logger');
const SKIP_PATHS = ['/health', '/favicon.ico'];

const auditLogger = (req, res, next) => {
  if (SKIP_PATHS.some(p => req.path.startsWith(p))) return next();

  const start = Date.now();

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const level   = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'info';

    logger[level]({
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      ms,
      ip:         req.ip || req.headers['x-forwarded-for'],
      user_id:    req.user?.id        ?? null,
      empresa_id: req.user?.empresa_id ?? null,
    });
  });

  next();
};

module.exports = auditLogger;
