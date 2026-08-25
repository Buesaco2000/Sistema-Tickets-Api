require("dotenv").config();
const mysql = require("mysql2/promise");

//  CONFIGURACIÓN 
const EMPRESA_ID = 1;

const OVERRIDES = {
  "Almacén":                               "ALMACEN",
  "Contabilidad y Cartera":                "Contabilidad",
  "Subgerencia\nAdministrativa Y Financiera": "Subgerencia Administrativa Y Financiera",
};

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || process.env.DB_NAME || "soporte",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();

  try {
    const [cargosRows] = await conn.query(
      "SELECT id, nombre FROM cargos ORDER BY nombre ASC"
    );
    const cargoIdMap = {};
    for (const c of cargosRows) {
      cargoIdMap[c.nombre.trim().toLowerCase()] = c.id;
    }
    console.log("🏷  Cargos en BD:");
    cargosRows.forEach(c => console.log(`   [${c.id}] ${c.nombre}`));
    console.log();

    // 2. Obtener areas_elabora únicas de las obligaciones existentes
    const [areasRows] = await conn.query(
      `SELECT DISTINCT area_elabora
       FROM obligacion
       WHERE empresa_id = ? AND deleted_at IS NULL AND area_elabora IS NOT NULL
       ORDER BY area_elabora`,
      [EMPRESA_ID]
    );
    const areas = areasRows.map(r => r.area_elabora);
    console.log(`📋 Áreas únicas encontradas (${areas.length}):`);

    const plan = [];
    for (const area of areas) {
      let cargoNombre = null;

      if (area in OVERRIDES) {
        cargoNombre = OVERRIDES[area];
      } else {
        const found = cargoIdMap[area.trim().toLowerCase()];
        if (found) cargoNombre = area.trim();
      }

      if (cargoNombre === null && area in OVERRIDES) {
        console.log(`   ⏭  "${area}" → omitida (configurada como null)`);
        plan.push({ area, cargoId: null, accion: "omitir" });
      } else if (!cargoNombre) {
        console.log(`   ⚠️  "${area}" → SIN COINCIDENCIA — agrega en OVERRIDES`);
        plan.push({ area, cargoId: null, accion: "sin_match" });
      } else {
        const cargoId = cargoIdMap[cargoNombre.trim().toLowerCase()];
        if (!cargoId) {
          console.log(`   ❌ "${area}" → cargo "${cargoNombre}" no existe en BD`);
          plan.push({ area, cargoId: null, accion: "cargo_no_existe" });
        } else {
          console.log(`   ✅ "${area}" → [${cargoId}] ${cargoNombre}`);
          plan.push({ area, cargoId, accion: "asignar" });
        }
      }
    }

    // 4. Aplicar actualizaciones
    console.log("\n⚡ Aplicando actualizaciones...");
    let actualizadas = 0;
    let omitidas     = 0;
    let sinMatch     = 0;

    for (const item of plan) {
      if (item.accion !== "asignar") {
        if (item.accion === "sin_match" || item.accion === "cargo_no_existe") sinMatch++;
        else omitidas++;
        continue;
      }

      const [result] = await conn.query(
        `UPDATE obligacion
         SET cargo_id = ?
         WHERE empresa_id = ? AND area_elabora = ? AND deleted_at IS NULL`,
        [item.cargoId, EMPRESA_ID, item.area]
      );
      console.log(`   ✅ "${item.area}" → ${result.affectedRows} obligaciones actualizadas`);
      actualizadas += result.affectedRows;
    }

    // 5. Resumen
    console.log("\n─────────────────────────────────────────────");
    console.log(`✅ Obligaciones actualizadas: ${actualizadas}`);
    console.log(`⏭  Áreas omitidas (null):     ${omitidas}`);
    console.log(`⚠️  Sin coincidencia:           ${sinMatch}`);
    console.log("─────────────────────────────────────────────");
    if (sinMatch > 0) {
      console.log("👉 Para las áreas sin coincidencia, agrega el mapeo en OVERRIDES y vuelve a ejecutar.");
    }
    console.log("✅ Proceso completado.");

  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("❌ Error fatal:", err.message);
  process.exit(1);
});
