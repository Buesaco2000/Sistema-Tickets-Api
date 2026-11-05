const { z } = require('zod');

const TIPOS_RECEPCION = ['MEDICAMENTOS', 'LABORATORIO', 'MEDICO_QUIRURGICO', 'ASEO_PAPELERIA', 'ODONTOLOGIA'];

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
});

const crearSchema = z.object({
  body: z.object({
    fecha:         z.string({ required_error: 'La fecha es obligatoria.' }).min(1, 'La fecha es obligatoria.'),
    municipio_id:  z.number().int().positive().optional().nullable(),
    sede_id:       z.number().int().positive().optional().nullable(),
    observaciones: z.string().max(1000).optional().nullable(),
  }),
});

const actualizarItemsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
  body: z.object({
    items: z.array(
      z.object({
        id:               z.number({ required_error: 'id del item requerido.' }).int().positive(),
        cantidad_contada: z.number().nonnegative('La cantidad contada no puede ser negativa.').nullable().optional(),
        observacion:      z.string().max(500).optional().nullable(),
      })
    ).optional().default([]),
  }),
});

const cerrarSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
  body: z.object({
    crearAjustes: z.boolean().optional().default(false),
  }),
});

const hallazgoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
  body: z.object({
    nombre:           z.string({ required_error: 'El nombre es obligatorio.' }).min(1).max(300),
    cantidad:         z.number({ required_error: 'La cantidad es obligatoria.' }).positive('La cantidad debe ser mayor a 0.'),
    tipo_recepcion:   z.enum(TIPOS_RECEPCION).optional().default('MEDICAMENTOS'),
    lote:             z.string().max(100).optional().nullable(),
    fecha_vencimiento: z.string().optional().nullable(),
    observacion:      z.string().max(500).optional().nullable(),
  }),
});

module.exports = { idParamSchema, crearSchema, actualizarItemsSchema, cerrarSchema, hallazgoSchema };
