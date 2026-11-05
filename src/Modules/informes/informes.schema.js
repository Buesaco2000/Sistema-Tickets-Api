const { z } = require('zod');

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
});

// PATCH /:id/estado — acepta estado_id (numerico) o estado_nombre (string), ambos opcionales entre si
const cambiarEstadoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
  body: z.object({
    estado_id:     z.number().int().positive().optional().nullable(),
    estado_nombre: z.string().max(100).optional().nullable(),
    observaciones: z.string().max(1000).optional().nullable(),
  }).refine(
    (b) => b.estado_id != null || (b.estado_nombre != null && b.estado_nombre.trim().length > 0),
    { message: 'Se requiere estado_id o estado_nombre.' }
  ),
});

module.exports = { idParamSchema, cambiarEstadoSchema };
