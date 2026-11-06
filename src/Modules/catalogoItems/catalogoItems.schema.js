const { z } = require('zod');

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
});

const precioField = z.union([z.number(), z.string()])
  .transform((v) => (v === '' || v == null ? null : Number(v)))
  .refine((v) => v === null || (!isNaN(v) && v >= 0), { message: 'Debe ser un número no negativo.' })
  .nullable().optional();

const crearSchema = z.object({
  body: z.object({
    nombre:               z.string({ required_error: 'El nombre es obligatorio.' }).min(1).max(300),
    codigo_interno:       z.string().max(100).optional().nullable(),
    forma_farmaceutica:   z.string().max(150).optional().nullable(),
    concentracion:        z.string().max(150).optional().nullable(),
    precio_2026:          precioField,
    precio_regulado:      precioField,
  }),
});

const actualizarSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
  body: z.object({
    nombre:               z.string().min(1).max(300).optional(),
    codigo_interno:       z.string().max(100).optional().nullable(),
    forma_farmaceutica:   z.string().max(150).optional().nullable(),
    concentracion:        z.string().max(150).optional().nullable(),
    precio_2026:          precioField,
    precio_regulado:      precioField,
  }),
});

module.exports = { idParamSchema, crearSchema, actualizarSchema };
