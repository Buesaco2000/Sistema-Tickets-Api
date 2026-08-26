const svc = require("./stockMinimo.service");
const { success } = require("../../Utils/response");

const listar = async (req, res, next) => {
  try {
    const data = await svc.listar(req.user.empresa_id);
    success(res, data);
  } catch (e) { next(e); }
};

const getAlertas = async (req, res, next) => {
  try {
    const { municipio_id, sede_id } = req.query;
    const data = await svc.getAlertas(req.user.empresa_id, municipio_id, sede_id);
    success(res, data);
  } catch (e) { next(e); }
};

const upsert = async (req, res, next) => {
  try {
    const data = await svc.upsert(req.user.empresa_id, req.body);
    success(res, data, "Stock mínimo guardado.");
  } catch (e) { next(e); }
};

const eliminar = async (req, res, next) => {
  try {
    await svc.eliminar(req.user.empresa_id, req.params.id);
    success(res, null, "Stock mínimo eliminado.");
  } catch (e) { next(e); }
};

module.exports = { listar, getAlertas, upsert, eliminar };
