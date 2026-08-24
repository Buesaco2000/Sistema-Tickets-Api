const pool = require("../../../Config/database");
const AppError = require("../../../Utils/AppError");

const findAll = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.codigo, o.nombre, o.soporte_normativo, o.detalle, o.dias_plazo, o.complejidad,
            o.dias_anticipacion, o.area_elabora, o.area_presenta, o.responsable_id, o.suplente_id, o.activo,

            er.id AS ente_rector_id,
            er.nombre AS ente_rector,

            r.id AS receptor_id,
            r.nombre AS receptor,

            p.id AS periodicidad_id,
            p.codigo AS periodicidad_codigo,
            p.nombre AS periodicidad,

            co.id   AS cargo_id,
            co.nombre AS cargo_nombre,

            CONCAT(u.nombres, ' ', u.apellidos) AS responsable,

            CONCAT(s.nombres, ' ', s.apellidos) AS suplente

        FROM obligacion o

        INNER JOIN ente_rector er
            ON er.id = o.ente_rector_id

        INNER JOIN receptor r
            ON r.id = o.receptor_id

        INNER JOIN periodicidad p
            ON p.id = o.periodicidad_id

        LEFT JOIN cargos co
            ON co.id = o.cargo_id

        LEFT JOIN users u
            ON u.id = o.responsable_id

        LEFT JOIN users s
            ON s.id = o.suplente_id

        WHERE o.empresa_id = ? AND o.deleted_at IS NULL

        ORDER BY o.codigo ASC
    `,
    [empresaId],
  );

  return rows;
};

const getCatalogos = async (empresaId) => {

    const [entesRectores] = await pool.query(
        `
        SELECT
            id,
            nombre,
            sigla
        FROM ente_rector
        WHERE activo = TRUE
        ORDER BY nombre ASC
        `,
    );

    const [receptores] = await pool.query(
        `
        SELECT
            id,
            nombre,
            url_portal
        FROM receptor
        WHERE activo = TRUE
        ORDER BY nombre ASC
        `,
    );

    const [periodicidades] = await pool.query(
        `
        SELECT
            id,
            codigo,
            nombre,
            meses_corte,
            cortes_por_ano
        FROM periodicidad
        WHERE activo = TRUE
        ORDER BY nombre ASC
        `
    );

    const [users] = await pool.query(
        `
        SELECT
            id,
            nombres,
            apellidos
        FROM users
        WHERE empresa_id = ?
          AND activo = TRUE
        ORDER BY nombres ASC, apellidos ASC
        `,
        [empresaId]
    );

    const [cargos] = await pool.query(
        `SELECT id, nombre FROM cargos ORDER BY nombre ASC`
    );

    return {
        entesRectores,
        receptores,
        periodicidades,
        usuarios: users,
        cargos,
    };
};

const findById = async (empresaId, id) => {
  const [rows] = await pool.query(
    `
        SELECT
            o.*
        FROM obligacion o
        WHERE o.id = ?
          AND o.empresa_id = ?
          AND o.deleted_at IS NULL
    `,
    [id, empresaId],
  );

  if (!rows.length) {
    throw new AppError("Obligación no encontrada", 404);
  }

  return rows[0];
};

const create = async (empresaId, data, userId) => {
  const {
    codigo,
    ente_rector_id,
    receptor_id,
    periodicidad_id,
    nombre,
    soporte_normativo,
    detalle,
    dias_plazo,
    complejidad = 1,
    dias_anticipacion = 30,
    area_elabora,
    area_presenta,
    cargo_id,
    responsable_id,
    suplente_id,
    activo = true,
  } = data;

  const [result] = await pool.query(
    `
        INSERT INTO obligacion (
            empresa_id,
            codigo,
            ente_rector_id,
            receptor_id,
            periodicidad_id,
            nombre,
            soporte_normativo,
            detalle,
            dias_plazo,
            complejidad,
            dias_anticipacion,
            area_elabora,
            area_presenta,
            cargo_id,
            responsable_id,
            suplente_id,
            activo,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      empresaId,
      codigo,
      ente_rector_id,
      receptor_id,
      periodicidad_id,
      nombre,
      soporte_normativo,
      detalle || null,
      dias_plazo,
      complejidad,
      dias_anticipacion,
      area_elabora || null,
      area_presenta || null,
      cargo_id || null,
      responsable_id || null,
      suplente_id || null,
      activo,
      userId,
    ],
  );

  return findById(empresaId, result.insertId);
};

const update = async (empresaId, id, data, userId) => {
  const existe = await findById(empresaId, id);

  const {
    codigo,
    ente_rector_id,
    receptor_id,
    periodicidad_id,
    nombre,
    soporte_normativo,
    detalle,
    dias_plazo,
    complejidad,
    dias_anticipacion,
    area_elabora,
    area_presenta,
    cargo_id,
    responsable_id,
    suplente_id,
    activo,
  } = data;

  await pool.query(
    `
        UPDATE obligacion
        SET
            codigo = ?,
            ente_rector_id = ?,
            receptor_id = ?,
            periodicidad_id = ?,
            nombre = ?,
            soporte_normativo = ?,
            detalle = ?,
            dias_plazo = ?,
            complejidad = ?,
            dias_anticipacion = ?,
            area_elabora = ?,
            area_presenta = ?,
            cargo_id = ?,
            responsable_id = ?,
            suplente_id = ?,
            activo = ?,
            updated_by = ?
        WHERE id = ?
          AND empresa_id = ?
          AND deleted_at IS NULL
    `,
    [
      codigo,
      ente_rector_id,
      receptor_id,
      periodicidad_id,
      nombre,
      soporte_normativo,
      detalle || null,
      dias_plazo,
      complejidad,
      dias_anticipacion,
      area_elabora || null,
      area_presenta || null,
      cargo_id || null,
      responsable_id || null,
      suplente_id || null,
      activo,
      userId,
      id,
      empresaId,
    ],
  );

  return findById(empresaId, existe.id);
};

