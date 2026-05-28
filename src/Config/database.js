const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
  charset: "utf8mb4",
  // SEC-05: en producción rechazar certificados no verificados por defecto.
  // Si tu proveedor de BD requiere rejectUnauthorized:false (ej. PlanetScale trial),
  // establece DB_SSL_REJECT_UNAUTHORIZED=false en las variables de entorno.
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          ...(process.env.DB_SSL_CA ? { ca: require("fs").readFileSync(process.env.DB_SSL_CA) } : {}),
        }
      : undefined,
});

// Verificar conexión a la base de datos
// Probar conexión
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("🔥 Conectado a MySQL correctamente");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar con MySQL:", error);
  }
})();

module.exports = pool;
