const pool = require("../../config/database");
const AppError = require("../../utils/AppError");
const ROLES = require("../../utils/roles");

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT r.*,
            mu.nombre AS municipio,
            s.nombre  AS sede
     FROM recepciones_inventario r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.id = ? AND r.empresa_id = ? AND r.deleted_at IS NULL`,
    [id, empresaId],
  );
  if (!row) throw new AppError("Recepción no encontrada.", 404);

  const [medicamentos] = await pool.query(
    "SELECT * FROM items_recepcion_inventario WHERE recepcion_id = ? ORDER BY id",
    [id],
  );

  return { ...row, medicamentos };
};

// Solo retorna recepciones COMPLETADAS (borradores no aparecen en el listado)
const findAll = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.fecha, r.hora, r.proveedor, r.remision_factura,
            r.responsable_recibe, r.created_at,
            mu.nombre AS municipio, s.nombre AS sede
     FROM recepciones_inventario r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.empresa_id = ? AND r.deleted_at IS NULL AND r.estado = 'COMPLETADA'
     ORDER BY r.fecha DESC, r.hora DESC`,
    [empresaId],
  );
  return rows;
};

// ── BORRADOR: buscar el borrador activo del usuario ───────────────────────────
const findBorradorByUser = async (userId, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT r.*,
            mu.nombre AS municipio,
            s.nombre  AS sede
     FROM recepciones_inventario r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.created_by = ? AND r.empresa_id = ?
       AND r.estado = 'BORRADOR' AND r.deleted_at IS NULL
     ORDER BY r.created_at DESC
     LIMIT 1`,
    [userId, empresaId],
  );
  if (!row) return null;

  const [medicamentos] = await pool.query(
    "SELECT * FROM items_recepcion_inventario WHERE recepcion_id = ? ORDER BY id",
    [row.id],
  );

  return { ...row, medicamentos };
};

// ── Función interna: sincroniza los ítems de un borrador/recepción ────────────
// Actualiza los que ya existen (traen `id`), inserta los nuevos (sin `id`)
// y elimina los que estaban en BD pero ya no vienen en el payload.
const _syncItems = async (conn, recepcionId, medicamentos) => {
  const items = Array.isArray(medicamentos) ? medicamentos : [];

  const [existentes] = await conn.query(
    "SELECT id FROM items_recepcion_inventario WHERE recepcion_id = ?",
    [recepcionId],
  );
  const idsExistentes = new Set(existentes.map((r) => r.id));
  const idsEnviados = new Set(
    items.filter((m) => m.id).map((m) => Number(m.id)),
  );

  const idsAEliminar = [...idsExistentes].filter((id) => !idsEnviados.has(id));
  if (idsAEliminar.length) {
    await conn.query(
      "DELETE FROM items_recepcion_inventario WHERE id IN (?)",
      [idsAEliminar],
    );
  }

  for (const m of items) {
    const fechaVencimiento = m.fecha_vencimiento
      ? new Date(m.fecha_vencimiento).toISOString().split("T")[0]
      : null;

    const valores = [
      m.catalogo_id || null,
      m.tipo_recepcion || "MEDICAMENTOS",
      m.codigo_interno || null,
      m.nombre,
      m.presentacion_comercial || null,
      m.concentracion || null,
      m.ium || null,
      m.unidad_medida || null,
      fechaVencimiento,
      m.registro_sanitario || null,
      m.estado_registro || null,
      m.cum || null,
      m.atc || null,
      m.laboratorio || null,
      m.clasificacion_riesgo || null,
      m.vida_util || null,
      m.serie || null,
      m.cant_solicitada || null,
      m.cant_recepcionada || null,
      m.cant_faltante || null,
      m.lote || null,
      m.cadena_frio ?? false,
      m.temperatura || null,
      m.snna || null,
      m.ta || null,
      m.cod || null,
      m.acr || null,
      m.estado_empaque || null,
      m.humedo ?? false,
      m.colapsado ?? false,
      m.manchado ?? false,
      m.etiquetas ?? false,
      m.tipo_etiquetas || null,
    ];

    if (m.id && idsExistentes.has(Number(m.id))) {
      await conn.query(
        `UPDATE items_recepcion_inventario SET
           catalogo_id=?, tipo_recepcion=?, codigo_interno=?, nombre=?, presentacion_comercial=?,
           concentracion=?, ium=?, unidad_medida=?, fecha_vencimiento=?, registro_sanitario=?,
           estado_registro=?, cum=?, atc=?, laboratorio=?, clasificacion_riesgo=?, vida_util=?,
           serie=?, cant_solicitada=?, cant_recepcionada=?, cant_faltante=?, lote=?, cadena_frio=?,
           temperatura=?, snna=?, ta=?, cod=?, acr=?, estado_empaque=?, humedo=?, colapsado=?,
           manchado=?, etiquetas=?, tipo_etiquetas=?
         WHERE id = ? AND recepcion_id = ?`,
        [...valores, Number(m.id), recepcionId],
      );
    } else {
      await conn.query(
        `INSERT INTO items_recepcion_inventario
           (recepcion_id, catalogo_id, tipo_recepcion, codigo_interno, nombre, presentacion_comercial,
            concentracion, ium, unidad_medida,
            fecha_vencimiento, registro_sanitario, estado_registro,
            cum, atc, laboratorio,
            clasificacion_riesgo, vida_util, serie,
            cant_solicitada, cant_recepcionada, cant_faltante, lote,
            cadena_frio, temperatura, snna, ta, cod, acr,
            estado_empaque,
            humedo, colapsado, manchado, etiquetas, tipo_etiquetas)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [recepcionId, ...valores],
      );
    }
  }
};

