import multer from "multer";
import path from "path";

// use memory storage to store the file in memory as a buffer
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite à 5 Mo
  },
  fileFilter: (req, file, cb) => {
    // ckeck file type is pdf
    const filetypes = /pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed!"));
  },
});
