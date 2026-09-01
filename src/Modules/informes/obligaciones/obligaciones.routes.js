const { Router } = require("express");
const { authenticate } = require('../../../Middlewares/auth.middleware');
const { authorize }    = require('../../../Middlewares/rbac.middleware');
const ROLES            = require('../../../Utils/roles');
const ctrl = require("./obligaciones.controller");

const router = Router();

const ARCHIVOS_ADMIN = [ROLES.ADMIN, ROLES.ARCHIVOS];

// Lectura — ADMIN y ARCHIVOS
router.get("/",                          authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getAll);
router.get("/catalogos",                 authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getCatalogos);
router.get("/:id",                       authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getOne);
router.get("/:id/ejecuciones",           authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.getEjecuciones);

// Escritura — ADMIN y ARCHIVOS
router.post("/",                         authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.create);
router.put("/:id",                       authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.update);
router.patch("/:id/activo",              authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.toggleActivo);
router.delete("/:id",                    authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.remove);
router.post("/:id/generar-ejecuciones", authenticate, authorize(...ARCHIVOS_ADMIN), ctrl.generarEjecuciones);

module.exports = router;