// ── BORRADOR: guardar o actualizar ────────────────────────────────────────────
// Si el usuario ya tiene un borrador, lo reemplaza. Si no, crea uno nuevo.
const saveBorrador = async (data, userId, empresaId) => {
  const {
    tipo_recepcion,
    fecha,
    hora,
    municipio_id,
    sede_id,
    uas,
    proveedor,
    remision_factura,
    reactivos,
    responsable_recibe,
    medicamentos,
    borradorId,
  } = data;

  const fechaRecepcion = fecha
    ? new Date(fecha).toISOString().split("T")[0]
    : null;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let recepcionId = borradorId || null;

    if (recepcionId) {
      // Verificar que el borrador pertenece a este usuario y empresa
      const [[existente]] = await conn.query(
        `SELECT id FROM recepciones_inventario
         WHERE id = ? AND created_by = ? AND empresa_id = ? AND estado = 'BORRADOR' AND deleted_at IS NULL`,
        [recepcionId, userId, empresaId],
      );
      if (!existente) recepcionId = null;
    }

    if (recepcionId) {
      // Actualizar cabecera del borrador existente
      await conn.query(
        `UPDATE recepciones_inventario SET
           fecha = ?, hora = ?, municipio_id = ?, sede_id = ?, uas = ?,
           proveedor = ?, remision_factura = ?, reactivos = ?, responsable_recibe = ?
         WHERE id = ?`,
        [
          fechaRecepcion,
          hora,
          municipio_id || null,
          sede_id || null,
          uas || null,
          proveedor,
          remision_factura,
          reactivos || null,
          responsable_recibe,
          recepcionId,
        ],
      );
    } else {
      // Crear borrador nuevo
      const [result] = await conn.query(
        `INSERT INTO recepciones_inventario
           (empresa_id, fecha, hora, municipio_id, sede_id, uas, proveedor,
            remision_factura, reactivos, responsable_recibe, estado, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          empresaId,
          fechaRecepcion,
          hora,
          municipio_id || null,
          sede_id || null,
          uas || null,
          proveedor,
          remision_factura,
          reactivos || null,
          responsable_recibe,
          "BORRADOR",
          userId,
        ],
      );
      recepcionId = result.insertId;
    }

    await _syncItems(conn, recepcionId, medicamentos);
    await conn.commit();
    return findById(recepcionId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── BORRADOR: eliminar ────────────────────────────────────────────────────────
const deleteBorrador = async (id, userId, empresaId) => {
  const [result] = await pool.query(
    `UPDATE recepciones_inventario SET deleted_at = NOW()
     WHERE id = ? AND created_by = ? AND empresa_id = ? AND estado = 'BORRADOR' AND deleted_at IS NULL`,
    [id, userId, empresaId],
  );
  if (!result.affectedRows) throw new AppError("Borrador no encontrado.", 404);
};

// ── Crear recepción COMPLETADA ────────────────────────────────────────────────
const create = async (data, userId, empresaId) => {
  const {
    tipo_recepcion,
    fecha,
    hora,
    municipio_id,
    sede_id,
    uas,
    proveedor,
    remision_factura,
    reactivos,
    responsable_recibe,
    medicamentos,
    borradorId,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO recepciones_inventario
         (empresa_id, fecha, hora, municipio_id, sede_id, uas, proveedor,
          remision_factura, reactivos, responsable_recibe, estado, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId,
        fecha,
        hora,
        municipio_id || null,
        sede_id || null,
        uas || null,
        proveedor,
        remision_factura,
        reactivos || null,
        responsable_recibe,
        "COMPLETADA",
        userId,
      ],
    );
    const recepcionId = result.insertId;

    await _syncItems(conn, recepcionId, medicamentos);

    // Si venía de un borrador, eliminarlo
    if (borradorId) {
      await conn.query(
        `UPDATE recepciones_inventario SET deleted_at = NOW()
         WHERE id = ? AND created_by = ? AND empresa_id = ? AND estado = 'BORRADOR'`,
        [borradorId, userId, empresaId],
      );
    }

    await conn.commit();
    return findById(recepcionId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const softDelete = async (id, empresaId) => {
  const [result] = await pool.query(
    `UPDATE recepciones_inventario SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId],
  );
  if (!result.affectedRows) throw new AppError("Recepción no encontrada.", 404);
};

