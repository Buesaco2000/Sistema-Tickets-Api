const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storagePlataforma = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "public", "errores");

    // Si no existe, crear
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      cb(
        null,
        Date.now() +
          "_" +
          Math.floor(Math.random() * 1000) +
          path.extname(file.originalname)
      );
    } else {
      cb("Error: only .jpeg, .jpg, .png files are allowed!");
    }
  },
});

const uploadPlataforma = multer({
  storage: storagePlataforma,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit filesize to 10MB
  },
});

const storageSOTROS = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "public", "soporte");

    // Si no existe, crear
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      cb(
        null,
        Date.now() +
          "_" +
          Math.floor(Math.random() * 1000) +
          path.extname(file.originalname)
      );
    } else {
      cb("Error: only .jpeg, .jpg, .png files are allowed!");
    }
  },
});

const uploadSOTROS = multer({
  storage: storageSOTROS,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit filesize to 10MB
  },
});

module.exports = {
  uploadPlataforma,
  uploadSOTROS,
};
