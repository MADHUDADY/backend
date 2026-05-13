const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const {
  getClinicDetails, getAllCategories, getAllServices,
  getAllCounters, getAllEmployees, employeeLogin, updateClinicDetails,
} = require('../controllers/clinicController');

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/login', employeeLogin);

// ── GET clinic — PUBLIC (Kiosk needs TICKET_MODE) ────────────────────────────
router.get('/', getClinicDetails);

// ── GET ticket config — PUBLIC (Kiosk use chestundi) ─────────────────────────
router.get('/ticket-config', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT TICKET_MODE FROM companydetails LIMIT 1'
    );
    res.json({ success: true, mode: rows[0]?.TICKET_MODE || 'print' });
  } catch (err) {
    res.json({ success: true, mode: 'print' });
  }
});

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(verifyToken);

router.get('/categories', getAllCategories);
router.get('/services',   getAllServices);
router.get('/counters',   getAllCounters);
router.get('/employees',  requireRole('Admin'), getAllEmployees);

// ── UPDATE clinic + TICKET_MODE — Admin only ──────────────────────────────────
router.put('/:id', requireRole('Admin'), updateClinicDetails);

// ── UPDATE ticket config — Admin only ────────────────────────────────────────
router.put('/ticket-config/save', requireRole('Admin'), async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['sms','print','both'].includes(mode))
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    await db.query('UPDATE companydetails SET TICKET_MODE = ?', [mode]);
    res.json({ success: true, message: 'Ticket config saved', mode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;