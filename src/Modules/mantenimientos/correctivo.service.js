const pool = require("../../config/database");
const AppError = require("../../utils/AppError");
const { getPagination, buildMeta } = require("../../utils/pagination");

const lookupId = async (conn, table, nombre) => {
  if (!nombre) return null;
  const [[row]] = await conn.query(
    `SELECT id FROM ${table} WHERE LOWER(nombre) = LOWER(?) LIMIT 1`,
    [nombre]
  );
  return row?.id ?? null;
};

const findAll = async (empresaId, filters, pag) => {
  const { page, limit, offset } = pag;
  const conds = ["mc.empresa_id = ?", "mc.deleted_at IS NULL"];
  const params = [empresaId];

  if (filters.equipo_id) {
    conds.push("mc.equipo_id = ?");
    params.push(filters.equipo_id);
  }
  if (filters.estado_id) {
    conds.push("mc.estado_id = ?");
    params.push(filters.estado_id);
  }
  if (filters.tipo_servicio_id) {
    conds.push("mc.tipo_servicio_id = ?");
    params.push(filters.tipo_servicio_id);
  }
  if (filters.fecha_desde) {
    conds.push("mc.fecha_inicio >= ?");
    params.push(filters.fecha_desde);
  }
  if (filters.fecha_hasta) {
    conds.push("mc.fecha_inicio <= ?");
    params.push(filters.fecha_hasta);
  }

  const where = conds.join(" AND ");

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM mantenimientos_correctivos mc WHERE ${where}`,
    params,
  );

  const [rows] = await pool.query(
    `SELECT mc.id, mc.tipo_servicio_id, ts.nombre AS tipo_servicio,
            mc.fecha_inicio, mc.fecha_entrega,
            mc.falla_reportada, mc.servicio, mc.se_instalaron_partes, mc.created_at,
            e.nombre  AS estado,
            eb.nombre AS equipo, eb.serie AS equipo_serie,
            CONCAT(ur.nombres, ' ', ur.apellidos) AS realizado_por_nombre,
            CONCAT(ua.nombres, ' ', ua.apellidos) AS aprobado_por_nombre
     FROM mantenimientos_correctivos mc
     JOIN  estados           e  ON e.id  = mc.estado_id
     JOIN  equipos_biomedicos eb ON eb.id = mc.equipo_id
     LEFT JOIN tipo_servicios ts ON ts.id = mc.tipo_servicio_id
     LEFT JOIN users ur ON ur.id = mc.realizado_por
     LEFT JOIN users ua ON ua.id = mc.aprobado_por
     WHERE ${where}
     ORDER BY mc.fecha_inicio DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return { rows, meta: buildMeta(total, page, limit) };
};

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT mc.*,
            e.nombre          AS estado,
            ts.nombre         AS tipo_servicio,
            eb.nombre         AS equipo,
            eb.serie          AS equipo_serie,
            eb.marca          AS equipo_marca,
            eb.modelo         AS equipo_modelo,
            eb.activo_fijo    AS equipo_activo_fijo,
            eb.ubicacion      AS equipo_ubicacion,
            s.nombre          AS equipo_sede,
            m.nombre          AS equipo_municipio,
            CONCAT(ur.nombres, ' ', ur.apellidos) AS realizado_por_nombre,
            CONCAT(ua.nombres, ' ', ua.apellidos) AS aprobado_por_nombre
     FROM mantenimientos_correctivos mc
     JOIN  estados           e  ON e.id  = mc.estado_id
     JOIN  equipos_biomedicos eb ON eb.id = mc.equipo_id
     LEFT JOIN tipo_servicios ts ON ts.id = mc.tipo_servicio_id
     LEFT JOIN sedes         s  ON s.id  = eb.sede_id
     LEFT JOIN municipios    m  ON m.id  = eb.municipio_id
     LEFT JOIN users ur ON ur.id = mc.realizado_por
     LEFT JOIN users ua ON ua.id = mc.aprobado_por
     WHERE mc.id = ? AND mc.empresa_id = ? AND mc.deleted_at IS NULL`,
    [id, empresaId],
  );
  if (!row) throw new AppError("Mantenimiento correctivo no encontrado.", 404);

  const [repuestos] = await pool.query(
    `SELECT rc.id, rc.descripcion, rc.cantidad, cr.nombre AS repuesto
     FROM repuestos_correctivos rc
     LEFT JOIN catalogo_repuestos cr ON cr.id = rc.repuesto_id
     WHERE rc.correctivo_id = ?`,
    [id],
  );

  return { ...row, repuestos };
};

const create = async (data, userId, empresaId) => {
  const {
    equipo_id,
    estado_id,
    servicio,
    fecha_inicio,
    falla_reportada,
    accion_correctiva,
    se_instalaron_partes,
    observaciones,
    fecha_entrega,
    realizado_por,
    aprobado_por,
    firma_realizado,
    firma_aprobado,
    repuestos,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que el equipo pertenece a la empresa
    const [[eq]] = await conn.query(
      "SELECT id FROM equipos_biomedicos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL",
      [equipo_id, empresaId],
    );
    if (!eq) throw new AppError("El equipo no pertenece a esta empresa.", 403);

    // Resolver tipo_servicio_id a partir del ID o del nombre
    const tipo_servicio_id = data.tipo_servicio_id
      ?? await lookupId(conn, 'tipo_servicios', data.tipo_servicio);
    if (!tipo_servicio_id) throw new AppError("Tipo de servicio no encontrado.", 400);

    const [result] = await conn.query(
      `INSERT INTO mantenimientos_correctivos (
        empresa_id, equipo_id, estado_id, tipo_servicio_id, servicio, fecha_inicio, falla_reportada,
        accion_correctiva, se_instalaron_partes, observaciones,
        fecha_entrega, realizado_por, aprobado_por,
        firma_realizado, firma_aprobado
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId,
        equipo_id,
        estado_id,
        tipo_servicio_id,
        servicio         || null,
        fecha_inicio,
        falla_reportada,
        accion_correctiva,
        se_instalaron_partes ?? false,
        observaciones    || null,
        fecha_entrega,
        realizado_por    || null,
        aprobado_por     || null,
        firma_realizado  || null,
        firma_aprobado   || null,
      ],
    );
    const corrId = result.insertId;

    if (Array.isArray(repuestos) && repuestos.length) {
      for (const r of repuestos) {
        await conn.query(
          "INSERT INTO repuestos_correctivos (correctivo_id, repuesto_id, descripcion, cantidad) VALUES (?,?,?,?)",
          [corrId, r.repuesto_id || null, r.descripcion || null, r.cantidad],
        );
      }
    }

    await conn.commit();
    return findById(corrId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, data, userId, empresaId) => {
  await findById(id, empresaId);

  // Resolver tipo_servicio string → tipo_servicio_id si el frontend envía el nombre
  if (!data.tipo_servicio_id && data.tipo_servicio) {
    const [[ts]] = await pool.query(
      'SELECT id FROM tipo_servicios WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      [data.tipo_servicio]
    );
    if (ts) data.tipo_servicio_id = ts.id;
  }

  const allowed = [
    "estado_id",
    "tipo_servicio_id",
    "servicio",
    "fecha_inicio",
    "falla_reportada",
    "accion_correctiva",
    "se_instalaron_partes",
    "observaciones",
    "fecha_entrega",
    "realizado_por",
    "aprobado_por",
    "firma_realizado",
    "firma_aprobado",
  ];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  }

  if (!fields.length) throw new AppError("Sin campos para actualizar.", 400);

  fields.push("updated_at = NOW()");
  values.push(id, empresaId);

  await pool.query(
    `UPDATE mantenimientos_correctivos SET ${fields.join(", ")} WHERE id = ? AND empresa_id = ?`,
    values,
  );

  return findById(id, empresaId);
};

const softDelete = async (id, userId, empresaId) => {
  const [result] = await pool.query(
    `UPDATE mantenimientos_correctivos SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId],
  );
  if (!result.affectedRows)
    throw new AppError("Mantenimiento correctivo no encontrado.", 404);
};

module.exports = { findAll, findById, create, update, softDelete };
