const equipoService          = require('./equipo.service');
const { success, paginated } = require('../../Utils/response');
const { getPagination }      = require('../../Utils/pagination');

const getResumen = async (req, res, next) => {
  try {
    const pool = require('../../Config/database');
    const eid  = req.user.empresa_id;
    const [[totales], [porSede], preventivosMes, correctivosActivos] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                        AS total_equipos,
          SUM(activo = 1)                 AS activos,
          SUM(activo = 0)                 AS inactivos
        FROM equipos_biomedicos WHERE empresa_id = ? AND deleted_at IS NULL`, [eid]),

      pool.query(`
        SELECT s.nombre AS sede, COUNT(e.id) AS total
        FROM equipos_biomedicos e
        LEFT JOIN sedes s ON s.id = e.sede_id
        WHERE e.empresa_id = ? AND e.deleted_at IS NULL AND e.activo = 1
        GROUP BY s.nombre ORDER BY total DESC LIMIT 6`, [eid]),

      pool.query(`
        SELECT COUNT(*) AS preventivos_mes
        FROM mantenimientos_preventivos mp
        JOIN equipos_biomedicos e ON e.id = mp.equipo_id
        WHERE e.empresa_id = ?
          AND MONTH(mp.fecha_mantenimiento) = MONTH(CURDATE())
          AND YEAR(mp.fecha_mantenimiento)  = YEAR(CURDATE())
          AND mp.deleted_at IS NULL`, [eid]),

      pool.query(`
        SELECT COUNT(*) AS correctivos_activos
        FROM mantenimientos_correctivos mc
        JOIN equipos_biomedicos e ON e.id = mc.equipo_id
        JOIN estados es ON es.id = mc.estado_id
        WHERE e.empresa_id = ? AND es.nombre != 'Finalizado'
          AND mc.deleted_at IS NULL`, [eid]),
    ]);

    res.json({ success: true, data: {
      ...totales[0],
      preventivos_mes:    preventivosMes[0]?.[0]?.preventivos_mes    ?? 0,
      correctivos_activos: correctivosActivos[0]?.[0]?.correctivos_activos ?? 0,
      porSede,
    }});
  } catch (err) { next(err); }
};

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

module.exports = { getResumen, getAll, getOne, create, update, remove, uploadImagen, uploadDocumento };
