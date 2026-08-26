const router  = require("express").Router();
const ctrl    = require("./stockMinimo.controller");
const { authenticate } = require("../../Middlewares/auth.middleware");
const { authorize }    = require("../../Middlewares/rbac.middleware");
const ROLES   = require("../../Utils/roles");
const { z }   = require("zod");
const validate         = require("../../Middlewares/validate.middleware");

const upsertSchema = z.object({
  body: z.object({
    catalogo_id:  z.number().int().positive(),
    municipio_id: z.number().int().positive().nullable().optional(),
    sede_id:      z.number().int().positive().nullable().optional(),
    stock_minimo: z.number().int().min(0),
  }),
});

// Alertas: accesible para todos los roles autenticados (cada uno filtra su punto)
router.get("/alertas", authenticate, ctrl.getAlertas);

// CRUD de mínimos: solo ADMIN y Director Técnico / Almacén
router.get("/",           authenticate, authorize(ROLES.ADMIN), ctrl.listar);
router.post("/",          authenticate, authorize(ROLES.ADMIN), validate(upsertSchema), ctrl.upsert);
router.delete("/:id",     authenticate, authorize(ROLES.ADMIN), ctrl.eliminar);

module.exports = router;
