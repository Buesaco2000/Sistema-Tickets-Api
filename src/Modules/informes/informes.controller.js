const informesService = require('./informes.service');
const { success } = require('../../Utils/response');
const AppError = require('../../Utils/AppError');

const getResumen = async (req, res, next) => {
    try {
        const anio     = req.query.anio ? Number(req.query.anio) : new Date().getFullYear();
        const esAdmin  = req.user.rol_id === 1;
        const cargoId  = esAdmin ? null : (req.user.cargo_id || null);
        const resumen  = await informesService.getResumen(req.user.empresa_id, anio, cargoId);
        return success(res, resumen);
    } catch (err) { next(err); }
}

const getAll = async (req, res, next) => {
    try {
        const esAdmin = req.user.rol_id === 1;
        const filters = {
            anio:      req.query.anio ? Number(req.query.anio) : new Date().getFullYear(),
            estado:    req.query.estado || null,
            texto:     req.query.texto || null,
            soloMios:  req.query.soloMios === 'true', 
            userId:    req.user.id,
            cargoId:  esAdmin ? null : (req.user.cargo_id || null),
        };
        const rows = await informesService.findAll(req.user.empresa_id, filters);
        return success(res, rows);
    } catch (err) { next(err); }
}

const getOne = async (req, res, next) => {
    try {
        const informe = await informesService.findById(req.user.empresa_id, Number(req.params.id));
        return success(res, informe);
    } catch (err) { next(err); }
}

const cambiarEstado = async (req, res, next) => {
    try{
        const informe = await informesService.cambiarEstado(
            req.user.empresa_id, 
            Number(req.params.id), 
            req.body.estado_id, 
            req.user.id,
            req.body.observaciones || null
        );
        return success(res, informe, 'Estado del informe actualizado.');
    } catch (err) { next(err); }
}

const subirEvidencia = async (req, res, next) => {
    try {
        if (!req.file)
            return next(new AppError('No se ha subido ningún archivo.', 400));
        
        const evidencia = await informesService.subirEvidencia(
            req.user.empresa_id, 
            Number(req.params.id), 
            req.body.tipo_evidencia_id,
            req.file, 
            req.user.id
        );
        return success(res, evidencia, 'Evidencia subida correctamente.', 201); 
    } catch (err) { next(err); }
}

const remove = async (req, res, next) => {
    try {
        await informesService.eliminarEvidencia(
            req.user.empresa_id, 
            Number(req.params.id), 
            req.user.id
        );
        return success(res, null, 'Evidencia eliminada correctamente.');
    } catch (err) { next(err); }
}

const getAnios = async (req, res, next) => {
    try {
        const esAdmin = req.user.rol_id === 1;
        const cargoId = esAdmin ? null : (req.user.cargo_id || null);
        const anios = await informesService.getAniosDisponibles(req.user.empresa_id, cargoId);
        return success(res, anios);
    } catch (err) { next(err); }
};

module.exports = { getResumen, getAnios, getAll, getOne, cambiarEstado, subirEvidencia, remove };