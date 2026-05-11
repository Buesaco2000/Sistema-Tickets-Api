const equipoService          = require('./equipo.service');
const { success, paginated } = require('../../utils/response');
const { getPagination }      = require('../../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const pag     = getPagination(req.query);
    const filters = {
      tipo_equipo_id:  req.query.tipo_equipo_id  ? Number(req.query.tipo_equipo_id)  : null,
      sede_id:         req.query.sede_id          ? Number(req.query.sede_id)          : null,
      municipio_id:    req.query.municipio_id     ? Number(req.query.municipio_id)     : null,
      fabricante_id:   req.query.fabricante_id    ? Number(req.query.fabricante_id)    : null,
      nivel_riesgo_id: req.query.nivel_riesgo_id  ? Number(req.query.nivel_riesgo_id)  : null,
      activo:          req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
      search:          req.query.search || null,
    };
    const { rows, meta } = await equipoService.findAll(req.user.empresa_id, filters, pag);
    return paginated(res, rows, meta);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const equipo = await equipoService.findById(Number(req.params.id), req.user.empresa_id);
    return success(res, equipo);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const equipo = await equipoService.create(req.body, req.user.id, req.user.empresa_id);
    return success(res, equipo, 'Equipo creado.', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const equipo = await equipoService.update(Number(req.params.id), req.body, req.user.id, req.user.empresa_id);
    return success(res, equipo, 'Equipo actualizado.');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await equipoService.softDelete(Number(req.params.id), req.user.id, req.user.empresa_id);
    return success(res, null, 'Equipo eliminado.');
  } catch (err) { next(err); }
};

const uploadImagen = (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo.' });
    const url = `/public/equipos/imagenes/${req.file.filename}`;
    return success(res, { url });
  } catch (err) { next(err); }
};

const uploadDocumento = (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo.' });
    const url = `/public/equipos/documentos/${req.file.filename}`;
    return success(res, { url });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, uploadImagen, uploadDocumento };
