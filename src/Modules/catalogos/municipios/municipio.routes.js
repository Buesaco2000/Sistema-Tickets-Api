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
  body: z.object({ nombre: z.string().min(2).max(100) }),
});

const idParam = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/).transform(Number) }),
});

router.use(authenticate);

// Lectura disponible para todos los roles autenticados
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre FROM municipios ORDER BY nombre",
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", validate(idParam), async (req, res, next) => {
  try {
    const [[row]] = await pool.query(
      "SELECT id, nombre FROM municipios WHERE id = ?",
      [req.params.id],
    );
    if (!row) return next(new AppError("Municipio no encontrado.", 404));
    return success(res, row);
  } catch (err) {
    next(err);
  }
});

router.use(authorize(ROLES.ADMIN));
// Escritura solo ADMIN

router.post(
  "/",
  validate(schema),
  async (req, res, next) => {
    try {
      const [result] = await pool.query(
        "INSERT INTO municipios (nombre) VALUES (?)",
        [req.body.nombre.trim()],
      );
      const [[row]] = await pool.query(
        "SELECT id, nombre FROM municipios WHERE id = ?",
        [result.insertId],
      );
      return success(res, row, "Municipio creado.", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  "/:id",
  validate(idParam),
  validate(schema),
  async (req, res, next) => {
    try {
      const [result] = await pool.query(
        "UPDATE municipios SET nombre = ? WHERE id = ?",
        [req.body.nombre.trim(), req.params.id],
      );
      if (!result.affectedRows)
        return next(new AppError("Municipio no encontrado.", 404));
      const [[row]] = await pool.query(
        "SELECT id, nombre FROM municipios WHERE id = ?",
        [req.params.id],
      );
      return success(res, row, "Municipio actualizado.");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:id",
  validate(idParam),
  async (req, res, next) => {
    try {
      const [result] = await pool.query("DELETE FROM municipios WHERE id = ?", [
        req.params.id,
      ]);
      if (!result.affectedRows)
        return next(new AppError("Municipio no encontrado.", 404));
      return success(res, null, "Municipio eliminado.");
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
