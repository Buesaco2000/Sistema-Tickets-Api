const pool = require("../database");

const TipoSoporte = {
  findAll: async () => {
    const [rows] = await pool.query(`SELECT * FROM tipos_soporte`);
    return rows;
  },
};

module.exports = TipoSoporte;
