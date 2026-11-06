const { z } = require('zod');

const TIPOS_RECEPCION = ['MEDICAMENTOS', 'LABORATORIO', 'MEDICO_QUIRURGICO', 'ASEO_PAPELERIA', 'ODONTOLOGIA'];


// passthrough() preserva los que no se declaran aqui para que el service los reciba.
const numField = z.union([z.number(), z.string()])
  .transform((v) => (v === '' || v == null ? null : Number(v)))
  .refine((v) => v === null || (!isNaN(v) && v >= 0), { message: 'Debe ser un número no negativo.' })
  .nullable().optional();

const itemSchema = z.object({
  nombre:            z.string({ required_error: 'El nombre del item es obligatorio.' }).min(1).max(300),
  cant_recepcionada: numField,
  cant_solicitada:   numField,
  precio_unitario:   numField,
}).passthrough();

// Usada tanto en POST /borrador como en POST /
const recepcionBodySchema = z.object({
  tipo_recepcion:        z.enum(TIPOS_RECEPCION, {
                           errorMap: () => ({ message: `tipo_recepcion invalido. Valores: ${TIPOS_RECEPCION.join(', ')}.` }),
                         }).optional(),
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
