// src/routes/municipios.js
const express = require('express');
const asyncHandler = require('express-async-handler');
const Municipios = require('../models/Municipios');

const router = express.Router();

// Crear municipio
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: 'Nombre obligatorio' });

    const municipio = await Municipios.create({ nombre });
    res.status(201).json({ ok: true, municipio });
  })
);

// Obtener todos los municipios
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const municipios = await Municipios.findAll();
    res.json({ ok: true, municipios });
  })
);

// Obtener municipio por ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const municipio = await Municipios.findById(req.params.id);
    if (!municipio) return res.status(404).json({ ok: false, error: 'Municipio no encontrado' });
    res.json({ ok: true, municipio });
  })
);

// Actualizar municipio por ID
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const municipio = await Municipios.updateById(req.params.id, req.body);
    res.json({ ok: true, municipio });
  })
);

// Eliminar municipio por ID
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const municipio = await Municipios.deleteById(req.params.id);
    res.json({ ok: true, municipio });
  })
);

module.exports = router;
