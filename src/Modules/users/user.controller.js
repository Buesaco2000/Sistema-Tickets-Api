const userService           = require('./user.service');
const { success, paginated } = require('../../utils/response');
const { getPagination }      = require('../../utils/pagination');
const AppError               = require('../../utils/AppError');
const ROLES                  = require('../../utils/roles');

const getAll = async (req, res, next) => {
  try {
    const pag     = getPagination(req.query);
    const filters = {
      rol_id:   req.query.rol_id   ? Number(req.query.rol_id)   : null,
      cargo_id: req.query.cargo_id ? Number(req.query.cargo_id) : null,
      activo:   req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
    };
    const { rows, meta } = await userService.findAll(req.user.empresa_id, filters, pag);
    return paginated(res, rows, meta);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    // No-admin only can fetch their own profile
    if (req.user.rol_id !== ROLES.ADMIN && targetId !== req.user.id) {
      return next(new AppError('No autorizado.', 403));
    }
    const user = await userService.findById(targetId, req.user.empresa_id);
    return success(res, user);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    const isAdmin  = req.user.rol_id === ROLES.ADMIN;

    if (!isAdmin && targetId !== req.user.id) {
      return next(new AppError('No autorizado para editar este usuario.', 403));
    }

    // Solo ADMIN puede cambiar campos de acceso
    if (!isAdmin) {
      const restricted = ['rol_id', 'cargo_id', 'municipio_id'];
      if (restricted.some(f => req.body[f] !== undefined)) {
        return next(new AppError('No tienes permisos para modificar rol, cargo o municipio.', 403));
      }
    }

    const user = await userService.update(targetId, req.body, req.user.id, req.user.empresa_id);
    return success(res, user, 'Usuario actualizado.');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    // Solo el propio usuario puede cambiar su contraseña
    if (targetId !== req.user.id) {
      return next(new AppError('Solo puedes cambiar tu propia contraseña.', 403));
    }
    await userService.changePassword(targetId, req.body.current_password, req.body.new_password, req.user.empresa_id);
    return success(res, null, 'Contraseña actualizada.');
  } catch (err) { next(err); }
};

const setActivo = async (req, res, next) => {
  try {
    await userService.setActivo(Number(req.params.id), req.body.activo, req.user.id, req.user.empresa_id);
    return success(res, null, 'Estado actualizado.');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await userService.softDelete(Number(req.params.id), req.user.id, req.user.empresa_id);
    return success(res, null, 'Usuario eliminado.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, update, changePassword, setActivo, remove };
