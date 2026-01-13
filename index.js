const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Permite enviar/recibir cookies
  })
);
app.use(cookieParser());
app.use(bodyParser.json());

//? setting static folder path
app.use("/public/errores", express.static("./public/errores"));
app.use("/public/soporte", express.static("./public/soporte"));

// Routes
app.use("/usuarios", require("./src/Routes/user.js"));
app.use("/cargos", require("./src/Routes/cargos.js"));
app.use("/municipios", require("./src/Routes/municipios.js"));

app.use("/tickets", require("./src/Routes/tickets.routes.js"));

app.use("/rfast", require("./src/Routes/soportePlataforma.routes.js"));
app.use("/notasC", require("./src/Routes/soporteNotaCredito.routes.js"));
app.use("/otroS", require("./src/Routes/otroSoporte.routes.js"));

app.use("/reportes", require("./src/Routes/reportes.routes.js"));

// Ejemplo de ruta usando asyncHandler directamente en app.js
app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "API funcionando correctamente",
      data: null,
    });
  })
);

// Manejador de errores global
app.use((error, req, res, next) => {
  res.status(500).json({ success: false, message: error.message, data: null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
