require("dotenv").config();
const XLSX  = require("xlsx");
const mysql = require("mysql2/promise");

//  CONFIGURACIÓN 
const EXCEL_PATH = "C:/Users/Sebastian/Downloads/Data_Informes_Ver1.xlsx";
const SHEET_NAME = "Data";
const EMPRESA_ID = 1;

// Mapa de periodicidades del Excel → código en la BD
const PERIOD_MAP = {
  "Año":           "ANUAL",
  "Trimestre":     "TRIMESTRAL",
  "Semestre":      "SEMESTRAL",
  "Mes":           "MENSUAL",
  "Bimestre":      "BIMESTRAL",
  "Cuatrimestral": "CUATRIMESTRAL",
  "Cuatrienio":    "CUATRIENIO",
  "Ocasional":     "OCASIONAL",
};

// Etiquetas de mes en español
const MESES_ES = ["ENE","FEB","MAR","ABR","MAY","JUN", "JUL","AGO","SEP","OCT","NOV","DIC"];

//  HELPERS 
const excelDate = (serial) => {
  if (!serial || typeof serial !== "number") return null;
  const ms = (serial - 25569) * 86400000;
  const d  = new Date(ms);
  const y  = d.getUTCFullYear();
  const m  = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day= String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Obtiene o inserta un registro y retorna su id
const getOrInsert = async (conn, table, whereCol, whereVal, insertSQL, insertParams) => {
  const [rows] = await conn.query(
    `SELECT id FROM ${table} WHERE ${whereCol} = ? LIMIT 1`,
    [whereVal]
  );
  if (rows.length) return rows[0].id;
  const [res] = await conn.query(insertSQL, insertParams);
  return res.insertId;
};

//  MAIN 
async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "soporte",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();

  try {
    //  1. Leer Excel 
    console.log("📂 Leyendo Excel...");
    const wb   = XLSX.readFile(EXCEL_PATH);
    const ws   = wb.Sheets[SHEET_NAME];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const data = rows.slice(1).filter(r => r[0]); // sin cabecera, sin vacías
    console.log(`   ${data.length} filas encontradas.\n`);

    //  2. Entes rectores 
    console.log("🏛  Procesando entes rectores...");
    const enteIdMap = {};
    const entesUnicos = [...new Set(data.map(r => r[0]).filter(Boolean))];
    for (const nombre of entesUnicos) {
      enteIdMap[nombre] = await getOrInsert(
        conn, "ente_rector", "nombre", nombre,
        "INSERT INTO ente_rector (nombre, activo) VALUES (?, TRUE)", [nombre]
      );
      console.log(`   [${enteIdMap[nombre]}] ${nombre}`);
    }

    //  3. Receptores 
    console.log("\n📬 Procesando receptores...");
    const receptorIdMap = {};
    const receptoresUnicos = [...new Set(data.map(r => r[2]).filter(Boolean))];
    for (const nombre of receptoresUnicos) {
      receptorIdMap[nombre] = await getOrInsert(
        conn, "receptor", "nombre", nombre,
        "INSERT INTO receptor (nombre, activo) VALUES (?, TRUE)", [nombre]
      );
      console.log(`   [${receptorIdMap[nombre]}] ${nombre}`);
    }

    //  4. Periodicidades extra (Cuatrienio y Ocasional) 
    console.log("\n📅 Verificando periodicidades...");
    const extra = [
      { codigo: "CUATRIENIO", nombre: "Cuatrienio", meses_corte: "[12]", cortes_por_ano: 0 },
      { codigo: "OCASIONAL",  nombre: "Ocasional",  meses_corte: "[]",   cortes_por_ano: 0 },
    ];
    for (const p of extra) {
      const [ex] = await conn.query(
        "SELECT id FROM periodicidad WHERE codigo = ?", [p.codigo]
      );
      if (!ex.length) {
        await conn.query(
          "INSERT INTO periodicidad (codigo, nombre, meses_corte, cortes_por_ano) VALUES (?,?,?,?)",
          [p.codigo, p.nombre, p.meses_corte, p.cortes_por_ano]
        );
        console.log(`   Creada: ${p.codigo}`);
      } else {
        console.log(`   Ya existe: ${p.codigo}`);
      }
    }

    // Cargar todas las periodicidades
    const [perRows] = await conn.query("SELECT id, codigo FROM periodicidad");
    const perIdMap  = Object.fromEntries(perRows.map(p => [p.codigo, p.id]));

    //  5. Construir obligaciones únicas
    console.log("\n📋 Procesando obligaciones...");
    const obligMap = {};

    // Arrancar el contador desde el máximo código OBL existente en la BD
    const [maxRow] = await conn.query(
      `SELECT MAX(CAST(SUBSTRING(codigo, 5) AS UNSIGNED)) AS max_seq
       FROM obligacion WHERE empresa_id = ? AND codigo LIKE 'OBL-%'`,
      [EMPRESA_ID]
    );
    let obligSeq = (maxRow[0]?.max_seq || 0) + 1;

    for (const row of data) {
      const enteN    = row[0];
      const soporteN = row[1];
      const receptorN= row[2];
      const informeN = row[3];
      const periodN  = row[4];
      const compN    = row[5];
      const corteSer = row[6];
      const limiteSer= row[9];
      const detalleN = row[14];
      const elaboraN = row[15];
      const presentaN= row[16];

      if (!informeN || !enteN || !receptorN || !periodN) continue;

      const key = `${informeN}|||${enteN}|||${receptorN}|||${periodN}`;
      if (obligMap[key]) continue;  // ya procesada

      const periodCodigo = PERIOD_MAP[periodN] || "OCASIONAL";
      const fechaCorte   = excelDate(corteSer);
      const fechaLimite  = excelDate(limiteSer);

      // Días de plazo = diferencia entre corte y límite.
      // Solo se calcula si la fecha límite es POSTERIOR al corte (diferencia positiva).
      // Si el límite está antes del corte (ej: obligaciones anuales con vencimiento
      // en nov pero corte en dic), se usa el default de 30 días para no inflar el plazo.
      let diasPlazo = 30;
      if (fechaCorte && fechaLimite && fechaLimite > fechaCorte) {
        diasPlazo = Math.round(
          (new Date(fechaLimite) - new Date(fechaCorte)) / 86400000
        );
        diasPlazo = Math.max(1, diasPlazo);
      }

      obligMap[key] = {
        codigo:          `OBL-${String(obligSeq++).padStart(3, "0")}`,
        nombre:          informeN,
        ente_rector_id:  enteIdMap[enteN],
        receptor_id:     receptorIdMap[receptorN],
        periodicidad_id: perIdMap[periodCodigo] || perIdMap["OCASIONAL"],
        soporte_normativo: (soporteN || "").replace(/\r\n/g, "\n").trim(),
        detalle:         detalleN   || null,
        dias_plazo:      diasPlazo,
        complejidad:     Math.min(5, Math.max(1, Number(compN) || 1)),
        area_elabora:    elaboraN   || null,
        area_presenta:   presentaN  || null,
        id:              null,
      };
    }

    // Insertar obligaciones (o recuperar si ya existen)
    for (const key of Object.keys(obligMap)) {
      const o = obligMap[key];
      const [existing] = await conn.query(
        `SELECT id FROM obligacion
         WHERE empresa_id = ? AND nombre = ?
           AND ente_rector_id = ? AND receptor_id = ? AND periodicidad_id = ?
           AND deleted_at IS NULL LIMIT 1`,
        [EMPRESA_ID, o.nombre, o.ente_rector_id, o.receptor_id, o.periodicidad_id]
      );
      if (existing.length) {
        o.id = existing[0].id;
        console.log(`   [existe] ${o.nombre}`);
      } else {
        const [res] = await conn.query(
          `INSERT INTO obligacion
           (empresa_id, codigo, nombre, ente_rector_id, receptor_id, periodicidad_id,
            soporte_normativo, detalle, dias_plazo, complejidad,
            area_elabora, area_presenta, activo, created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,TRUE,1)`,
          [EMPRESA_ID, o.codigo, o.nombre,
           o.ente_rector_id, o.receptor_id, o.periodicidad_id,
           o.soporte_normativo, o.detalle, o.dias_plazo, o.complejidad,
           o.area_elabora, o.area_presenta]
        );
        o.id = res.insertId;
        console.log(`   [${o.id}] ${o.codigo} — ${o.nombre}`);
      }
    }
    console.log(`\n   Total obligaciones: ${Object.keys(obligMap).length}`);

    //  6. Ejecuciones 
    console.log("\n⚡ Procesando ejecuciones...");

    const [estPend] = await conn.query(
      "SELECT id FROM estados WHERE nombre='PENDIENTE'  AND scope='INFORME' LIMIT 1"
    );
    const [estPres] = await conn.query(
      "SELECT id FROM estados WHERE nombre='PRESENTADO' AND scope='INFORME' LIMIT 1"
    );
    const idPendiente  = estPend[0]?.id;
    const idPresentado = estPres[0]?.id;

    let creadas = 0, omitidas = 0, errores = 0;

    for (const row of data) {
      const enteN     = row[0];
      const receptorN = row[2];
      const informeN  = row[3];
      const periodN   = row[4];
      const corteSer  = row[6];
      const limiteSer = row[9];
      const fechaPres = row[18];
      const obsN      = row[20];

      if (!informeN || !enteN || !receptorN || !periodN) continue;

      const key   = `${informeN}|||${enteN}|||${receptorN}|||${periodN}`;
      const oblig = obligMap[key];
      if (!oblig?.id) continue;

      const fechaCorte = excelDate(corteSer);
      if (!fechaCorte) continue;

      // Si no hay fecha límite en el Excel, o si es anterior al corte (dato malo),
      // calcularla desde corte + dias_plazo
      let fechaLimite = excelDate(limiteSer);
      if (!fechaLimite || fechaLimite < fechaCorte) {
        const dl = new Date(fechaCorte + "T00:00:00Z");
        dl.setUTCDate(dl.getUTCDate() + (oblig.dias_plazo || 30));
        fechaLimite = `${dl.getUTCFullYear()}-${String(dl.getUTCMonth()+1).padStart(2,"0")}-${String(dl.getUTCDate()).padStart(2,"0")}`;
      }

      // Etiqueta: "ENE 2025", "DIC 2024", etc.
      const d     = new Date(fechaCorte + "T00:00:00Z");
      const mes   = d.getUTCMonth();
      const anio  = d.getUTCFullYear();
      const etiqueta = `${MESES_ES[mes]} ${anio}`;

      const esPresentado    = typeof fechaPres === "number";
      const estadoId        = esPresentado ? idPresentado : idPendiente;
      const fechaPresStr    = esPresentado ? excelDate(fechaPres) : null;

      try {
        await conn.query(
          `INSERT INTO ejecucion_informe
           (empresa_id, obligacion_id, estado_id,
            etiqueta_corte, fecha_corte, fecha_limite, fecha_limite_orig,
            fecha_presentado, observaciones, created_by)
           VALUES (?,?,?,?,?,?,?,?,?,1)`,
          [EMPRESA_ID, oblig.id, estadoId,
           etiqueta, fechaCorte, fechaLimite, fechaLimite,
           fechaPresStr, obsN || null]
        );
        creadas++;
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          omitidas++;
        } else {
          console.error(`   ❌ Error en "${informeN}" corte ${etiqueta}: ${err.message}`);
          errores++;
        }
      }
    }

    console.log(`\n   Creadas:  ${creadas}`);
    console.log(`   Omitidas: ${omitidas}  (ya existían)`);
    console.log(`   Errores:  ${errores}`);
    console.log("\n✅ Importación completada.");

  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("❌ Error fatal:", err.message);
  process.exit(1);
});
