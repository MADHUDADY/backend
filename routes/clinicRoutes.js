// backend/routes/clinicRoutes.js
const express = require('express');
const router  = express.Router();

const {
  getClinicDetails,
  getAllCategories,
  getAllServices,
  getAllCounters,
  getAllEmployees,
  employeeLogin,
  updateClinicDetails,
} = require('../controllers/clinicController');

// ── GET clinic details  →  /api/clinic ───────────────────────────────────────
router.get('/', getClinicDetails);

// ── GET categories  →  /api/clinic/categories ────────────────────────────────
router.get('/categories', getAllCategories);

// ── GET services  →  /api/clinic/services ────────────────────────────────────
router.get('/services', getAllServices);

// ── GET counters  →  /api/clinic/counters ────────────────────────────────────
router.get('/counters', getAllCounters);

// ── GET employees  →  /api/clinic/employees ──────────────────────────────────
router.get('/employees', getAllEmployees);

// ── Employee login  →  /api/clinic/login ─────────────────────────────────────
router.post('/login', employeeLogin);

// ── UPDATE clinic  →  /api/clinic/:id ────────────────────────────────────────
router.put('/:id', updateClinicDetails);

module.exports = router;