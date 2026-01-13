// generarTokens.js
require("dotenv").config();
const jwt = require("jsonwebtoken");

// Conexión a tu base de datos
const pool = require("../database");

async function generarTokens() {
  try {
    const [usuarios] = await pool.query("SELECT id, rol_id, municipio_id FROM users");

    usuarios.forEach((user) => {
      const token = jwt.sign(
        {
          id: user.id,
          rol_id: user.rol_id,
          municipio_id: user.municipio_id,
        },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );

      console.log(`Usuario ID: ${user.id} | Token: ${token}`);
    });
  } catch (error) {
    console.error("Error generando tokens:", error);
  } finally {
    await pool.end();
  }
}

generarTokens();
