const { z } = require('zod');

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
});

// POST /:id/confirmar — responsable_destino es opcional (el handler lo deriva del user si falta)
const confirmarSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
  body: z.object({
    responsable_destino: z.string().max(200).optional().nullable(),
  }),
});

module.exports = { idParamSchema, confirmarSchema };
