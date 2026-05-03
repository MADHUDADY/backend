// backend/routes/doctorRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../config/db');

const {
  getAllDoctors,
  getDoctorById,
  getDoctorsByCategory,
  getDoctorsByClinicAndCategory,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');

// ── Multer setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'doctors');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const safeName = `doctor_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP allowed.`));
    }
  },
});

const handleUpload = (req, res, next) => {
  upload.single('PHOTO')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ── Routes ────────────────────────────────────────────────────────────────────
// ⚠️ ORDER IMPORTANT: specific routes before /:id

// ✅ License number unique check
// GET /api/doctors/check-license/DHA-P-12345
router.get('/check-license/:licenseNo', async (req, res) => {
  try {
    const licenseNo = decodeURIComponent(req.params.licenseNo).trim();
    const [rows] = await db.query(
      `SELECT d.SERVICEID, d.SERVICE_E, d.CLINICID, c.COMPANYNAME
       FROM doctorservice d
       LEFT JOIN companydetails c ON d.CLINICID = c.COMPANYID
       WHERE d.MEDSOFT_ID = ? AND d.ACTIVE = 'Y'`,
      [licenseNo]
    );
    if (rows.length > 0) {
      res.json({
        exists:  true,
        doctor:  rows[0],
        message: `License already registered — ${rows[0].SERVICE_E} (Clinic: ${rows[0].COMPANYNAME || rows[0].CLINICID})`,
      });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/category/:categoryId',                     getDoctorsByCategory);
router.get('/byclinic/:clinicId/category/:categoryId',  getDoctorsByClinicAndCategory);
router.get('/',                                         getAllDoctors);
router.get('/:id',                                      getDoctorById);
router.post('/',       handleUpload,                    createDoctor);
router.put('/:id',     handleUpload,                    updateDoctor);
router.delete('/:id',                                   deleteDoctor);

module.exports = router;