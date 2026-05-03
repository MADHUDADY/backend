// Backend/config/upload.js
// Run: npm install multer   (if not already installed)

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Creates  Backend/uploads/doctors/  automatically if not exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'doctors');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req,  file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doctor-${Date.now()}${ext}`);   // e.g. doctor-1714000000000.jpg
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
          && /jpeg|jpg|png|webp/.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only JPG / PNG / WEBP allowed'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });