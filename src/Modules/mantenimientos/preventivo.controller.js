const prevService            = require('./preventivo.service');
const { success, paginated } = require('../../utils/response');
const { getPagination }      = require('../../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const pag     = getPagination(req.query);
    const filters = {
      equipo_id:    req.query.equipo_id    ? Number(req.query.equipo_id)    : null,
      fecha_desde:  req.query.fecha_desde  || null,
      fecha_hasta:  req.query.fecha_hasta  || null,
      realizado_por: req.query.realizado_por ? Number(req.query.realizado_por) : null,
    };
    const { rows, meta } = await prevService.findAll(req.user.empresa_id, filters, pag);
    return paginated(res, rows, meta);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const prev = await prevService.findById(Number(req.params.id), req.user.empresa_id);
    return success(res, prev);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const prev = await prevService.create(req.body, req.user.id, req.user.empresa_id);
    return success(res, prev, 'Mantenimiento preventivo creado.', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const prev = await prevService.update(Number(req.params.id), req.body, req.user.id, req.user.empresa_id);
    return success(res, prev, 'Mantenimiento preventivo actualizado.');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prevService.softDelete(Number(req.params.id), req.user.id, req.user.empresa_id);
    return success(res, null, 'Mantenimiento preventivo eliminado.');
  } catch (err) { next(err); }
};

const uploadImagen = (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo.' });
    const url = `/public/mantenimientos/imagenes/${req.file.filename}`;
    return success(res, { url });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, uploadImagen };
