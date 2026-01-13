const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware para verificar el token (soporta cookie HttpOnly y header Authorization)
const authenticateToken = (req, res, next) => {
  try {
    // Primero intenta obtener el token de la cookie HttpOnly
    let token = req.cookies?.token;

    // Si no hay cookie, intenta obtener del header Authorization (compatibilidad)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token no proporcionado." });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = {
      id: decoded.id,
      nombres: decoded.nombres,
      apellidos: decoded.apellidos,
      rol_id: decoded.rol_id,
      municipio_id: decoded.municipio_id,
      municipio: decoded.municipio,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Error en authenticateToken:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token no válido o expirado",
    });
  }
};

module.exports = authenticateToken;
