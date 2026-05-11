const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, buildMeta } = require('../../utils/pagination');

// ── Aliases use camelCase to match the frontend EquipoBiomedico type ─────────
const BASE_SELECT = `
  SELECT
    e.id, e.nombre, e.activo_fijo, e.marca, e.modelo,
    e.serie                AS numeroSerie,
    e.codigo_ecri          AS codigoEcri,
    e.registro_invima      AS registroInvima,
    e.ubicacion,
    e.costo_adquisicion, e.forma_adquisicion,
    e.fecha_compra, e.fecha_instalacion, e.inicio_garantia,
    e.fecha_fin_garantia, e.fecha_servicio,
    e.imagen_url, e.descripcion, e.activo,
    e.created_at, e.updated_at,
    e.sede_id,
    e.municipio_id         AS municipioId,
    e.tipo_equipo_id, e.fabricante_id,
    e.proveedor_id, e.nivel_riesgo_id, e.clasificacion_riesgo_id,
    e.clasificacion_biomedica_id, e.frecuencia_mantenimiento_id, e.nivel_complejidad_id,
    s.nombre               AS sede,
    m.nombre               AS municipioNombre,
    te.nombre              AS tipoEquipo,
    f.nombre               AS nombre_fabricante,
    f.telefono             AS telefono_fabricante,
    f.direccion            AS direccion_fabricante,
    f.lugar                AS lugar_fabricante,
    f.correo               AS correo_fabricante,
    p.nombre               AS proveedor,
    nr.nombre              AS nivelRiesgo,
    cr.nombre              AS claseRiesgo,
    cb.nombre              AS clasificacionBiomedica,
    fm.nombre              AS frecuenciaMantenimiento,
    nc.nombre              AS nivelComplejidad,
    CONCAT(u.nombres, ' ', u.apellidos) AS creado_por
  FROM equipos_biomedicos e
  LEFT JOIN sedes                    s  ON s.id  = e.sede_id
  LEFT JOIN municipios               m  ON m.id  = e.municipio_id
  LEFT JOIN tipos_equipo             te ON te.id = e.tipo_equipo_id
  LEFT JOIN fabricantes              f  ON f.id  = e.fabricante_id
  LEFT JOIN proveedores              p  ON p.id  = e.proveedor_id
  LEFT JOIN nivel_riesgo             nr ON nr.id = e.nivel_riesgo_id
  LEFT JOIN clasificacion_riesgo     cr ON cr.id = e.clasificacion_riesgo_id
  LEFT JOIN clasificacion_biomedica  cb ON cb.id = e.clasificacion_biomedica_id
  LEFT JOIN frecuencia_mantenimiento fm ON fm.id = e.frecuencia_mantenimiento_id
  LEFT JOIN nivel_complejidad        nc ON nc.id = e.nivel_complejidad_id
  LEFT JOIN users                    u  ON u.id  = e.created_by
`;

const parseNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

