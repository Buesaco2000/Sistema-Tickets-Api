const jwt     = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) throw new AppError('Token no proporcionado.', 401);

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (!decoded.empresa_id) throw new AppError('Token inválido: sin empresa.', 401);

    req.user = {
      id:         decoded.id,
      empresa_id: decoded.empresa_id,
      rol_id:     decoded.rol_id,
      email:      decoded.email,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };