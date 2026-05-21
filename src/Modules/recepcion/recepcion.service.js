const pool = require('../../config/database');
const AppError = require('../../utils/AppError');

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `SELECT r.*,
            mu.nombre AS municipio,
            s.nombre  AS sede
     FROM recepciones_medicamentos r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.id = ? AND r.empresa_id = ? AND r.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!row) throw new AppError('Recepción no encontrada.', 404);

  const [medicamentos] = await pool.query(
    'SELECT * FROM items_recepcion_medicamentos WHERE recepcion_id = ? ORDER BY id',
    [id]
  );

  return { ...row, medicamentos };
};

const findAll = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.fecha, r.hora, r.proveedor, r.remision_factura,
            r.responsable_recibe, r.created_at,
            mu.nombre AS municipio, s.nombre AS sede
     FROM recepciones_medicamentos r
     LEFT JOIN municipios mu ON mu.id = r.municipio_id
     LEFT JOIN sedes      s  ON s.id  = r.sede_id
     WHERE r.empresa_id = ? AND r.deleted_at IS NULL
     ORDER BY r.fecha DESC, r.hora DESC`,
    [empresaId]
  );
  return rows;
};

const create = async (data, userId, empresaId) => {
  const {
    fecha, hora, municipio_id, sede_id, uas, proveedor,
    remision_factura, reactivos, responsable_recibe,
    medicamentos,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO recepciones_medicamentos
         (empresa_id, fecha, hora, municipio_id, sede_id, uas, proveedor,
          remision_factura, reactivos, responsable_recibe, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId, fecha, hora,
        municipio_id   || null,
        sede_id        || null,
        uas            || null,
        proveedor,
        remision_factura,
        reactivos      || null,
        responsable_recibe,
        userId,
      ]
    );
    const recepcionId = result.insertId;

    if (Array.isArray(medicamentos) && medicamentos.length) {
      for (const m of medicamentos) {
        await conn.query(
          `INSERT INTO items_recepcion_medicamentos
             (recepcion_id, catalogo_id, codigo_interno, nombre, presentacion_comercial,
              concentracion, fecha_vencimiento, registro_sanitario, estado_registro,
              cum, atc, laboratorio, cant_solicitada, cant_recepcionada, cant_faltante, lote,
              cadena_frio, temperatura, snna, ta, cod, acr,
              certificado_calidad, tipo_certificado_calidad,
              certificado_esterilizacion, estado_empaque,
              humedo, colapsado, manchado, etiquetas, tipo_etiquetas)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            recepcionId,
            m.catalogo_id                  || null,
            m.codigo_interno               || null,
            m.nombre,
            m.presentacion_comercial       || null,
            m.concentracion                || null,
            m.fecha_vencimiento            || null,
            m.registro_sanitario           || null,
            m.estado_registro              || null,
            m.cum                          || null,
            m.atc                          || null,
            m.laboratorio                  || null,
            m.cant_solicitada              || null,
            m.cant_recepcionada            || null,
            m.cant_faltante                || null,
            m.lote                         || null,
            m.cadena_frio                  ?? false,
            m.temperatura                  || null,
            m.snna                         || null,
            m.ta                           || null,
            m.cod                          || null,
            m.acr                          || null,
            m.certificado_calidad          ?? false,
            m.tipo_certificado_calidad     || null,
            m.certificado_esterilizacion   ?? false,
            m.estado_empaque               || null,
            m.humedo                       ?? false,
            m.colapsado                    ?? false,
            m.manchado                     ?? false,
            m.etiquetas                    ?? false,
            m.tipo_etiquetas               || null,
          ]
        );
      }
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
    `UPDATE recepciones_medicamentos SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Recepción no encontrada.', 404);
};

const findAllItems = async (empresaId) => {
  const [rows] = await pool.query(
    `SELECT i.id, i.recepcion_id,
            i.codigo_interno, i.nombre, i.presentacion_comercial,
            i.concentracion, i.fecha_vencimiento,
            i.cant_solicitada, i.cant_recepcionada,
            r.fecha AS fecha_recepcion, r.proveedor
     FROM items_recepcion_medicamentos i
     JOIN recepciones_medicamentos r ON r.id = i.recepcion_id
     WHERE r.empresa_id = ? AND r.deleted_at IS NULL
     ORDER BY i.nombre ASC`,
    [empresaId]
  );
  return rows;
};

module.exports = { findAll, findAllItems, findById, create, softDelete };
