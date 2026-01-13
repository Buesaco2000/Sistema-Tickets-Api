const express = require("express");
const router = express.Router();
const TicketsModel = require("../Models/ticket.model");
const SoportePlataformaModel = require("../Models/soportePlataforma.model");
const authenticateToken = require("../Integracion/auth");
const { uploadPlataforma } = require("../uploadFile.js");
const Usuarios = require("../Models/user.js");
const { enviarNotificacionTicket } = require("../Utils/emailService");

router.post(
  "/",
  authenticateToken,
  uploadPlataforma.single("imagen"),
  async (req, res) => {
    try {
      const { tipo_soporte_id, descripcion } = req.body;

      const usuario_salud_id = req.user.id;
      const municipio_id = req.user.municipio_id;

      if (!usuario_salud_id || !tipo_soporte_id) {
        return res
          .status(400)
          .json({ message: "Datos obligatorios faltantes" });
      }

      if (!municipio_id) {
        return res.status(400).json({
          message: "El usuario no tiene municipio asignado",
        });
      }

      const ingeniero_id = await Usuarios.findByIngenieroPorMunicipio(
        municipio_id
      );

      if (!ingeniero_id) {
        return res.status(400).json({
          message: "No hay ingenieros disponibles para este municipio",
        });
      }

      // Obtener datos del ingeniero asignado
      const ingeniero = await Usuarios.findById(ingeniero_id);

      let imageUrl = "no_url";

      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        imageUrl = `${baseUrl}/public/errores/${req.file.filename}`;
      }

      // 1. Crear ticket
      const ticket_id = await TicketsModel.create({
        usuario_salud_id,
        ingeniero_id,
        municipio_id,
        tipo_soporte_id,
      });

      // 2. Crear soporte segun tipo
      if (parseInt(tipo_soporte_id) === 2) {
        // Soporte Plataforma
        await SoportePlataformaModel.create({
          ticket_id,
          descripcion,
          imagen: imageUrl,
        });
      }

      // 3. Enviar notificacion por correo (no bloquea la respuesta)
      enviarNotificacionTicket({
        ticket_id,
        descripcion,
        usuario_nombre: `${req.user.nombres} ${req.user.apellidos}`,
        usuario_email: req.user.email || "No disponible",
        ingeniero_nombre: ingeniero ? `${ingeniero.nombres} ${ingeniero.apellidos}` : "No asignado",
        ingeniero_email: ingeniero?.email || "",
        municipio: req.user.municipio || "No especificado",
        tipo_soporte: "R-FAST",
        imagen_url: imageUrl,
      }).catch((err) => console.error("Error enviando correo:", err));

      console.log("req.body:", req.body);

      res
        .status(201)
        .json({ message: "Ticket creado correctamente", ticket_id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear ticket" });
    }
  }
);

router.get("/soporte", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;
    const SOPORTE_PLATAFORMA_ID = 2;
    let data = [];

    if (rol_id === 3) {
      // SALUD: ve sus propios tickets
      data = await SoportePlataformaModel.findByUsuario(id, SOPORTE_PLATAFORMA_ID);
    } else if (rol_id === 2) {
      // INGENIERO: ve tickets de su municipio
      data = await SoportePlataformaModel.findByMunicipio(municipio_id, SOPORTE_PLATAFORMA_ID);
    } else if (rol_id === 1) {
      // ADMIN: ve todos los soportes
      data = await SoportePlataformaModel.findAll(SOPORTE_PLATAFORMA_ID);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener soportes",
    });
  }
});

module.exports = router;
