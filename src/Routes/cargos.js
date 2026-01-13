// src/routes/cargos.js
const express = require("express");
const asyncHandler = require("express-async-handler");
const Cargos = require("../Models/cargos");

const router = express.Router();

// Crear cargo
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { nombre } = req.body;
    if (!nombre)
      return res.status(400).json({ ok: false, error: "Nombre obligatorio" });

    const cargo = await Cargos.create({ nombre });
    res.status(201).json({ ok: true, cargo });
  })
);

// Obtener todos los cargos
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cargos = await Cargos.findAll();
    res.json({ ok: true, cargos });
  })
);

// Obtener todos los cargos
router.get(
  "/rol",
  asyncHandler(async (req, res) => {
    const roles = await Cargos.findAlRol();
    res.json({ ok: true, roles });
  })
);

// Obtener cargo por ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const cargo = await Cargos.findById(req.params.id);
    if (!cargo)
      return res.status(404).json({ ok: false, error: "Cargo no encontrado" });
    res.json({ ok: true, cargo });
  })
);

// Actualizar cargo por ID
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const cargo = await Cargos.updateById(req.params.id, req.body);
    res.json({ ok: true, cargo });
  })
);

// Eliminar cargo por ID
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const cargo = await Cargos.deleteById(req.params.id);
    res.json({ ok: true, cargo });
  })
);

module.exports = router;
