const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const {
  errorHandler,
  notFoundHandler,
} = require("./src/Middlewares/error.middleware.js");
const logger       = require("./src/utils/logger");
const auditLogger  = require("./src/Middlewares/auditLogger.middleware");

const app = express();

// Necesario para que express-rate-limit y los logs de morgan
// usen la IP real del cliente cuando hay nginx/proxy delante.
app.set("trust proxy", 1);

//------SECURITY MIDDLEWARES------//
app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, "")); // quita trailing slash

app.use(
  cors({
    origin: (origin, callback) => {
      // Sin origin: peticiones server-to-server, curl, Postman — permitir
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized))
        return callback(null, true);

      logger.warn({ origin, allowedOrigins }, "CORS bloqueado");
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ─── Rate limiting ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiadas peticiones, intente más tarde." },
});

// Límite estricto solo para login y refresh — previene fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados intentos, espere 15 minutos." },
});

app.use("/api/", globalLimiter);
app.use("/api/v1/auth/login",   authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);

// ─── Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}
app.use(auditLogger);

// ─── Static files ────────────────────────────────────────────
// Cross-Origin-Resource-Policy debe ser cross-origin para que el frontend
// en un puerto distinto (Vite :5173) pueda cargar imágenes y PDFs.
app.use("/public", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static("public"));

// ─── Health check (sin auth) ─────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API v1 ──────────────────────────────────────────────────
const v1 = express.Router();

// RUTAS DE CARPETA AUTH
v1.use("/auth",     require("./src/Modules/auth/auth.routes.js"));

// EMPRESAS (público — login y registro sin token)
v1.use("/empresas", require("./src/Modules/empresa/empresa.routes.js"));

// RUTAS DE CARPETA CATALOGOS
v1.use("/catalogos/cargos",           require("./src/Modules/catalogos/cargo/cargo.routes.js"));

v1.use("/catalogos/estados",      require("./src/Modules/catalogos/estados/estados.routes.js"));

v1.use("/catalogos/municipios",       require("./src/Modules/catalogos/municipios/municipio.routes.js"));

v1.use("/catalogos/roles-tickets",            require("./src/Modules/catalogos/roles tickets/rolesTicket.routes.js"));

v1.use("/catalogos/sedes", require("./src/Modules/catalogos/sedes/sedes.routes.js"));

v1.use("/catalogos/tipos-soporte",    require("./src/Modules/catalogos/tipo soporte/tiposSoporte.routes.js"));

v1.use("/catalogos/tipos-equipo", require("./src/Modules/catalogos/equipos catalogos/tiposEquipo.routes.js"));
v1.use("/catalogos/fabricantes", require("./src/Modules/catalogos/equipos catalogos/fabricantes.routes.js"));
v1.use("/catalogos/proveedores", require("./src/Modules/catalogos/equipos catalogos/proveedores.routes.js"));
v1.use("/catalogos/nivel-riesgo", require("./src/Modules/catalogos/equipos catalogos/nivelRiesgo.routes.js"));
v1.use("/catalogos/clasificacion-riesgo", require("./src/Modules/catalogos/equipos catalogos/clasificacionRiesgo.routes.js"));
v1.use("/catalogos/clasificacion-biomedica", require("./src/Modules/catalogos/equipos catalogos/clasificacionBiomedica.routes.js"));
v1.use("/catalogos/frecuencia-mantenimiento", require("./src/Modules/catalogos/equipos catalogos/frecuenciaMantenimiento.routes.js"));
v1.use("/catalogos/nivel-complejidad", require("./src/Modules/catalogos/equipos catalogos/nivelComplejidad.routes.js"));
v1.use("/catalogos/clase-tecnologia", require("./src/Modules/catalogos/equipos catalogos/claseTecnologia.routes.js"));
v1.use("/catalogos/tipos-documento", require("./src/Modules/catalogos/equipos catalogos/tiposDocumento.routes.js"));

// RUTAS DE CARPETA EQUIPOS
v1.use("/equipos",                    require("./src/Modules/equipos/equipo.routes.js"));

// RUTAS DE CARPETA MANTENIMIENTOS
v1.use("/mantenimientos/preventivos", require("./src/Modules/mantenimientos/preventivo.routes.js"));
v1.use("/mantenimientos/correctivos", require("./src/Modules/mantenimientos/correctivo.routes.js"));

// RUTAS DE CARPETA MANTENIMIENTOS CATALOGOS
v1.use("/mantenimientos/catalogos/respuestos", require("./src/Modules/mantenimientos/catalogos/respuestos.routes.js"));
v1.use("/mantenimientos/catalogos/herramientas", require("./src/Modules/mantenimientos/catalogos/herramientas.routes.js"));
v1.use("/mantenimientos/catalogos/insumos", require("./src/Modules/mantenimientos/catalogos/insumos.routes.js"));
v1.use("/mantenimientos/catalogos/actividades", require("./src/Modules/mantenimientos/catalogos/actividades.routes.js"));
v1.use("/mantenimientos/catalogos/verificaciones", require("./src/Modules/mantenimientos/catalogos/verificaciones.routes.js"));

// RUTAS DE CARPETA USUARIOS
v1.use("/users",                      require("./src/Modules/users/user.routes.js"));

// RUTAS DE CARPETA TICKETS
v1.use("/tickets",                    require("./src/Modules/tickets/ticket.routes.js"));

// RUTAS DE CARPETA SOPORTES
v1.use("/soportes",                   require("./src/Modules/soportes/soporte.routes.js"));

// RUTAS DE CARPETA REPORTES
v1.use("/reportes",                   require("./src/Modules/reportes/reportes.routes.js"));

// RUTAS DE RECEPCIÓN DE MEDICAMENTOS
v1.use("/recepciones/medicamentos",   require("./src/Modules/recepcion/recepcion.routes.js"));
v1.use("/traslados",                  require("./src/Modules/traslados/traslados.routes.js"));
v1.use("/dispensaciones",             require("./src/Modules/dispensaciones/dispensaciones.routes.js"));

// CATÁLOGO DE MEDICAMENTOS
v1.use("/medicamentos",               require("./src/Modules/catalogoMedicamentos/catalogoMedicamentos.routes.js"));

app.use("/api/v1", v1);

// ─── Error handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
