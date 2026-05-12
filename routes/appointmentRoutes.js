const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES — No JWT (Kiosk use chestundi)
// ══════════════════════════════════════════════════════════════════════════════

// SEARCH patient by mobile — PUBLIC
router.get('/search-patient/:mobile', async (req, res) => {
  try {
    const mobile = req.params.mobile.trim();
    const [rows] = await db.query(
      `SELECT SLNO, PatientName, Mobile, Age, Gender, RegNo, DOB, Address, Email
       FROM hispatientdetails
       WHERE Mobile = ? AND Active = 'Y'
       ORDER BY SLNO DESC`,
      [mobile]
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET new-list — PUBLIC (Kiosk appointment check)
router.get('/new-list', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*,
              d.SERVICE_E   AS DoctorName,
              cat.CATEGORYE AS DepartmentName,
              p.PatientName, p.Mobile
       FROM appointments a
       LEFT JOIN doctorservice d     ON a.DoctorId     = d.SERVICEID
       LEFT JOIN category      cat   ON a.DepartmentId = cat.CATEGORYID
       LEFT JOIN hispatientdetails p ON a.PatientId    = p.SLNO
       ORDER BY a.SLNO DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE token — PUBLIC (Kiosk walk-in + appointment confirm)
router.post('/', async (req, res) => {
  try {
    const { TICKETNUMBER, COUNTERID, SERVICEID, ZONE, TYPE, CENTERID, PATIENTNAME, PHONE } = req.body;
    if (!TICKETNUMBER)
      return res.status(400).json({ success: false, message: 'TICKETNUMBER required' });
    const [result] = await db.query(
      `INSERT INTO callhistory
       (TICKETNUMBER, COUNTERID, TOKENDATE, SERVICEID,
        STATUSSCREENDISPLAYALL, STATUSCALLDISPLAYALL,
        STATUSSCREENDISPLAYBYID, STATUSCALLDISPLAYBYID,
        ZONE, TYPE, CENTERID, PATIENTNAME, PHONE)
       VALUES (?, ?, NOW(), ?, 1, 0, 1, 0, ?, ?, ?, ?, ?)`,
      [TICKETNUMBER, COUNTERID||'1', SERVICEID||1, ZONE||'1', TYPE||'D', CENTERID||'101', PATIENTNAME||null, PHONE||null]
    );
    res.status(201).json({ success: true, message: 'Token created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES — JWT required from here
// ══════════════════════════════════════════════════════════════════════════════
router.use(verifyToken);

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, d.SERVICE_E as DoctorName, cat.CATEGORYE as DepartmentName
       FROM callhistory c
       LEFT JOIN doctorservice d   ON c.SERVICEID  = d.SERVICEID
       LEFT JOIN category      cat ON d.CATEGORYID = cat.CATEGORYID
       ORDER BY c.SLNO DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET today
router.get('/today', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, d.SERVICE_E as DoctorName, cat.CATEGORYE as DepartmentName
       FROM callhistory c
       LEFT JOIN doctorservice d   ON c.SERVICEID  = d.SERVICEID
       LEFT JOIN category      cat ON d.CATEGORYID = cat.CATEGORYID
       WHERE DATE(c.TOKENDATE) = CURDATE()
       ORDER BY c.SLNO DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET by ticket
router.get('/ticket/:ticketNumber', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM callhistory WHERE TICKETNUMBER = ?', [req.params.ticketNumber]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM callhistory WHERE SLNO = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE appointment record
router.post('/new', requireRole('Admin', 'Staff', 'Reception', 'Call Centre'), async (req, res) => {
  try {
    const { ClinicId, DepartmentId, DoctorId, PatientId, AppointmentDateTime, CreatedBy } = req.body;
    if (!DoctorId) return res.status(400).json({ success: false, message: 'DoctorId required' });
    const [result] = await db.query(
      `INSERT INTO appointments (ClinicId, DepartmentId, DoctorId, PatientId, AppointmentDateTime, isCancel, isVisited, CreatedBy, CreatedDate)
       VALUES (?, ?, ?, ?, ?, 'N', 'N', ?, NOW())`,
      [ClinicId||101, DepartmentId||null, DoctorId, PatientId||null, AppointmentDateTime||new Date(), CreatedBy||1]
    );
    const newSlno = result.insertId;
    const appointNumber = `AP-${ClinicId||101}-${PatientId||0}-${newSlno}`;
    await db.query('UPDATE appointments SET AppointNumber = ? WHERE SLNO = ?', [appointNumber, newSlno]);
    res.status(201).json({ success: true, message: 'Appointment created', id: newSlno, AppointNumber: appointNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE status
router.put('/:id', requireRole('Admin', 'Staff', 'Reception', 'Call Centre'), async (req, res) => {
  try {
    const { STATUSCALLDISPLAYALL, STATUSSCREENDISPLAYALL } = req.body;
    const [result] = await db.query(
      `UPDATE callhistory SET STATUSCALLDISPLAYALL=?, STATUSSCREENDISPLAYALL=? WHERE SLNO=?`,
      [STATUSCALLDISPLAYALL??1, STATUSSCREENDISPLAYALL??1, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete('/:id', requireRole('Admin', 'Reception', 'Call Centre'), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM callhistory WHERE SLNO=?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;