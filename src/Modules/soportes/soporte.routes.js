const router  = require('express').Router();
const { z }   = require('zod');
const service = require('./soporte.service');
const { authenticate } = require('../../Middlewares/auth.middleware');
const { authorize }    = require('../../Middlewares/rbac.middleware');
const validate         = require('../../Middlewares/validate.middleware');
const { success }      = require('../../Utils/response');
const ROLES            = require('../../Utils/roles');

const createSchema = z.object({
  body: z.object({
    ticket_id:       z.number().int().positive(),
    tipo_soporte_id: z.number().int().positive().optional().nullable(),
    descripcion:     z.string().min(5),
    imagen_url:      z.string().url().optional().nullable(),
    // Campos de soporte_detalle (solo si el tipo requiere_detalle = true)
    detalle: z.object({
      sede_id:               z.number().int().positive().optional().nullable(),
      fecha_facturacion:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
      factura_anular:        z.string().max(10).optional().nullable(),
      factura_copago_anular: z.string().max(10).optional().nullable(),
      valor_copago_anulado:  z.number().nonnegative().optional().nullable(),
      factura_refacturar:    z.string().max(10).optional().nullable(),
      nombre_facturador:     z.string().max(100).optional().nullable(),
      motivo:                z.string().optional().nullable(),
    }).optional().nullable(),
  }),
});

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

const ticketIdParam = z.object({
  params: z.object({ ticket_id: z.string().regex(/^\d+$/).transform(Number) }),
});

router.use(authenticate);

router.get('/ticket/:ticket_id', validate(ticketIdParam), async (req, res, next) => {
  try {
    return success(res, await service.findByTicket(req.params.ticket_id, req.user.empresa_id));
  } catch (e) { next(e); }
});

router.get('/:id', validate(idParam), async (req, res, next) => {
  try {
    return success(res, await service.findById(req.params.id, req.user.empresa_id));
  } catch (e) { next(e); }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    return success(res, await service.create(req.body, req.user.empresa_id), 'Soporte creado.', 201);
  } catch (e) { next(e); }
});

router.delete('/:id', validate(idParam), authorize(ROLES.ADMIN), async (req, res, next) => {
  try {
    await service.softDelete(req.params.id, req.user.empresa_id);
    return success(res, null, 'Soporte eliminado.');
  } catch (e) { next(e); }
});

module.exports = router;
