const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

const findAll = async (empresaId, filters, pag) => {
  const { page, limit, offset } = pag;
  const conds  = ['mp.empresa_id = ?', 'mp.deleted_at IS NULL'];
  const params = [empresaId];

  if (filters.equipo_id)    { conds.push('mp.equipo_id = ?');           params.push(filters.equipo_id); }
  if (filters.fecha_desde)  { conds.push('mp.fecha_mantenimiento >= ?'); params.push(filters.fecha_desde); }
  if (filters.fecha_hasta)  { conds.push('mp.fecha_mantenimiento <= ?'); params.push(filters.fecha_hasta); }
  if (filters.realizado_por){ conds.push('mp.realizado_por = ?');        params.push(filters.realizado_por); }

  const where = conds.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM mantenimientos_preventivos mp WHERE ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT mp.id, mp.numero_inventario, mp.numero_mantenimiento, mp.fecha_mantenimiento,
            mp.tiempo_horas, mp.tiempo_minutos, mp.bioseguridad_verificada, mp.equipo_limpio,
            mp.observaciones, mp.created_at,
            eb.nombre AS equipo, eb.serie AS equipo_serie,
            CONCAT(ur.nombres, ' ', ur.apellidos) AS realizado_por_nombre,
            CONCAT(ua.nombres, ' ', ua.apellidos) AS aprobado_por_nombre
     FROM mantenimientos_preventivos mp
     JOIN  equipos_biomedicos eb ON eb.id = mp.equipo_id
     LEFT JOIN users ur ON ur.id = mp.realizado_por
     LEFT JOIN users ua ON ua.id = mp.aprobado_por
     WHERE ${where}
     ORDER BY mp.fecha_mantenimiento DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, meta: buildMeta(total, page, limit) };
};

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT mp.*,
            eb.nombre        AS equipo,
            eb.serie         AS equipo_serie,
            eb.marca         AS equipo_marca,
            eb.modelo        AS equipo_modelo,
            eb.activo_fijo   AS equipo_activo_fijo,
            eb.descripcion   AS equipo_descripcion,
            eb.ubicacion     AS equipo_ubicacion,
            s.nombre         AS equipo_sede,
            te.nombre        AS equipo_tipo,
            fm.nombre        AS equipo_frecuencia,
            cr.nombre        AS equipo_clasificacion_riesgo,
            cb.nombre        AS equipo_clasificacion_biomedica,
            CONCAT(ur.nombres, ' ', ur.apellidos) AS realizado_por_nombre,
            CONCAT(ua.nombres, ' ', ua.apellidos) AS aprobado_por_nombre
     FROM mantenimientos_preventivos mp
     JOIN  equipos_biomedicos           eb ON eb.id  = mp.equipo_id
     LEFT JOIN sedes                    s  ON s.id   = eb.sede_id
     LEFT JOIN tipos_equipo             te ON te.id  = eb.tipo_equipo_id
     LEFT JOIN frecuencia_mantenimiento fm ON fm.id  = eb.frecuencia_mantenimiento_id
     LEFT JOIN clasificacion_riesgo     cr ON cr.id  = eb.clasificacion_riesgo_id
     LEFT JOIN clasificacion_biomedica  cb ON cb.id  = eb.clasificacion_biomedica_id
     LEFT JOIN users ur ON ur.id = mp.realizado_por
     LEFT JOIN users ua ON ua.id = mp.aprobado_por
     WHERE mp.id = ? AND mp.empresa_id = ? AND mp.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!row) throw new AppError('Mantenimiento preventivo no encontrado.', 404);

  const [repuestos] = await pool.query(
    `SELECT rp.id, rp.cantidad, rp.verificacion_estado, cr.nombre AS repuesto
     FROM repuestos_preventivos rp
     LEFT JOIN catalogo_repuestos cr ON cr.id = rp.repuesto_id
     WHERE rp.preventivo_id = ?`,
    [id]
  );

  const [herramientas] = await pool.query(
    `SELECT h.id, ch.nombre AS herramienta
     FROM herramientas h
     LEFT JOIN catalogo_herramientas ch ON ch.id = h.herramienta_id
     WHERE h.preventivo_id = ?`,
    [id]
  );

  const [insumos] = await pool.query(
    `SELECT i.id, i.cantidad, ci.nombre AS insumo
     FROM insumos i
     LEFT JOIN catalogo_insumos ci ON ci.id = i.insumo_id
     WHERE i.preventivo_id = ?`,
    [id]
  );

  const [actividades] = await pool.query(
    `SELECT ma.id, cam.nombre AS actividad
     FROM mantenimiento_actividades ma
     JOIN catalogo_actividades_mantenimiento cam ON cam.id = ma.actividad_id
     WHERE ma.preventivo_id = ?`,
    [id]
  );

  return { ...row, repuestos, herramientas, insumos, actividades };
};

