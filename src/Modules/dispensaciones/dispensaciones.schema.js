const { z } = require('zod');

const itemSchema = z.object({
  item_id:  z.number({ required_error: 'item_id requerido.' }).int().positive(),
  cantidad: z.number({ required_error: 'cantidad requerida.' }).int().positive('La cantidad debe ser mayor a 0.'),
});

const crearSchema = z.object({
  body: z.object({
    tipo:            z.enum(['KIT', 'URGENCIAS', 'HOSPITALIZACION', 'CARRO_PARO'], {
                       errorMap: () => ({ message: 'Tipo de dispensación no válido.' }),
                     }),
    destinatario_id: z.number({ required_error: 'destinatario_id requerido.' }).int().positive(),
    observaciones:   z.string().max(500).optional().nullable(),
    items:           z.array(itemSchema).min(1, 'Debes incluir al menos un medicamento.'),
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID inválido.').transform(Number),
  }),
});

module.exports = { crearSchema, idParamSchema };
