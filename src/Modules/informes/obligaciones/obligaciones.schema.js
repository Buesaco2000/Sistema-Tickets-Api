const { z } = require('zod');

const TIPOS_INFORME = ['NORMATIVO', 'OBLIGATORIO', 'CONTRACTUAL'];

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number),
  }),
});

const obligacionBodyBase = z.object({
  codigo:            z.string({ required_error: 'El codigo es obligatorio.' }).min(1).max(50),
  nombre:            z.string({ required_error: 'El nombre es obligatorio.' }).min(1).max(300),
  ente_rector_id:    z.number({ required_error: 'ente_rector_id requerido.' }).int().positive(),
  receptor_id:       z.number({ required_error: 'receptor_id requerido.' }).int().positive(),
  periodicidad_id:   z.number({ required_error: 'periodicidad_id requerido.' }).int().positive(),
  soporte_normativo: z.string({ required_error: 'soporte_normativo es obligatorio.' }).min(1).max(500),
  dias_plazo:        z.number({ required_error: 'dias_plazo es obligatorio.' }).int().positive('dias_plazo debe ser mayor a 0.'),
  tipo_informe:      z.enum(TIPOS_INFORME, {
                       errorMap: () => ({ message: `tipo_informe invalido. Valores: ${TIPOS_INFORME.join(', ')}.` }),
                     }).optional().default('NORMATIVO'),
  detalle:           z.string().max(2000).optional().nullable(),
  complejidad:       z.number().int().min(1).max(5).optional().default(1),
  dias_anticipacion: z.number().int().nonnegative().optional().default(30),
  area_elabora:      z.string().max(200).optional().nullable(),
  area_presenta:     z.string().max(200).optional().nullable(),
  cargo_id:          z.number().int().positive().optional().nullable(),
  responsable_id:    z.number().int().positive().optional().nullable(),
  suplente_id:       z.number().int().positive().optional().nullable(),
  activo:            z.boolean().optional().default(true),
});

const crearSchema    = z.object({ body: obligacionBodyBase });
const actualizarSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/, 'ID invalido.').transform(Number) }),
  body:   obligacionBodyBase.partial(),
});

module.exports = { idParamSchema, crearSchema, actualizarSchema };
