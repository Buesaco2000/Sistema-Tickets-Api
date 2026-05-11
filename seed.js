/**
 * Seed: crea datos base + primer usuario ADMIN.
 * Uso: node seed.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "12345",
  database: process.env.DB_DATABASE || "soporte",
  port: Number(process.env.DB_PORT) || 3306,
};

const ADMIN = {
  nombres: "Admin",
  apellidos: "Sistema",
  email: "admin@suroriente.com",
  password: "Admin1234!",
};

const EMPRESA = { nombre: "ESE SurOriente Cauca" };

(async () => {
  const conn = await mysql.createConnection(config);
  console.log("✅ Conectado a MySQL");

  try {
    // ── 1. Roles ────────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO roles (id, nombre) VALUES
        (1, 'ADMIN'), (2, 'INGENIERO'), (3, 'SALUD')
    `);
    console.log("✅ Roles ok");

    // ── 2. Estados ──────────────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO estados (nombre, scope) VALUES
        ('Abierto',    'TICKET'),
        ('En proceso', 'TICKET'),
        ('Resuelto',   'TICKET'),
        ('Pendiente',  'MANTENIMIENTO'),
        ('En proceso', 'MANTENIMIENTO'),
        ('Finalizado', 'MANTENIMIENTO')
    `);
    console.log("✅ Estados ok");

    // ── 3. Tipos de soporte (IDs fijos usados en el frontend) ───
    //   id=1 → Otros  |  id=2 → R-FAST  |  id=3 → Notas Crédito
    await conn.query(`
      INSERT IGNORE INTO tipos_soporte (id, nombre, requiere_detalle) VALUES
        (1, 'Otros',         0),
        (2, 'R-FAST',        0),
        (3, 'Notas Crédito', 1)
    `);
    console.log("✅ Tipos de soporte ok");

    // ── 4. Municipios base ──────────────────────────────────────
    await conn.query(`
      INSERT IGNORE INTO municipios (nombre) VALUES
        ('LA VEGA'), ('ALMAGUER'), ('SAN SEBASTIAN'),
        ('SANTA ROSA')
    `);
    console.log("✅ Municipios ok");

    // ── 5. Empresa ──────────────────────────────────────────────
    const [[emp]] = await conn.query("SELECT id FROM empresa LIMIT 1");

    let empresaId;
    if (emp) {
      empresaId = emp.id;
      console.log(`ℹ️  Empresa existente id=${empresaId}`);
    } else {
      const [res] = await conn.query(
        "INSERT INTO empresa (nombre) VALUES (?)",
        [EMPRESA.nombre],
      );
      empresaId = res.insertId;
      console.log(`✅ Empresa creada id=${empresaId}`);
    }

    // ── 6. Usuario ADMIN ────────────────────────────────────────
    const [[existing]] = await conn.query(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN.email],
    );

    if (existing) {
      console.log(
        `⚠️  El usuario ${ADMIN.email} ya existe (id=${existing.id}). No se creó.`,
      );
      return;
    }

    const hashed = await bcrypt.hash(ADMIN.password, 12);

    const [result] = await conn.query(
      `INSERT INTO users
         (nombres, apellidos, email, password, empresa_id, rol_id, activo)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [
        ADMIN.nombres,
        ADMIN.apellidos,
        ADMIN.email.toLowerCase(),
        hashed,
        empresaId,
      ],
    );

    console.log(`✅ Admin creado exitosamente:`);
    console.log(`   ID:         ${result.insertId}`);
    console.log(`   Email:      ${ADMIN.email}`);
    console.log(`   Password:   ${ADMIN.password}`);
    console.log(`   empresa_id: ${empresaId}`);
    console.log(
      `\n⚠️  Cambia la contraseña después de ingresar por primera vez.`,
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await conn.end();
  }
})();
