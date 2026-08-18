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

            CONCAT(u.nombre, ' ', u.apellido) AS responsable,

            CONCAT(s.nombre, ' ', s.apellido) AS suplente

        FROM obligacion o

        INNER JOIN ente_rector er
            ON er.id = o.ente_rector_id

        INNER JOIN receptor r
            ON r.id = o.receptor_id

        INNER JOIN periodicidad p
            ON p.id = o.periodicidad_id

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
        WHERE empresa_id = ?
          AND deleted_at IS NULL
        ORDER BY nombre ASC
        `,
        [empresaId]
    );

    const [receptores] = await pool.query(
        `
        SELECT
            id,
            nombre,
            url_portal
        FROM receptor
        WHERE empresa_id = ?
          AND deleted_at IS NULL
        ORDER BY nombre ASC
        `,
        [empresaId]
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

    return {
        entesRectores,
        receptores,
        periodicidades,
        user: users
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
            responsable_id,
            suplente_id,
            activo,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    `
        UPDATE obligacion
        SET
            deleted_at = NOW(),
            updated_by = ?,
            activo = FALSE
        WHERE id = ?
          AND empresa_id = ?
          AND deleted_at IS NULL
    `,
    [userId, id, empresaId],
  );

  if (!result.affectedRows) {
    throw new AppError("Obligación no encontrada", 404);
  }
};

module.exports = { findAll, getCatalogos, findById, create, update, remove };