// Solo ítems de recepciones COMPLETADAS (borradores no tienen stock)
const findAllItems = async (empresaId, userId, rolId) => {
  let municipioId = null;

  if (rolId !== ROLES.ADMIN) {
    const [[profile]] = await pool.query(
      "SELECT municipio_id FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    if (profile) municipioId = profile.municipio_id;
  }

  const conds = [
    "r.empresa_id = ?",
    "r.deleted_at IS NULL",
    "r.estado = 'COMPLETADA'",
  ];
  const params = [empresaId];

  if (municipioId) {
    conds.push("r.municipio_id = ?");
    params.push(municipioId);
  }

  const where = conds.join(" AND ");

  const [rows] = await pool.query(
    `SELECT i.id, i.recepcion_id,
            i.tipo_recepcion,
            i.codigo_interno, i.nombre, i.presentacion_comercial,
            i.concentracion, i.fecha_vencimiento, i.lote,
            i.cant_solicitada, i.cant_recepcionada,
            COALESCE(SUM(CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END), 0) AS total_salidas,
            GREATEST(0, COALESCE(i.cant_recepcionada, 0)
                      - COALESCE(SUM(CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END), 0)) AS stock,
            r.fecha AS fecha_recepcion, r.proveedor,
            (SELECT CONCAT(d.tipo, '|', CONCAT(u.nombres, ' ', u.apellidos))
             FROM dispensacion_items di2
             JOIN dispensaciones d ON d.id = di2.dispensacion_id
             JOIN users u ON u.id = d.destinatario_id
             WHERE di2.item_id = i.id AND d.estado IN ('PENDIENTE','ACEPTADO')
             ORDER BY d.created_at DESC LIMIT 1
            ) AS dispensacion_activa
     FROM items_recepcion_inventario i
     JOIN recepciones_inventario r ON r.id = i.recepcion_id
     LEFT JOIN salidas_medicamentos s ON s.item_id = i.id
     WHERE ${where}
     GROUP BY i.id
     ORDER BY i.nombre ASC`,
    params,
  );
  return rows;
};

const createSalida = async (data, userId, empresaId) => {
  const {
    item_id,
    cantidad,
    fecha,
    motivo,
    responsable,
    municipio_destino_id,
    sede_destino_id,
  } = data;

  const [[item]] = await pool.query(
    `SELECT i.id, i.nombre,
            COALESCE(i.cant_recepcionada, 0) AS cant_recepcionada,
            COALESCE(SUM(CASE WHEN s.estado != 'RECHAZADO' THEN s.cantidad ELSE 0 END), 0) AS total_salidas,
            r.municipio_id AS municipio_origen_id,
            r.sede_id      AS sede_origen_id
     FROM items_recepcion_inventario i
     JOIN recepciones_inventario r ON r.id = i.recepcion_id
     LEFT JOIN salidas_medicamentos s ON s.item_id = i.id
     WHERE i.id = ? AND r.empresa_id = ?
     GROUP BY i.id`,
    [item_id, empresaId],
  );
  if (!item) throw new AppError("Ítem no encontrado.", 404);

  const stock = Math.max(0, item.cant_recepcionada - item.total_salidas);
  if (cantidad > stock) {
    throw new AppError(`Stock insuficiente. Disponible: ${stock}`, 400);
  }

  const esTraslado = motivo === "Traslado";
  const estadoSalida = esTraslado ? "PENDIENTE" : "ACTIVO";

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO salidas_medicamentos
         (empresa_id, item_id, cantidad, fecha, motivo, responsable, estado,
          municipio_destino_id, sede_destino_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empresaId,
        item_id,
        cantidad,
        fecha,
        motivo,
        responsable,
        estadoSalida,
        municipio_destino_id || null,
        sede_destino_id || null,
        userId,
      ],
    );
    const salidaId = result.insertId;

    if (esTraslado) {
      await conn.query(
        `INSERT INTO traslados_pendientes
           (empresa_id, salida_id, item_id, cantidad, medicamento_nombre,
            responsable_origen, municipio_origen_id, sede_origen_id,
            municipio_destino_id, sede_destino_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empresaId,
          salidaId,
          item_id,
          cantidad,
          item.nombre,
          responsable,
          item.municipio_origen_id || null,
          item.sede_origen_id || null,
          municipio_destino_id || null,
          sede_destino_id || null,
        ],
      );
    }

    await conn.commit();
    return salidaId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getSalidasByItem = async (itemId, empresaId) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.item_id, s.cantidad, s.fecha, s.motivo, s.responsable,
            s.estado, s.municipio_destino_id, s.sede_destino_id, s.created_at,
            mu.nombre AS municipio_destino, se.nombre AS sede_destino
     FROM salidas_medicamentos s
     JOIN items_recepcion_inventario i ON i.id = s.item_id
     JOIN recepciones_inventario r     ON r.id = i.recepcion_id
     LEFT JOIN municipios mu ON mu.id = s.municipio_destino_id
     LEFT JOIN sedes      se ON se.id = s.sede_destino_id
     WHERE s.item_id = ? AND r.empresa_id = ?
     ORDER BY s.fecha DESC, s.created_at DESC`,
    [itemId, empresaId],
  );
  return rows;
};

module.exports = {
  findAll,
  findAllItems,
  findById,
  create,
  softDelete,
  createSalida,
  getSalidasByItem,
  findBorradorByUser,
  saveBorrador,
  deleteBorrador,
};
