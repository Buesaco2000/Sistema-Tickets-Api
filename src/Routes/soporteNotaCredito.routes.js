const express = require("express");
const router = express.Router();
const SoporteNcModel = require("../Models/soporteNotaCredito.model");
const authenticateToken = require("../Integracion/auth");
const TicketsModel = require("../Models/ticket.model");
const Usuarios = require("../Models/user.js");
const { enviarNotificacionNotaCredito } = require("../Utils/emailService");

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      tipo_soporte_id,
      fecha_facturacion,
      factura_anular,
      factura_copago_anular,
      valor_copago_anulado,
      factura_refacturar,
      motivo,
    } = req.body;

    const usuario_salud_id = req.user.id;
    const municipio_id = req.user.municipio_id;
    const centro_atencion = req.user.municipio;

    const nombre_facturador = `${req.user.nombres} ${req.user.apellidos}`;

    if (!usuario_salud_id || !tipo_soporte_id) {
      return res.status(400).json({ message: "Datos obligatorios faltantes" });
    }

    if (!municipio_id || !centro_atencion) {
      return res.status(400).json({
        message: "El usuario no tiene municipio asignado",
      });
    }

    if (!nombre_facturador) {
      return res.status(400).json({
        message: "El usuario no tiene el nombre del facturador asignado",
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

    //VALIDAR INFORMACION
    if (parseInt(tipo_soporte_id) === 1) {
      if (
        !fecha_facturacion ||
        !factura_anular ||
        !factura_copago_anular ||
        !valor_copago_anulado ||
        !motivo ||
        !factura_refacturar
      ) {
        return res.status(400).json({ message: "Faltan datos obligatorios" });
      }
    }

    // 1. Crear ticket
    const ticket_id = await TicketsModel.create({
      usuario_salud_id,
      ingeniero_id,
      municipio_id,
      tipo_soporte_id,
    });

    // 2. Crear soporte segun tipo
    if (parseInt(tipo_soporte_id) === 1) {
      // Soporte NOTAS CREDITO
      await SoporteNcModel.create(ticket_id, {
        fecha_facturacion,
        factura_anular,
        factura_copago_anular,
        valor_copago_anulado,
        factura_refacturar,
        centro_atencion,
        nombre_facturador,
        motivo,
      });
    }

    // 3. Enviar notificacion por correo
    enviarNotificacionNotaCredito({
      ticket_id,
      usuario_nombre: nombre_facturador,
      usuario_email: req.user.email || "No disponible",
      ingeniero_nombre: ingeniero ? `${ingeniero.nombres} ${ingeniero.apellidos}` : "No asignado",
      ingeniero_email: ingeniero?.email || "",
      municipio: req.user.municipio || "No especificado",
      fecha_facturacion,
      factura_anular,
      factura_copago_anular,
      valor_copago_anulado,
      factura_refacturar,
      centro_atencion,
      motivo,
    }).catch((err) => console.error("Error enviando correo:", err));

    res.status(201).json({ message: "Ticket creado correctamente", ticket_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear ticket" });
  }
});

router.get("/soporte", authenticateToken, async (req, res) => {
  try {
    const { id, rol_id, municipio_id } = req.user;
    const SOPORTE_NC_ID = 1;
    let data = [];

    if (rol_id === 3) {
      // SALUD: ve sus propios tickets
      data = await SoporteNcModel.findByUsuario(id, SOPORTE_NC_ID);
    } else if (rol_id === 2) {
      // INGENIERO: ve tickets de su municipio
      data = await SoporteNcModel.findByMunicipio(municipio_id, SOPORTE_NC_ID);
    } else if (rol_id === 1) {
      // ADMIN: ve todos los soportes
      data = await SoporteNcModel.findAll(SOPORTE_NC_ID);
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
