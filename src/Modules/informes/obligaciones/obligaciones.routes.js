const { Router } = require("express");
const { authenticate } = require('../../../Middlewares/auth.middleware');
const ctrl = require("./obligaciones.controller");

const router = Router();

router.get("/", authenticate, ctrl.getAll);
router.get("/catalogos", authenticate, ctrl.getCatalogos);

router.post("/", authenticate, ctrl.create);
router.get("/:id/ejecuciones",           authenticate, ctrl.getEjecuciones);
router.post("/:id/generar-ejecuciones",  authenticate, ctrl.generarEjecuciones);

router.patch("/:id/activo", authenticate, ctrl.toggleActivo);
router.delete("/:id", authenticate, ctrl.remove);
router.put("/:id", authenticate, ctrl.update);

router.get("/:id", authenticate, ctrl.getOne);

module.exports = router;