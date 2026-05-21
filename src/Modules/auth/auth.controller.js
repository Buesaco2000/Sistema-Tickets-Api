const authService  = require('./auth.service');
const { success }  = require('../../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password, empresa_id } = req.body;
    const result = await authService.login(email, password, empresa_id);
    res.cookie('accessToken',  result.tokens.accessToken,  result.cookieOpts.access);
    res.cookie('refreshToken', result.tokens.refreshToken, result.cookieOpts.refresh);
    return success(res, { user: result.user }, 'Login exitoso.');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { accessToken, cookieOpts } = await authService.refresh(req.cookies.refreshToken);
    res.cookie('accessToken', accessToken, cookieOpts);
    return success(res, null, 'Token renovado.');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return success(res, null, 'Sesión cerrada.');
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body, req.user.id, req.user.empresa_id);
    return success(res, user, 'Usuario creado.', 201);
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const [rows] = await require('../../config/database').query(
      `SELECT u.id, u.nombres, u.apellidos, u.email, u.empresa_id, u.rol_id,
              u.cargo_id, u.municipio_id, u.telefono, u.activo,
              r.nombre  AS rol,
              c.nombre  AS cargo,
              m.nombre  AS municipio
       FROM users u
       LEFT JOIN roles      r ON r.id = u.rol_id
       LEFT JOIN cargos     c ON c.id = u.cargo_id
       LEFT JOIN municipios m ON m.id = u.municipio_id
       WHERE u.id = ? AND u.activo = 1 AND u.deleted_at IS NULL`,
      [req.user.id]
    );
    if (!rows[0]) return next(new (require('../../utils/AppError'))('Usuario no encontrado.', 404));
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout, register, me };