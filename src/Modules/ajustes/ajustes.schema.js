const { z } = require('zod');

const CONCEPTOS = ['DIFERENCIA_INVENTARIO', 'DETERIORO', 'PERDIDA', 'BAJA', 'CORRECCION'];

const crearSchema = z.object({
  body: z.object({
    item_id:  z.number({ required_error: 'item_id requerido.' }).int().positive('item_id debe ser un entero positivo.'),
    cantidad: z.number({ required_error: 'cantidad requerida.' })
                .int('La cantidad debe ser un entero.')
                .refine(v => v !== 0, { message: 'La cantidad no puede ser cero.' }),
    concepto: z.enum(CONCEPTOS, {
                errorMap: () => ({ message: `Concepto invalido. Valores permitidos: ${CONCEPTOS.join(', ')}.` }),
              }),
    motivo:   z.string({ required_error: 'motivo requerido.' })
                .min(5, 'El motivo debe tener al menos 5 caracteres.')
                .max(500),
  }),
});

module.exports = { crearSchema };
