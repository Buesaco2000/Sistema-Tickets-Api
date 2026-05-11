const router = require("express").Router();
const { z } = require("zod");
const pool = require("../../../config/database");
const { authenticate } = require("../../../middlewares/auth.middleware");
const { authorize } = require("../../../middlewares/rbac.middleware");
const validate = require("../../../middlewares/validate.middleware");
const { success } = require("../../../utils/response");
const AppError = require("../../../utils/AppError");
const ROLES = require("../../../utils/roles");

const schema = z.object({
  body: z.object({ nombre: z.string().min(2).max(50) }),
});

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

// Catálogos solo para ADMIN
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre FROM cargos ORDER BY nombre",
    );
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", validate(idParam), async (req, res, next) => {
  try {
    const [[row]] = await pool.query(
      "SELECT id, nombre FROM cargos WHERE id = ?",
      [req.params.id],
    );
    if (!row) return next(new AppError("Cargo no encontrado.", 404));
    return success(res, row);
  } catch (e) {
    next(e);
  }
});

router.use(authorize(ROLES.ADMIN));

router.post("/", validate(schema), async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO cargos (nombre) VALUES (?)",
      [req.body.nombre.trim()],
    );
    const [[row]] = await pool.query(
      "SELECT id, nombre FROM cargos WHERE id = ?",
      [result.insertId],
    );
    return success(res, row, "Cargo creado.", 201);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", validate(idParam), async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "UPDATE cargos SET nombre = ? WHERE id = ?",
      [req.body.nombre.trim(), req.params.id],
    );
    if (result.affectedRows === 0)
      return next(new AppError("Cargo no encontrado.", 404));
    const [[row]] = await pool.query(
      "SELECT id, nombre FROM cargos WHERE id = ?",
      [req.params.id],
    );
    return success(res, row, "Cargo actualizado.");
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", validate(idParam), async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM cargos WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return next(new AppError("Cargo no encontrado.", 404));
    return success(res, null, "Cargo eliminado.");
  } catch (e) {
    next(e);
  }
});

module.exports = router;
