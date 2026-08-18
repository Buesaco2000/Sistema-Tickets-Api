const { Router } = require("express");
const { authenticate } = require('../../../Middlewares/auth.middleware');
const ctrl = require("./obligaciones.controller");

const router = Router();

router.get("/", authenticate, ctrl.getAll);

router.get("/catalogos", authenticate, ctrl.getCatalogos);

router.get("/:id", authenticate, ctrl.getOne);

router.post("/", authenticate, ctrl.create);

router.put("/:id", authenticate, ctrl.update);

router.delete("/:id", authenticate, ctrl.remove);

module.exports = router;