// Look up a catalog ID by its nombre (case-insensitive)
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
  const conds  = ['e.empresa_id = ?', 'e.deleted_at IS NULL'];
  const params = [empresaId];

  if (filters.tipo_equipo_id)  { conds.push('e.tipo_equipo_id = ?');  params.push(filters.tipo_equipo_id); }
  if (filters.sede_id)         { conds.push('e.sede_id = ?');         params.push(filters.sede_id); }
  if (filters.municipio_id)    { conds.push('e.municipio_id = ?');    params.push(filters.municipio_id); }
  if (filters.fabricante_id)   { conds.push('e.fabricante_id = ?');   params.push(filters.fabricante_id); }
  if (filters.nivel_riesgo_id) { conds.push('e.nivel_riesgo_id = ?'); params.push(filters.nivel_riesgo_id); }
  if (typeof filters.activo === 'boolean') {
    conds.push('e.activo = ?');
    params.push(filters.activo);
  }
  if (filters.search) {
    conds.push('(e.nombre LIKE ? OR e.serie LIKE ? OR e.marca LIKE ?)');
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }

  const where = conds.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM equipos_biomedicos e WHERE ${where}`,
    params
  );

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ${where} ORDER BY e.nombre ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, meta: buildMeta(total, page, limit) };
};

const findById = async (id, empresaId) => {
  const [[row]] = await pool.query(
    `${BASE_SELECT} WHERE e.id = ? AND e.empresa_id = ? AND e.deleted_at IS NULL`,
    [id, empresaId]
  );
  if (!row) throw new AppError('Equipo no encontrado.', 404);

  // ── Características técnicas (flattened into root object) ──
  const [[caract]] = await pool.query(
    `SELECT ct.*, clt.nombre AS clase_tecnologia
     FROM caracteristicas_tecnicas ct
     LEFT JOIN clase_tecnologia clt ON clt.id = ct.clase_tecnologia_id
     WHERE ct.equipo_id = ?`,
    [id]
  );

  // ── Soporte técnico (flattened into root object) ──
  const [[soporteTec]] = await pool.query(
    'SELECT * FROM soporte_tecnico WHERE equipo_id = ?',
    [id]
  );

  // ── Preventivos ──
  const [preventivos] = await pool.query(
    `SELECT mp.id, mp.equipo_id, mp.numero_mantenimiento, mp.fecha_mantenimiento,
            mp.bioseguridad_verificada, mp.equipo_limpio,
            mp.observaciones, mp.created_at,
            u.nombres, u.apellidos
     FROM mantenimientos_preventivos mp
     LEFT JOIN users u ON u.id = mp.realizado_por
     WHERE mp.equipo_id = ? AND mp.empresa_id = ? AND mp.deleted_at IS NULL
     ORDER BY mp.fecha_mantenimiento DESC`,
    [id, empresaId]
  );

  // ── Correctivos ──
  const [correctivos] = await pool.query(
    `SELECT mc.id, mc.equipo_id, mc.fecha_inicio, mc.falla_reportada,
            mc.accion_correctiva, mc.se_instalaron_partes,
            mc.observaciones, mc.created_at,
            e.nombre AS estado,
            u.nombres, u.apellidos
     FROM mantenimientos_correctivos mc
     JOIN  estados e ON e.id = mc.estado_id
     LEFT JOIN users u ON u.id = mc.realizado_por
     WHERE mc.equipo_id = ? AND mc.empresa_id = ? AND mc.deleted_at IS NULL
     ORDER BY mc.fecha_inicio DESC`,
    [id, empresaId]
  );

  // ── Componentes ──
  const [componentes] = await pool.query(
    'SELECT id, nombre, marca, modelo, serie FROM componentes WHERE equipo_id = ?',
    [id]
  );

  // ── Documentos ──
  const [documentos] = await pool.query(
    `SELECT td.nombre AS tipo_documento, d.url
     FROM documentos d
     JOIN tipos_documento td ON td.id = d.tipo_documento_id
     WHERE d.equipo_id = ?`,
    [id]
  );

  return {
    ...row,
    // Flatten caracteristicas_tecnicas
    ...(caract ? {
      clase_tecnologia:    caract.clase_tecnologia   ?? null,
      fuente_energia:      caract.fuente_energia      ?? null,
      voltaje:             caract.voltaje?.toString() ?? null,
      voltaje_max_operacion: caract.voltaje_max_operacion ?? null,
      corriente_maxima:    caract.corriente_maxima?.toString() ?? null,
      corriente_minima:    caract.corriente_minima?.toString() ?? null,
      potencia:            caract.potencia?.toString() ?? null,
      frecuencia:          caract.frecuencia?.toString() ?? null,
      humedad:             caract.humedad              ?? null,
      longitud_onda:       caract.longitud_onda        ?? null,
      temperatura:         caract.temperatura          ?? null,
      temperatura_max:     caract.temperatura_max      ?? null,
      peso:                caract.peso                 ?? null,
      capacidad:           caract.capacidad            ?? null,
      vida_util:           caract.vida_util            ?? null,
      fecha_fabricacion:   caract.fecha_fabricacion    ?? null,
      requiere_agua:       caract.requiere_agua        ?? false,
      requiere_gas:        caract.requiere_gas         ?? false,
      requiere_combustible: caract.requiere_combustible ?? false,
    } : {}),
    // Flatten soporte_tecnico
    verificable:              soporteTec?.verificable              ?? false,
    calibrable:               soporteTec?.calibrable               ?? false,
    manual_usuario:           soporteTec?.manual_usuario           ?? false,
    periodicidad_calibracion: soporteTec?.periodicidad_calibracion ?? null,
    recomendaciones:          soporteTec?.recomendaciones          ?? null,
    manuales:  soporteTec?.manuales  ? (typeof soporteTec.manuales  === 'string' ? JSON.parse(soporteTec.manuales)  : soporteTec.manuales)  : [],
    planos:    soporteTec?.planos    ? (typeof soporteTec.planos    === 'string' ? JSON.parse(soporteTec.planos)    : soporteTec.planos)    : [],
    preventivos,
    correctivos,
    componentes,
    documentos: documentos.map((d) => ({ tipo: d.tipo_documento, url: d.url ?? null })),
  };
};

const create = async (data, userId, empresaId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Resolve catalog IDs from names (frontend sends strings) ──────────────
    const tipo_equipo_id              = data.tipo_equipo_id              ?? await lookupId(conn, 'tipos_equipo',             data.tipoEquipo);
    const nivel_riesgo_id             = data.nivel_riesgo_id             ?? await lookupId(conn, 'nivel_riesgo',             data.nivelRiesgo);
    const clasificacion_riesgo_id     = data.clasificacion_riesgo_id     ?? await lookupId(conn, 'clasificacion_riesgo',     data.clasificacion_riesgo);
    const clasificacion_biomedica_id  = data.clasificacion_biomedica_id  ?? await lookupId(conn, 'clasificacion_biomedica',  data.clasificacion_biomedica);
    const frecuencia_mantenimiento_id = data.frecuencia_mantenimiento_id ?? await lookupId(conn, 'frecuencia_mantenimiento', data.frecuencia_mantenimiento);
    const nivel_complejidad_id        = data.nivel_complejidad_id        ?? await lookupId(conn, 'nivel_complejidad',        data.nivelComplejidad);
    // Proveedor: upsert by name (same pattern as fabricante)
    let proveedor_id = data.proveedor_id ?? null;
    if (!proveedor_id && data.proveedor) {
      const [[prov]] = await conn.query(
        'SELECT id FROM proveedores WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
        [data.proveedor]
      );
      if (prov) {
        proveedor_id = prov.id;
      } else {
        const [provRes] = await conn.query(
          'INSERT INTO proveedores (nombre) VALUES (?)',
          [data.proveedor]
        );
        proveedor_id = provRes.insertId;
      }
    }

    // Fabricante: upsert by name, save contact fields
    let fabricante_id = data.fabricante_id ?? null;
    if (!fabricante_id && data.nombre_fabricante) {
      const [[fab]] = await conn.query(
        'SELECT id FROM fabricantes WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
        [data.nombre_fabricante]
      );
      if (fab) {
        fabricante_id = fab.id;
        await conn.query(
          `UPDATE fabricantes SET
             telefono  = COALESCE(?, telefono),
             direccion = COALESCE(?, direccion),
             lugar     = COALESCE(?, lugar),
             correo    = COALESCE(?, correo)
           WHERE id = ?`,
          [
            data.telefono_fabricante  ? String(data.telefono_fabricante)  : null,
            data.direccion_fabricante || null,
            data.lugar_fabricante     || null,
            data.correo_fabricante    || null,
            fab.id,
          ]
        );
      } else {
        const [fabRes] = await conn.query(
          'INSERT INTO fabricantes (nombre, telefono, direccion, lugar, correo) VALUES (?,?,?,?,?)',
          [
            data.nombre_fabricante,
            data.telefono_fabricante  ? String(data.telefono_fabricante)  : null,
            data.direccion_fabricante || null,
            data.lugar_fabricante     || null,
            data.correo_fabricante    || null,
          ]
        );
        fabricante_id = fabRes.insertId;
      }
    }

    // sede_id: use numeric if given, skip name lookup
    const sede_id = data.sede_id ?? null;
    if (sede_id) {
      const [[sede]] = await conn.query(
        'SELECT id FROM sedes WHERE id = ? AND empresa_id = ?',
        [sede_id, empresaId]
      );
      if (!sede) throw new AppError('La sede no pertenece a esta empresa.', 403);
    }

    const [result] = await conn.query(
      `INSERT INTO equipos_biomedicos (
        empresa_id, sede_id, municipio_id, tipo_equipo_id, fabricante_id, proveedor_id,
        nivel_riesgo_id, clasificacion_riesgo_id, clasificacion_biomedica_id,
        frecuencia_mantenimiento_id, nivel_complejidad_id,
        nombre, activo_fijo, marca, modelo, serie, codigo_ecri, registro_invima,
        ubicacion, costo_adquisicion, forma_adquisicion,
        fecha_compra, fecha_instalacion, inicio_garantia, fecha_fin_garantia,
        fecha_servicio, imagen_url, descripcion, created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        empresaId,
        sede_id                       || null,
        data.municipio_id             || null,
        tipo_equipo_id                || null,
        fabricante_id                 || null,
        proveedor_id                  || null,
        nivel_riesgo_id               || null,
        clasificacion_riesgo_id       || null,
        clasificacion_biomedica_id    || null,
        frecuencia_mantenimiento_id   || null,
        nivel_complejidad_id          || null,
        data.nombre,
        data.activo_fijo              || null,
        data.marca                    || null,
        data.modelo                   || null,
        data.serie,
        data.codigoEcri               || null,
        data.registro_invima          || null,
        data.ubicacion                || null,
        data.costo_adquisicion        ?? null,
        data.forma_adquisicion        || null,
        toDateStr(data.fecha_compra),
        toDateStr(data.fecha_instalacion),
        toDateStr(data.inicio_garantia),
        toDateStr(data.fecha_fin_garantia),
        toDateStr(data.fecha_servicio),
        data.imagen_url               || null,
        data.descripcion              || null,
        userId,
      ]
    );
    const equipoId = result.insertId;

    // ── Características técnicas ─────────────────────────────────
    // Accept flat fields OR nested caracteristicas_tecnicas object
    const ct = data.caracteristicas_tecnicas || {};
    const ctClaseTec  = ct.clase_tecnologia_id ?? await lookupId(conn, 'clase_tecnologia', data.clase_tecnologia ?? ct.clase_tecnologia);
    const ctFuente    = data.fuente_energia        || ct.fuente_energia        || null;
    const ctVoltaje   = parseNum(data.voltaje      ?? ct.voltaje);
    const ctVoltajeMx = data.voltaje_max_operacion || ct.voltaje_max_operacion || null;
    const ctCorrMax   = parseNum(data.corriente_maxima ?? ct.corriente_maxima);
    const ctCorrMin   = parseNum(data.corriente_minima ?? ct.corriente_minima);
    const ctPotencia  = parseNum(data.potencia     ?? ct.potencia);
    const ctFrecuencia= parseNum(data.frecuencia   ?? ct.frecuencia);
    const ctHumedad   = data.humedad               || ct.humedad               || null;
    const ctLongOnda  = data.longitud_onda         || ct.longitud_onda         || null;
    const ctTemp      = data.temperatura           || ct.temperatura           || null;
    const ctTempMax   = data.temperatura_max       || ct.temperatura_max       || null;
    const ctPeso      = data.peso                  || ct.peso                  || null;
    const ctCapacidad = data.capacidad             || ct.capacidad             || null;
    const ctVidaUtil  = data.vida_util             ?? ct.vida_util             ?? null;
    const ctFecFab    = toDateStr(data.fecha_fabricacion ?? ct.fecha_fabricacion);
    const ctAgua      = data.requiere_agua         ?? ct.requiere_agua         ?? null;
    const ctGas       = data.requiere_gas          ?? ct.requiere_gas          ?? null;
    const ctCombust   = data.requiere_combustible  ?? ct.requiere_combustible  ?? null;

    const hasTech = [ctClaseTec, ctFuente, ctVoltaje, ctVoltajeMx, ctCorrMax, ctCorrMin,
      ctPotencia, ctFrecuencia, ctHumedad, ctLongOnda, ctTemp, ctTempMax, ctPeso,
      ctCapacidad, ctVidaUtil, ctFecFab, ctAgua, ctGas, ctCombust]
      .some(v => v !== null && v !== undefined && v !== '');

    if (hasTech) {
      await conn.query(
        `INSERT INTO caracteristicas_tecnicas (
          equipo_id, clase_tecnologia_id, fuente_energia, voltaje, voltaje_max_operacion,
          corriente_maxima, corriente_minima, potencia, frecuencia, humedad,
          longitud_onda, temperatura, temperatura_max, peso, capacidad,
          vida_util, fecha_fabricacion,
          requiere_agua, requiere_gas, requiere_combustible
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          equipoId, ctClaseTec, ctFuente, ctVoltaje, ctVoltajeMx,
          ctCorrMax, ctCorrMin, ctPotencia, ctFrecuencia, ctHumedad,
          ctLongOnda, ctTemp, ctTempMax, ctPeso, ctCapacidad,
          ctVidaUtil, ctFecFab, ctAgua, ctGas, ctCombust,
        ]
      );
    }

    // ── Componentes ───────────────────────────────────────────────
    if (Array.isArray(data.componentes) && data.componentes.length) {
      for (const comp of data.componentes) {
        await conn.query(
          'INSERT INTO componentes (equipo_id, nombre, marca, modelo, serie) VALUES (?,?,?,?,?)',
          [equipoId, comp.nombre || null, comp.marca || null, comp.modelo || null, comp.serie || null]
        );
      }
    }

    // ── Documentos (accept string names OR {tipo_documento_id} objects) ────────
    const docsPayload = Array.isArray(data.documentos) ? data.documentos : [];
    for (const doc of docsPayload) {
      let tid = null;
      if (typeof doc === 'string') {
        tid = await lookupId(conn, 'tipos_documento', doc);
      } else if (doc?.tipo_documento_id) {
        tid = doc.tipo_documento_id;
      }
      if (tid) {
        await conn.query(
          'INSERT INTO documentos (equipo_id, tipo_documento_id, url) VALUES (?,?,?)',
          [equipoId, tid, (typeof doc === 'object' ? doc.url : null) || null]
        );
      }
    }

    // ── Soporte técnico ───────────────────────────────────────────
    const st = data.soporte_tecnico || {};
    const stVerif    = data.verificable              ?? st.verificable              ?? null;
    const stCalib    = data.calibrable               ?? st.calibrable               ?? null;
    const stManual   = data.manual_usuario           ?? st.manual_usuario           ?? null;
    const stPeriod   = data.periodicidad_calibracion || st.periodicidad_calibracion || null;
    const stRec      = data.recomendaciones          || st.recomendaciones          || null;
    const stManuales = Array.isArray(data.manuales) ? JSON.stringify(data.manuales) : null;
    const stPlanos   = Array.isArray(data.planos)   ? JSON.stringify(data.planos)   : null;

    if ([stVerif, stCalib, stManual, stPeriod, stRec, stManuales, stPlanos].some(v => v !== null && v !== undefined)) {
      await conn.query(
        `INSERT INTO soporte_tecnico
           (equipo_id, verificable, calibrable, manual_usuario, periodicidad_calibracion, recomendaciones, manuales, planos)
         VALUES (?,?,?,?,?,?,?,?)`,
        [equipoId, stVerif, stCalib, stManual, stPeriod, stRec, stManuales, stPlanos]
      );
    }

    await conn.commit();
    return findById(equipoId, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const DATE_FIELDS = new Set([
  'fecha_compra', 'fecha_instalacion', 'inicio_garantia',
  'fecha_fin_garantia', 'fecha_servicio',
]);

// Normalise any date value to YYYY-MM-DD (strips ISO timestamp suffix)
const toDateStr = (v) => {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

const update = async (id, data, userId, empresaId) => {
  await findById(id, empresaId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Resolve catalog string names → numeric IDs ────────────────────────
    if (!data.tipo_equipo_id && data.tipoEquipo)
      data.tipo_equipo_id = await lookupId(conn, 'tipos_equipo', data.tipoEquipo);
    if (!data.nivel_riesgo_id && data.nivelRiesgo)
      data.nivel_riesgo_id = await lookupId(conn, 'nivel_riesgo', data.nivelRiesgo);
    if (!data.clasificacion_riesgo_id && data.clasificacion_riesgo)
      data.clasificacion_riesgo_id = await lookupId(conn, 'clasificacion_riesgo', data.clasificacion_riesgo);
    if (!data.clasificacion_biomedica_id && data.clasificacion_biomedica)
      data.clasificacion_biomedica_id = await lookupId(conn, 'clasificacion_biomedica', data.clasificacion_biomedica);
    if (!data.frecuencia_mantenimiento_id && data.frecuencia_mantenimiento)
      data.frecuencia_mantenimiento_id = await lookupId(conn, 'frecuencia_mantenimiento', data.frecuencia_mantenimiento);
    if (!data.nivel_complejidad_id && data.nivelComplejidad)
      data.nivel_complejidad_id = await lookupId(conn, 'nivel_complejidad', data.nivelComplejidad);
    // Proveedor: upsert by name (same pattern as fabricante)
    if (!data.proveedor_id && data.proveedor) {
      const [[prov]] = await conn.query(
        'SELECT id FROM proveedores WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
        [data.proveedor]
      );
      if (prov) {
        data.proveedor_id = prov.id;
      } else {
        const [provRes] = await conn.query(
          'INSERT INTO proveedores (nombre) VALUES (?)',
          [data.proveedor]
        );
        data.proveedor_id = provRes.insertId;
      }
    }

    // Fabricante: upsert by name, save contact fields
    if (!data.fabricante_id && data.nombre_fabricante) {
      const [[fab]] = await conn.query(
        'SELECT id FROM fabricantes WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
        [data.nombre_fabricante]
      );
      if (fab) {
        data.fabricante_id = fab.id;
        await conn.query(
          `UPDATE fabricantes SET
             telefono  = COALESCE(?, telefono),
             direccion = COALESCE(?, direccion),
             lugar     = COALESCE(?, lugar),
             correo    = COALESCE(?, correo)
           WHERE id = ?`,
          [
            data.telefono_fabricante  ? String(data.telefono_fabricante)  : null,
            data.direccion_fabricante || null,
            data.lugar_fabricante     || null,
            data.correo_fabricante    || null,
            fab.id,
          ]
        );
      } else {
        const [res] = await conn.query(
          'INSERT INTO fabricantes (nombre, telefono, direccion, lugar, correo) VALUES (?,?,?,?,?)',
          [
            data.nombre_fabricante,
            data.telefono_fabricante  ? String(data.telefono_fabricante)  : null,
            data.direccion_fabricante || null,
            data.lugar_fabricante     || null,
            data.correo_fabricante    || null,
          ]
        );
        data.fabricante_id = res.insertId;
      }
    }

    // Normalise camelCase frontend field → snake_case DB column
    if (data.codigoEcri !== undefined && data.codigo_ecri === undefined)
      data.codigo_ecri = data.codigoEcri;

    // ── Update main equipos_biomedicos row ────────────────────────────────
    const allowed = [
      'sede_id', 'municipio_id', 'tipo_equipo_id', 'fabricante_id', 'proveedor_id',
      'nivel_riesgo_id', 'clasificacion_riesgo_id', 'clasificacion_biomedica_id',
      'frecuencia_mantenimiento_id', 'nivel_complejidad_id',
      'nombre', 'activo_fijo', 'marca', 'modelo', 'serie', 'codigo_ecri',
      'registro_invima', 'ubicacion', 'costo_adquisicion', 'forma_adquisicion',
      'fecha_compra', 'fecha_instalacion', 'inicio_garantia', 'fecha_fin_garantia',
      'fecha_servicio', 'imagen_url', 'descripcion', 'activo',
    ];

    const mainFields = [];
    const mainValues = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        const val = DATE_FIELDS.has(key) ? toDateStr(data[key]) : (data[key] ?? null);
        mainFields.push(`${key} = ?`);
        mainValues.push(val);
      }
    }

    if (mainFields.length) {
      mainFields.push('updated_by = ?', 'updated_at = NOW()');
      mainValues.push(userId, id, empresaId);
      await conn.query(
        `UPDATE equipos_biomedicos SET ${mainFields.join(', ')} WHERE id = ? AND empresa_id = ?`,
        mainValues
      );
    }

    // ── Upsert características técnicas ───────────────────────────────────
    const ct = data.caracteristicas_tecnicas || {};
    const ctClaseTec = ct.clase_tecnologia_id
      ?? await lookupId(conn, 'clase_tecnologia', data.clase_tecnologia ?? ct.clase_tecnologia);
    const ctVals = [
      ctClaseTec,
      data.fuente_energia        ?? ct.fuente_energia        ?? null,
      parseNum(data.voltaje      ?? ct.voltaje),
      data.voltaje_max_operacion ?? ct.voltaje_max_operacion ?? null,
      parseNum(data.corriente_maxima ?? ct.corriente_maxima),
      parseNum(data.corriente_minima ?? ct.corriente_minima),
      parseNum(data.potencia     ?? ct.potencia),
      parseNum(data.frecuencia   ?? ct.frecuencia),
      data.humedad               ?? ct.humedad               ?? null,
      data.longitud_onda         ?? ct.longitud_onda         ?? null,
      data.temperatura           ?? ct.temperatura           ?? null,
      data.temperatura_max       ?? ct.temperatura_max       ?? null,
      data.peso                  ?? ct.peso                  ?? null,
      data.capacidad             ?? ct.capacidad             ?? null,
      data.vida_util             ?? ct.vida_util             ?? null,
      toDateStr(data.fecha_fabricacion ?? ct.fecha_fabricacion),
      data.requiere_agua         ?? ct.requiere_agua         ?? null,
      data.requiere_gas          ?? ct.requiere_gas          ?? null,
      data.requiere_combustible  ?? ct.requiere_combustible  ?? null,
    ];

    const [[ctRow]] = await conn.query(
      'SELECT id FROM caracteristicas_tecnicas WHERE equipo_id = ?', [id]
    );
    if (ctRow) {
      await conn.query(
        `UPDATE caracteristicas_tecnicas SET
           clase_tecnologia_id=?, fuente_energia=?, voltaje=?, voltaje_max_operacion=?,
           corriente_maxima=?, corriente_minima=?, potencia=?, frecuencia=?, humedad=?,
           longitud_onda=?, temperatura=?, temperatura_max=?, peso=?, capacidad=?,
           vida_util=?, fecha_fabricacion=?, requiere_agua=?, requiere_gas=?, requiere_combustible=?
         WHERE equipo_id=?`,
        [...ctVals, id]
      );
    } else if (ctVals.some(v => v !== null && v !== undefined && v !== '')) {
      await conn.query(
        `INSERT INTO caracteristicas_tecnicas
           (equipo_id, clase_tecnologia_id, fuente_energia, voltaje, voltaje_max_operacion,
            corriente_maxima, corriente_minima, potencia, frecuencia, humedad,
            longitud_onda, temperatura, temperatura_max, peso, capacidad,
            vida_util, fecha_fabricacion, requiere_agua, requiere_gas, requiere_combustible)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, ...ctVals]
      );
    }

    // ── Upsert soporte técnico ────────────────────────────────────────────
    const st = data.soporte_tecnico || {};
    const stVals = [
      data.verificable              ?? st.verificable              ?? null,
      data.calibrable               ?? st.calibrable               ?? null,
      data.manual_usuario           ?? st.manual_usuario           ?? null,
      data.periodicidad_calibracion ?? st.periodicidad_calibracion ?? null,
      data.recomendaciones          ?? st.recomendaciones          ?? null,
      Array.isArray(data.manuales)  ? JSON.stringify(data.manuales)  : null,
      Array.isArray(data.planos)    ? JSON.stringify(data.planos)    : null,
    ];

    const [[stRow]] = await conn.query(
      'SELECT id FROM soporte_tecnico WHERE equipo_id = ?', [id]
    );
    if (stRow) {
      await conn.query(
        `UPDATE soporte_tecnico SET
           verificable=?, calibrable=?, manual_usuario=?,
           periodicidad_calibracion=?, recomendaciones=?,
           manuales=?, planos=?
         WHERE equipo_id=?`,
        [...stVals, id]
      );
    } else if (stVals.some(v => v !== null && v !== undefined)) {
      await conn.query(
        `INSERT INTO soporte_tecnico
           (equipo_id, verificable, calibrable, manual_usuario, periodicidad_calibracion, recomendaciones, manuales, planos)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, ...stVals]
      );
    }

    // ── Sincronizar componentes ───────────────────────────────────────────
    if (Array.isArray(data.componentes)) {
      await conn.query('DELETE FROM componentes WHERE equipo_id = ?', [id]);
      for (const comp of data.componentes) {
        if (!comp.nombre?.trim()) continue;
        await conn.query(
          'INSERT INTO componentes (equipo_id, nombre, marca, modelo, serie) VALUES (?,?,?,?,?)',
          [id, comp.nombre || null, comp.marca || null, comp.modelo || null, comp.serie || null]
        );
      }
    }

    // ── Sincronizar documentos ────────────────────────────────────────────
    if (Array.isArray(data.documentos)) {
      await conn.query('DELETE FROM documentos WHERE equipo_id = ?', [id]);
      for (const doc of data.documentos) {
        const tipo  = typeof doc === 'string' ? doc : (doc.tipo ?? null);
        const url   = typeof doc === 'string' ? null : (doc.url ?? null);
        const tid   = await lookupId(conn, 'tipos_documento', tipo);
        if (tid) {
          await conn.query(
            'INSERT INTO documentos (equipo_id, tipo_documento_id, url) VALUES (?,?,?)',
            [id, tid, url]
          );
        }
      }
    }

    await conn.commit();
    return findById(id, empresaId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const softDelete = async (id, userId, empresaId) => {
  const [result] = await pool.query(
    `UPDATE equipos_biomedicos SET deleted_at = NOW(), updated_by = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [userId, id, empresaId]
  );
  if (!result.affectedRows) throw new AppError('Equipo no encontrado.', 404);
};

module.exports = { findAll, findById, create, update, softDelete };