const remove = async (empresaId, id, userId) => {
  const [result] = await pool.query(
    `UPDATE obligacion
     SET deleted_at = NOW(), updated_by = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [userId, id, empresaId],
  );
  if (!result.affectedRows) throw new AppError("Obligación no encontrada", 404);
};

const toggleActivo = async (empresaId, id, userId) => {
  const [result] = await pool.query(
    `UPDATE obligacion
     SET activo = NOT activo, updated_by = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [userId, id, empresaId],
  );
  if (!result.affectedRows) throw new AppError("Obligación no encontrada", 404);
  return findById(empresaId, id);
};

const generarEjecuciones = async (empresaId, obligacionId, anio, userId) => {
    const [rows] = await pool.query(
        `SELECT o.dias_plazo,
                p.meses_corte
         FROM obligacion o
         JOIN periodicidad p ON p.id = o.periodicidad_id
         WHERE o.id = ? AND o.empresa_id = ? AND o.deleted_at IS NULL`,
        [obligacionId, empresaId]
    );
    if (!rows.length) throw new AppError("Obligación no encontrada", 404);

    const { dias_plazo, meses_corte } = rows[0];

    const [estados] = await pool.query(
        `SELECT id FROM estados
         WHERE nombre = 'PENDIENTE' AND scope = 'INFORME'
         LIMIT 1`
    );
    if (!estados.length) throw new AppError("Estado PENDIENTE no configurado", 500);
    const estadoId = estados[0].id;

    const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN',
                   'JUL','AGO','SEP','OCT','NOV','DIC'];

    const meses = Array.isArray(meses_corte) ? meses_corte : JSON.parse(meses_corte);
    let creadas = 0;
    let omitidas = 0;

    for (const mes of meses) {
        const etiqueta = `${MESES[mes - 1]} ${anio}`;

        const fechaCorte = new Date(anio, mes, 0);
        const fechaCorteStr = fechaCorte.toISOString().split('T')[0];

        const fechaLimite = new Date(fechaCorte);
        fechaLimite.setDate(fechaLimite.getDate() + dias_plazo);
        const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

        try {
            await pool.query(
                `INSERT INTO ejecucion_informe
                 (empresa_id, obligacion_id, estado_id,
                  etiqueta_corte, fecha_corte, fecha_limite, fecha_limite_orig,
                  created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [empresaId, obligacionId, estadoId,
                 etiqueta, fechaCorteStr, fechaLimiteStr, fechaLimiteStr,
                 userId]
            );
            creadas++;
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                omitidas++;
            } else {
                throw err; 
            }
        }
    }

    return { creadas, omitidas, total: meses.length };
};

// Historial de ejecuciones + evidencias de una obligación
const getEjecuciones = async (empresaId, obligacionId) => {
    // Verifica que la obligación pertenezca a la empresa
    const [[oblig]] = await pool.query(
        `SELECT id, codigo, nombre FROM obligacion
         WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1`,
        [obligacionId, empresaId]
    );
    if (!oblig) throw new AppError("Obligación no encontrada", 404);

    // Trae ejecuciones ordenadas desc (más reciente primero)
    const [ejecuciones] = await pool.query(
        `SELECT ei.id, ei.etiqueta_corte, ei.fecha_corte, ei.fecha_limite,
                ei.fecha_presentado, ei.numero_radicado,
                e.nombre AS estado
         FROM ejecucion_informe ei
         JOIN estados e ON e.id = ei.estado_id
         WHERE ei.obligacion_id = ? AND ei.empresa_id = ? AND ei.deleted_at IS NULL
         ORDER BY ei.fecha_corte DESC`,
        [obligacionId, empresaId]
    );

    if (!ejecuciones.length) return { ...oblig, ejecuciones: [] };

    // Evidencias de todas las ejecuciones en una sola query
    const ids = ejecuciones.map(e => e.id);
    const [evidencias] = await pool.query(
        `SELECT ev.id, ev.ejecucion_id, ev.nombre_original, ev.ruta_relativa,
                ev.mime, ev.tamano_bytes, ev.created_at,
                te.nombre AS tipo_evidencia,
                CONCAT(u.nombres, ' ', u.apellidos) AS subido_por
         FROM evidencia_informe ev
         JOIN tipo_evidencia te ON te.id = ev.tipo_evidencia_id
         LEFT JOIN users u ON u.id = ev.subido_por
         WHERE ev.ejecucion_id IN (?) AND ev.deleted_at IS NULL
         ORDER BY ev.created_at DESC`,
        [ids]
    );

    // Agrupa evidencias por ejecucion_id
    const evMap = {};
    for (const ev of evidencias) {
        if (!evMap[ev.ejecucion_id]) evMap[ev.ejecucion_id] = [];
        evMap[ev.ejecucion_id].push(ev);
    }

    return {
        ...oblig,
        ejecuciones: ejecuciones.map(ej => ({
            ...ej,
            evidencias: evMap[ej.id] ?? [],
        })),
    };
};

module.exports = { findAll, getCatalogos, findById, create, update, remove, toggleActivo, generarEjecuciones, getEjecuciones };
