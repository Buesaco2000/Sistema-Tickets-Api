const AppError = require('../utils/AppError');

// Verifica que el usuario tenga uno de los roles permitidos
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AppError('No autenticado.', 401));
  if (!allowedRoles.includes(req.user.rol_id)) {
    return next(new AppError('No tienes permisos para esta acción.', 403));
  }
  next();
};

// Lanza si el recurso no pertenece a la empresa del usuario autenticado
const assertTenant = (resourceEmpresaId, req) => {
  if (!req.user?.empresa_id || req.user.empresa_id !== resourceEmpresaId) {
    throw new AppError('Acceso denegado a recurso de otra empresa.', 403);
  }
};

module.exports = { authorize, assertTenant };