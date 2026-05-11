const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;

  // Structured logging (reemplazar con winston en producción)
  console.error({
    method:  req.method,
    path:    req.path,
    status:  err.statusCode,
    message: err.message,
    stack:   process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // MySQL: entrada duplicada
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'El registro ya existe.', data: null });
  }

  // MySQL: FK constraint
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ success: false, message: 'No se puede eliminar: registro en uso.', data: null });
  }

  // Zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos.',
      errors:  err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      data:    null,
    });
  }

  // JWT
  if (err.name === 'JsonWebTokenError')  return res.status(401).json({ success: false, message: 'Token inválido.',  data: null });
  if (err.name === 'TokenExpiredError')  return res.status(401).json({ success: false, message: 'Token expirado.',  data: null });

  // Errores operacionales conocidos (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message, data: null });
  }

  // Errores desconocidos — no filtrar detalles internos
  return res.status(500).json({ success: false, message: 'Error interno del servidor.', data: null });
};

const notFoundHandler = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada.`,
    data:    null,
  });

module.exports = { errorHandler, notFoundHandler };