const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Usuarios = require("../Models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const authenticateToken = require("../Integracion/auth");
const SECRET_KEY = process.env.SECRET_KEY || "SECRET_SUPER_SEGURA";

//  Obtener todos los usuarios
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const usuarios = await Usuarios.findAll();
      res.json({
        success: true,
        message: "Usuarios recuperados con éxito.",
        data: usuarios,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Obtener un usuario por ID
router.get(
  "/:sid",
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const usuariosID = req.params.sid;
      const usuario = await Usuarios.findById(usuariosID);
      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado." });
      }
      res.json({
        success: true,
        message: "Usuario recuperado exitosamente.",
        data: usuario,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Crear nuevo usuario
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    try {
      const {
        nombres,
        apellidos,
        email,
        telefono,
        rol_id,
        cargo_id,
        municipio_id,
        password,
      } = req.body;

      if (
        !nombres ||
        !apellidos ||
        !email ||
        !telefono ||
        !cargo_id ||
        !municipio_id ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son obligatorios.",
        });
      }

      const exists = await Usuarios.findByEmail(email);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "El correo ya está registrado",
        });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const usuarioData = {
        nombres: nombres,
        apellidos: apellidos || "",
        email: email || "",
        telefono: telefono || "",
        cargo_id,
        municipio_id,
        rol_id: rol_id ?? 2,
        password: hashedPassword,
      };

      try {
        const newUsuario = await Usuarios.create(usuarioData);
        res.status(201).json({
          success: true,
          message: "Usuario creado exitosamente.",
          data: newUsuario,
        });
      } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Actualizar un usuario
router.put(
  "/:sid",
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const data = { ...req.body };
      const userIdToUpdate = req.params.sid;
      const currentUserId = req.user.id;
      const currentUserRolId = req.user.rol_id;

      // Validar que solo Admin (rol_id = 1) puede cambiar campos sensibles
      const camposSensibles = ["rol_id", "cargo_id", "municipio_id", "activo"];
      const intentaCambiarSensibles = camposSensibles.some(
        (campo) => data[campo] !== undefined
      );

      if (intentaCambiarSensibles && currentUserRolId !== 1) {
        return res.status(403).json({
          success: false,
          message:
            "No tienes permisos para modificar rol, cargo, municipio o estado.",
        });
      }

      // Validar que un usuario solo puede editar su propio perfil (excepto Admin)
      if (
        String(userIdToUpdate) !== String(currentUserId) &&
        currentUserRolId !== 1
      ) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para editar este usuario.",
        });
      }

      if (data.password && data.password.trim() !== "") {
        data.password = await bcrypt.hash(data.password, saltRounds);
      } else {
        delete data.password;
      }

      const updatedUsuario = await Usuarios.updateById(req.params.sid, data);

      if (!updatedUsuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado." });
      }

      res.status(200).json({
        success: true,
        message: "Usuario actualizado exitosamente.",
        data: updatedUsuario,
      });
    } catch (error) {
      console.log(`Error al actualizar usuario: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

router.put("/:id/estado", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        message: "Estado inválido",
      });
    }

    await Usuarios.findByCambiarEstado(Number(id), activo);

    res.json({
      success: true,
      message: "Usuario actualizado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar tickets",
    });
  }
});

// Eliminar un usuario
router.delete(
  "/:sid",
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { sid } = req.params;

      const deletedUsuario = await Usuarios.deleteById(sid);

      if (!deletedUsuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado." });
      }
      res.json({
        success: true,
        message: "Usuario eliminado exitosamente.",
        data: deletedUsuario,
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Iniciar sesión
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const emailNormalized = email.toLowerCase().trim();

    try {
      const usuario = await Usuarios.findByEmail(emailNormalized);

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: "Nombre de usuario o contraseña incorrectos.",
        });
      }

      if (!usuario.activo) {
        return res.status(403).json({
          success: false,
          message: "Tu cuenta está desactivada. Contacta al administrador.",
        });
      }

      const match = await bcrypt.compare(password, usuario.password);

      if (!match) {
        return res.status(401).json({
          success: false,
          message: "Nombre de usuario o contraseña incorrectos.",
        });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          email: usuario.email,
          rol_id: usuario.rol_id,
          cargo_id: usuario.cargo_id,
          municipio_id: usuario.municipio_id,
          municipio: usuario.municipio,
        },
        SECRET_KEY,
        { expiresIn: "8h" }
      );

      const { password: _, ...usuarioSafe } = usuario;

      // Configurar cookie HttpOnly segura
      res.cookie("token", token, {
        httpOnly: true, // JavaScript NO puede leer esta cookie
        secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
        sameSite: "strict", // Protección contra CSRF
        maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
      });

      res.json({
        success: true,
        message: "Inicio de sesión exitoso.",
        data: usuarioSafe,
      });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Cerrar sesión (limpiar cookie)
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      success: true,
      message: "Sesión cerrada exitosamente.",
    });
  })
);

module.exports = router;
