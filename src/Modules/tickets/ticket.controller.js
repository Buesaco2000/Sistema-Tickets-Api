const ticketService         = require('./ticket.service');
const { success, paginated } = require('../../utils/response');
const { getPagination }      = require('../../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const pag     = getPagination(req.query);
    const filters = {
      estado_id:       req.query.estado_id       ? Number(req.query.estado_id)       : null,
      tipo_soporte_id: req.query.tipo_soporte_id ? Number(req.query.tipo_soporte_id) : null,
      prioridad:       req.query.prioridad        || null,
      equipo_id:       req.query.equipo_id        ? Number(req.query.equipo_id)       : null,
      fecha_desde:     req.query.fecha_desde      || null,
      fecha_hasta:     req.query.fecha_hasta      || null,
    };
    const { rows, meta } = await ticketService.findAll(req.user.empresa_id, filters, pag);
    return paginated(res, rows, meta);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const ticket = await ticketService.findById(Number(req.params.id), req.user.empresa_id);
    return success(res, ticket);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const ticket = await ticketService.create(req.body, req.user.id, req.user.empresa_id);
    return success(res, ticket, 'Ticket creado.', 201);
  } catch (err) { next(err); }
};

const updateEstado = async (req, res, next) => {
  try {
    const ticket = await ticketService.updateEstado(
      Number(req.params.id), req.body.estado_id, req.user.id, req.user.empresa_id
    );
    return success(res, ticket, 'Estado actualizado.');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await ticketService.softDelete(Number(req.params.id), req.user.id, req.user.empresa_id);
    return success(res, null, 'Ticket eliminado.');
  } catch (err) { next(err); }
};

const assignUser = async (req, res, next) => {
  try {
    await ticketService.assignUser(
      Number(req.params.id), req.body.user_id, req.body.rol_ticket_id, req.user.empresa_id
    );
    return success(res, null, 'Usuario asignado.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, updateEstado, remove, assignUser };