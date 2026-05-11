const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const ALLOWED_IMG_MIMETYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_DOC_MIMETYPES = ["application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

const imgFilter = (req, file, cb) => {
  if (!ALLOWED_IMG_MIMETYPES.includes(file.mimetype))
    return cb(new Error("Solo se permiten imágenes JPEG, PNG o WEBP."));
  cb(null, true);
};

const docFilter = (req, file, cb) => {
  if (!ALLOWED_DOC_MIMETYPES.includes(file.mimetype))
    return cb(new Error("Solo se permiten archivos PDF."));
  cb(null, true);
};

const makeStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(process.cwd(), "public", folder);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      // Alta entropía: timestamp + 16 bytes aleatorios
      const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

const imgOpts = (folder) => ({
  storage: makeStorage(folder),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imgFilter,
});

const docOpts = (folder) => ({
  storage: makeStorage(folder),
  limits: { fileSize: MAX_SIZE },
  fileFilter: docFilter,
});

module.exports = {
  uploadPlataforma:    multer(imgOpts("errores")),
  uploadSoporte:       multer(imgOpts("soporte")),
  uploadEquipoImagen:  multer(imgOpts("equipos/imagenes")),
  uploadEquipoDoc:     multer(docOpts("equipos/documentos")),
  uploadMantImagen:    multer(imgOpts("mantenimientos/imagenes")),
};
