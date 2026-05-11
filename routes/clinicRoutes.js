// backend/routes/clinicRoutes.js
const express = require('express');
const router  = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth');

const {
  getClinicDetails,
  getAllCategories,
  getAllServices,
  getAllCounters,
  getAllEmployees,
  employeeLogin,
  updateClinicDetails,
} = require('../controllers/clinicController');

// ── Login — token అవసరం లేదు (public route) ──────────────────────────────────
router.post('/login', employeeLogin);

// ── ఇక్కడ నుండి అన్నీ login అవసరం ───────────────────────────────────────────
router.use(verifyToken);

// ── GET clinic details — అందరూ చూడవచ్చు ─────────────────────────────────────
router.get('/', getClinicDetails);

// ── GET categories — అందరూ చూడవచ్చు (Appointment లో కావాలి) ─────────────────
router.get('/categories', getAllCategories);

// ── GET services — అందరూ చూడవచ్చు ───────────────────────────────────────────
router.get('/services', getAllServices);

// ── GET counters — అందరూ చూడవచ్చు ───────────────────────────────────────────
router.get('/counters', getAllCounters);

// ── GET employees — Admin మాత్రమే ────────────────────────────────────────────
router.get('/employees', requireRole('Admin'), getAllEmployees);

// ── UPDATE clinic — Admin మాత్రమే ────────────────────────────────────────────
router.put('/:id', requireRole('Admin'), updateClinicDetails);

module.exports = router;