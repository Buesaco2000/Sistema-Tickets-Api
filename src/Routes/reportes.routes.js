const express = require("express");
const router = express.Router();
const TicketsModel = require("../Models/ticket.model");
const ReportesModel = require("../Models/reportes.model");
const authenticateToken = require("../Integracion/auth");

// Obtener tickets filtrados por periodo para descarga
router.get("/tickets", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;
    const { periodo, fecha_inicio, fecha_fin, tipo_soporte_id } = req.query;

    // Solo ingenieros (rol_id=2) y admins (rol_id=1) pueden descargar reportes
    // Salud (rol_id=3) no tiene acceso
    const rolNumerico = Number(rol_id);
    if (rolNumerico === 3) {
      return res.status(403).json({
        message:
          "No tiene permisos para descargar reportes. Solo ingenieros y administradores.",
      });
    }

    const data = await ReportesModel.getTicketsByPeriodo({
      rol_id,
      userId: id,
      municipioId: municipio_id,
      periodo,
      fecha_inicio,
      fecha_fin,
      tipo_soporte_id,
    });

    res.status(200).json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener reporte de tickets",
    });
  }
});

// Obtener resumen mensual de reportes
router.get("/resumen-mensual", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;
    const { anio } = req.query;

    // Solo ingenieros y admins pueden ver reportes
    if (Number(rol_id) === 3) {
      return res.status(403).json({
        message: "No tiene permisos para ver reportes",
      });
    }

    const data = await ReportesModel.getResumenMensual({
      rol_id,
      userId: id,
      municipioId: municipio_id,
      anio: anio || new Date().getFullYear(),
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener resumen mensual",
    });
  }
});

// Obtener historico de reportes por mes
router.get("/historico", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;

    // Solo ingenieros y admins pueden ver reportes
    if (Number(rol_id) === 3) {
      return res.status(403).json({
        message: "No tiene permisos para ver reportes",
      });
    }

    const data = await ReportesModel.getHistoricoReportes({
      rol_id,
      userId: id,
      municipioId: municipio_id,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener historico de reportes",
    });
  }
});

module.exports = router;
