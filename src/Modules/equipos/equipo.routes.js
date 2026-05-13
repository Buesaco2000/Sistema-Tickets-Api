const router   = require('express').Router();
const { z }    = require('zod');
const ctrl     = require('./equipo.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize }    = require('../../middlewares/rbac.middleware');
const validate         = require('../../middlewares/validate.middleware');
const ROLES            = require('../../utils/roles');
const { uploadEquipoImagen, uploadEquipoDoc } = require('../../utils/uploadFile');

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

const caracteristicasSchema = z.object({
  clase_tecnologia_id:     z.number().int().positive().optional().nullable(),
  fuente_energia:          z.string().max(100).optional().nullable(),
  voltaje:                 z.number().optional().nullable(),
  voltaje_max_operacion:   z.string().max(50).optional().nullable(),
  corriente_maxima:        z.number().optional().nullable(),
  corriente_minima:        z.number().optional().nullable(),
  potencia:                z.number().optional().nullable(),
  frecuencia:              z.number().optional().nullable(),
  humedad:                 z.string().max(50).optional().nullable(),
  longitud_onda:           z.string().max(50).optional().nullable(),
  temperatura:             z.string().max(50).optional().nullable(),
  temperatura_max:         z.string().max(50).optional().nullable(),
  peso:                    z.string().max(50).optional().nullable(),
  capacidad:               z.string().max(50).optional().nullable(),
  vida_util:               z.number().int().min(0).optional().nullable(),
  vida_util_unidad:        z.enum(['MESES', 'AÑOS', 'HORAS']).optional(),
  fecha_fabricacion:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().nullable(),
  requiere_agua:           z.boolean().optional().nullable(),
  requiere_gas:            z.boolean().optional().nullable(),
  requiere_combustible:    z.boolean().optional().nullable(),
}).optional().nullable();

const createSchema = z.object({
  body: z.object({
    fabricante_id:               z.number().int().positive().optional().nullable(),
    nombre:                      z.string().min(2).max(255),
    serie:                       z.string().min(1).max(100),
    sede_id:                     z.number().int().positive().optional().nullable(),
    municipio_id:                z.number().int().positive().optional().nullable(),
    tipo_equipo_id:              z.number().int().positive().optional().nullable(),
    proveedor_id:                z.number().int().positive().optional().nullable(),
    nivel_riesgo_id:             z.number().int().positive().optional().nullable(),
    clasificacion_riesgo_id:     z.number().int().positive().optional().nullable(),
    clasificacion_biomedica_id:  z.number().int().positive().optional().nullable(),
    frecuencia_mantenimiento_id: z.number().int().positive().optional().nullable(),
    nivel_complejidad_id:        z.number().int().positive().optional().nullable(),
    activo_fijo:                 z.string().max(50).optional().nullable(),
    marca:                       z.string().max(100).optional().nullable(),
    modelo:                      z.string().max(100).optional().nullable(),
    codigo_ecri:                 z.string().max(50).optional().nullable(),
    registro_invima:             z.string().max(100).optional().nullable(),
    ubicacion:                   z.string().max(255).optional().nullable(),
    costo_adquisicion:           z.number().nonnegative().optional().nullable(),
    forma_adquisicion:           z.string().max(100).optional().nullable(),
    fecha_compra:                z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().nullable(),
    fecha_instalacion:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().nullable(),
    inicio_garantia:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().nullable(),
    fecha_fin_garantia:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().nullable(),
    fecha_servicio:              z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().nullable(),
    imagen_url:                  z.string().optional().nullable(),
    descripcion:                 z.string().optional().nullable(),
    caracteristicas_tecnicas:    caracteristicasSchema,
    componentes: z.array(z.object({
      nombre: z.string().max(100).optional().nullable(),
      marca:  z.string().max(100).optional().nullable(),
      modelo: z.string().max(100).optional().nullable(),
      serie:  z.string().max(100).optional().nullable(),
    })).optional(),
    documentos: z.array(
      z.union([
        z.string(),
        z.object({
          tipo_documento_id: z.number().int().positive(),
          url:               z.string().url().optional().nullable(),
        }),
        z.object({
          tipo: z.string(),
          url:  z.string().nullable().optional(),
        }),
      ])
    ).optional(),
    soporte_tecnico: z.object({
      verificable:              z.boolean().optional().nullable(),
      calibrable:               z.boolean().optional().nullable(),
      manual_usuario:           z.boolean().optional().nullable(),
      periodicidad_calibracion: z.string().max(50).optional().nullable(),
      recomendaciones:          z.string().optional().nullable(),
    }).optional().nullable(),
  }).passthrough(),  // allow frontend flat fields (tipoEquipo, clasificacion_riesgo, etc.)
});

router.use(authenticate);

router.get('/',    ctrl.getAll);
router.get('/:id', validate(idParam), ctrl.getOne);
router.post('/',   authorize(ROLES.ADMIN, ROLES.INGENIERO), validate(createSchema), ctrl.create);
router.put('/:id', validate(idParam), authorize(ROLES.ADMIN, ROLES.INGENIERO), ctrl.update);
router.delete('/:id', validate(idParam), authorize(ROLES.ADMIN), ctrl.remove);

// ── Uploads de archivos ───────────────────────────────────────────────────────
router.post(
  '/upload-imagen',
  authorize(ROLES.ADMIN, ROLES.INGENIERO),
  uploadEquipoImagen.single('file'),
  ctrl.uploadImagen,
);
router.post(
  '/upload-documento',
  authorize(ROLES.ADMIN, ROLES.INGENIERO),
  uploadEquipoDoc.single('file'),
  ctrl.uploadDocumento,
);

module.exports = router;
