const { z } = require('zod');

const TIPOS_RECEPCION = ['MEDICAMENTOS', 'LABORATORIO', 'MEDICO_QUIRURGICO', 'ASEO_PAPELERIA', 'ODONTOLOGIA'];

// Cada item del array de medicamentos tiene muchos campos opcionales;
// passthrough() preserva los que no se declaran aqui para que el service los reciba.
const itemSchema = z.object({
  nombre:            z.string({ required_error: 'El nombre del item es obligatorio.' }).min(1).max(300),
  cant_recepcionada: z.number().nonnegative('cant_recepcionada no puede ser negativa.').nullable().optional(),
  cant_solicitada:   z.number().nonnegative().nullable().optional(),
  precio_unitario:   z.number().nonnegative().nullable().optional(),
}).passthrough();

// Usada tanto en POST /borrador como en POST /
const recepcionBodySchema = z.object({
  tipo_recepcion:        z.enum(TIPOS_RECEPCION, {
                           errorMap: () => ({ message: `tipo_recepcion invalido. Valores: ${TIPOS_RECEPCION.join(', ')}.` }),
                         }),
  fecha:                 z.string().optional().nullable(),
  hora:                  z.string().optional().nullable(),
  municipio_id:          z.number().int().positive().optional().nullable(),
  sede_id:               z.number().int().positive().optional().nullable(),
  uas:                   z.string().max(200).optional().nullable(),
  proveedor:             z.string().max(300).optional().nullable(),
  remision_factura:      z.string().max(200).optional().nullable(),
  reactivos:             z.string().max(200).optional().nullable(),
  responsable_recibe:    z.string().max(200).optional().nullable(),
  responsable_recibe_id: z.number().int().positive().optional().nullable(),
  recepcion_padre_id:    z.number().int().positive().optional().nullable(),
  borradorId:            z.number().int().positive().optional().nullable(),
  medicamentos:          z.array(itemSchema).optional(),
});

const createSchema  = z.object({ body: recepcionBodySchema });
const borradorSchema = z.object({ body: recepcionBodySchema });

const salidaSchema = z.object({
  body: z.object({
    item_id:              z.number({ required_error: 'item_id requerido.' }).int().positive(),
    cantidad:             z.number({ required_error: 'cantidad requerida.' }).int().positive('La cantidad debe ser mayor a 0.'),
    fecha:                z.string().optional().nullable(),
    motivo:               z.string().max(300).optional().nullable(),
    responsable:          z.string().max(200).optional().nullable(),
    municipio_destino_id: z.number().int().positive().optional().nullable(),
    sede_destino_id:      z.number().int().positive().optional().nullable(),
  }),
});

module.exports = { createSchema, borradorSchema, salidaSchema };
