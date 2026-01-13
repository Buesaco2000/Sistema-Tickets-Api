const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool =  mysql.createPool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
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