const create = async (data, userId, empresaId) => {
  const {
    equipo_id, descripcion, numero_inventario, tiempo_horas, tiempo_minutos,
    fecha_mantenimiento, numero_mantenimiento, bioseguridad_verificada, equipo_limpio,
    observaciones, realizado_por, aprobado_por,
    repuestos, herramientas, insumos, actividades,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que el equipo pertenece a la empresa
    const [[eq]] = await conn.query(
      'SELECT id FROM equipos_biomedicos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
      [equipo_id, empresaId]
    );
    if (!eq) throw new AppError('El equipo no pertenece a esta empresa.', 403);

    const [result] = await conn.query(
      `INSERT INTO mantenimientos_preventivos (
        empresa_id, equipo_id, descripcion, numero_inventario,
        tiempo_horas, tiempo_minutos, fecha_mantenimiento, numero_mantenimiento,
        bioseguridad_verificada, equipo_limpio, observaciones,
        realizado_por, aprobado_por, imagen_antes, imagen_despues
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId, equipo_id,
        descripcion         || null, numero_inventario,
        tiempo_horas        || 0,    tiempo_minutos     || 0,
        fecha_mantenimiento, numero_mantenimiento,
        bioseguridad_verificada ?? false,
        equipo_limpio           ?? false,
        observaciones       || null,
        realizado_por       || null,
        aprobado_por        || null,
        data.imagen_antes   || null,
        data.imagen_despues || null,
      ]
    );
    const prevId = result.insertId;

    if (Array.isArray(repuestos) && repuestos.length) {
      for (const r of repuestos) {
        await conn.query(
          'INSERT INTO repuestos_preventivos (preventivo_id, repuesto_id, cantidad, verificacion_estado) VALUES (?,?,?,?)',
          [prevId, r.repuesto_id || null, r.cantidad || null, r.verificacion_estado || null]
        );
      }
    }

    if (Array.isArray(herramientas) && herramientas.length) {
      for (const h of herramientas) {
        await conn.query(
          'INSERT INTO herramientas (preventivo_id, herramienta_id) VALUES (?,?)',
          [prevId, h.herramienta_id || null]
        );
      }
    }

    if (Array.isArray(insumos) && insumos.length) {
      for (const i of insumos) {
        await conn.query(
          'INSERT INTO insumos (preventivo_id, insumo_id, cantidad) VALUES (?,?,?)',
          [prevId, i.insumo_id || null, i.cantidad || null]
        );
      }
    }

    if (Array.isArray(actividades) && actividades.length) {
      for (const actId of actividades) {
        await conn.query(
          'INSERT INTO mantenimiento_actividades (preventivo_id, actividad_id) VALUES (?,?)',
          [prevId, actId]
        );
      }
    }

    await conn.commit();
    return findById(prevId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, data, userId, empresaId) => {
  await findById(id, empresaId);

  const allowed = [
    'descripcion', 'numero_inventario', 'tiempo_horas', 'tiempo_minutos',
    'fecha_mantenimiento', 'numero_mantenimiento', 'bioseguridad_verificada',
    'equipo_limpio', 'observaciones', 'realizado_por', 'aprobado_por',
    'imagen_antes', 'imagen_despues',
  ];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  }

  if (!fields.length) throw new AppError('Sin campos para actualizar.', 400);

  fields.push('updated_at = NOW()');
  values.push(id, empresaId);

  await pool.query(
    `UPDATE mantenimientos_preventivos SET ${fields.join(', ')} WHERE id = ? AND empresa_id = ?`,
    values
  );

  return findById(id, empresaId);
};

const softDelete = async (id, userId, empresaId) => {
  const [result] = await pool.query(
    `UPDATE mantenimientos_preventivos SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Mantenimiento preventivo no encontrado.', 404);
};

module.exports = { findAll, findById, create, update, softDelete };
