/**
 * assign-cargos-obligaciones.js
 * ─────────────────────────────
 * Lee el campo area_elabora de cada obligacion en la BD y asigna
 * cargo_id automaticamente donde el nombre coincida con un cargo.
 *
 * Para nombres que no coincidan exactamente, define el mapeo
 * en OVERRIDES abajo (area_elabora → nombre del cargo en BD).
 * Pon null para omitir esa area intencionalmente.
 *
 * Uso:  node assign-cargos-obligaciones.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────────
const EMPRESA_ID = 1;

// Mapeo manual para nombres que no coinciden exactamente:
//   "valor en area_elabora" : "nombre exacto del cargo en BD"
// Pon null para saltarse esa área sin asignar cargo.
const OVERRIDES = {
  // area_elabora en BD  →  nombre exacto del cargo en BD
  "Almacén": "ALMACEN",   // único caso con diferencia de tilde
  // Agrega aquí cualquier otro que aparezca como ⚠️ SIN COINCIDENCIA
};
// ──────────────────────────────────────────────────────────────────────────────

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
    // 1. Cargar cargos de la BD → mapa nombre(lower) → id
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

    // 3. Resolver cargo para cada area
    const plan = []; // { area, cargoId, cargoNombre, accion }
    for (const area of areas) {
      let cargoNombre = null;

      if (area in OVERRIDES) {
        // Mapeo manual definido arriba
        cargoNombre = OVERRIDES[area];
      } else {
        // Coincidencia exacta insensible a mayúsculas
        const found = cargoIdMap[area.trim().toLowerCase()];
        if (found) cargoNombre = area.trim();
      }

      if (cargoNombre === null && area in OVERRIDES) {
        // null explícito = omitir intencionalmente
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
