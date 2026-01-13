const express = require("express");
const TicketsModel = require("../Models/ticket.model");
const authenticateToken = require("../Integracion/auth");
const router = express.Router();

router.get("/mis-tickets", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;

    const data = await TicketsModel.findByRol({
      rol_id,
      userId: id,
      municipioId: municipio_id,
    });

    res.json({
      success: true,
      message: "Tickets recuperados con éxito.",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener tickets",
    });
  }
});

router.get("/estado", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;

    const data = await TicketsModel.findEstadosByRol({
      rol_id,
      userId: id,
      municipioId: municipio_id,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener tickets pendientes",
    });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;

    const data = await TicketsModel.findTicketsByRol({
      rol_id,
      userId: id,
      municipioId: municipio_id,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener tickets pendientes",
    });
  }
});

router.get("/total", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;

    const data = await TicketsModel.findByEstado({
      rol_id,
      userId: id,
      municipioId: municipio_id,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener tickets pendientes",
    });
  }
});

router.put("/:id/estado", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await TicketsModel.findByCambiarEstado(Number(id), estado, req.user);
    res.json({
      success: true,
      message: "Estado actualizado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar tickets",
    });
  }
});

module.exports = router;
