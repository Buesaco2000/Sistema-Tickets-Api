const obligacionesService = require("./obligaciones.service");
const { success } = require("../../../Utils/response");
const AppError = require("../../../Utils/AppError");

const getAll = async (req, res, next) => {
    try {

        const rows = await obligacionesService.findAll(
            req.user.empresa_id
        );

        return success(res, rows);

    } catch (err) {
        next(err);
    }
};

const getCatalogos = async (req, res, next) => {
    try {

        const data = await obligacionesService.getCatalogos(
            req.user.empresa_id
        );

        return success(res, data);

    } catch (err) {
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try {

        const row = await obligacionesService.findById(
            req.user.empresa_id,
            Number(req.params.id)
        );

        return success(res, row);

    } catch (err) {
        next(err);
    }
};


const create = async (req, res, next) => {
    try {

        const row = await obligacionesService.create(
            req.user.empresa_id,
            req.body,
            req.user.id
        );

        return success(
            res,
            row,
            "Obligación creada correctamente.",
            201
        );

    } catch (err) {
        next(err);
    }
};


const update = async (req, res, next) => {
    try {

        const row = await obligacionesService.update(
            req.user.empresa_id,
            Number(req.params.id),
            req.body,
            req.user.id
        );

        return success(
            res,
            row,
            "Obligación actualizada correctamente."
        );

    } catch (err) {
        next(err);
    }
};


const remove = async (req, res, next) => {
    try {

        await obligacionesService.remove(
            req.user.empresa_id,
            Number(req.params.id),
            req.user.id
        );

        return success(
            res,
            null,
            "Obligación eliminada correctamente."
        );

    } catch (err) {
        next(err);
    }
};

const generarEjecuciones = async (req, res, next) => {
    try {
        const obligacionId = Number(req.params.id);
        const anio = Number(req.body.anio);

        if (!anio || anio < 2020 || anio > 2030) {
            return next(new AppError("El año debe estar entre 2020 y 2030", 400));
        }

        const resultado = await obligacionesService.generarEjecuciones(
            req.user.empresa_id,
            obligacionId,
            anio,
            req.user.id
        );

        return success(
            res,
            resultado,
            `${resultado.creadas} ejecuciones creadas, ${resultado.omitidas} ya existían.`
        );

    } catch (err) {
        next(err);
    }
};


const toggleActivo = async (req, res, next) => {
    try {
        const row = await obligacionesService.toggleActivo(
            req.user.empresa_id,
            Number(req.params.id),
            req.user.id
        );
        return success(res, row, `Obligación ${row.activo ? "activada" : "desactivada"} correctamente.`);
    } catch (err) {
        next(err);
    }
};

const getEjecuciones = async (req, res, next) => {
    try {
        const data = await obligacionesService.getEjecuciones(
            req.user.empresa_id,
            Number(req.params.id)
        );
        return success(res, data);
    } catch (err) { next(err); }
};

module.exports = { getAll, getCatalogos, getOne, create, update, remove, toggleActivo, generarEjecuciones, getEjecuciones };