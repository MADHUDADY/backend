const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── GET all appointments ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, d.SERVICE_E as DoctorName, cat.CATEGORYE as DepartmentName
       FROM callhistory c
       LEFT JOIN doctorservice d ON c.SERVICEID = d.SERVICEID
       LEFT JOIN category cat ON d.CATEGORYID = cat.CATEGORYID
       ORDER BY c.SLNO DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET today's appointments ──────────────────────────────────────────────────
router.get('/today', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, d.SERVICE_E as DoctorName, cat.CATEGORYE as DepartmentName
       FROM callhistory c
       LEFT JOIN doctorservice d ON c.SERVICEID = d.SERVICEID
       LEFT JOIN category cat ON d.CATEGORYID = cat.CATEGORYID
       WHERE DATE(c.TOKENDATE) = CURDATE()
       ORDER BY c.SLNO DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET by ticket number ──────────────────────────────────────────────────────
router.get('/ticket/:ticketNumber', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM callhistory WHERE TICKETNUMBER = ?', [req.params.ticketNumber]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET by ID ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM callhistory WHERE SLNO = ?', [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CREATE appointment ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      TICKETNUMBER, COUNTERID, SERVICEID,
      ZONE, TYPE, CENTERID, PATIENTNAME, PHONE
    } = req.body;

    if (!TICKETNUMBER)
      return res.status(400).json({ success: false, message: 'TICKETNUMBER required' });

    const [result] = await db.query(
      `INSERT INTO callhistory
       (TICKETNUMBER, COUNTERID, TOKENDATE, SERVICEID,
        STATUSSCREENDISPLAYALL, STATUSCALLDISPLAYALL,
        STATUSSCREENDISPLAYBYID, STATUSCALLDISPLAYBYID,
        ZONE, TYPE, CENTERID)
       VALUES (?, ?, NOW(), ?, 1, 0, 1, 0, ?, ?, ?)`,
      [TICKETNUMBER, COUNTERID || '1', SERVICEID || 1,
       ZONE || '1', TYPE || 'D', CENTERID || '101']
    );
    res.status(201).json({ success: true, message: 'Appointment created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── UPDATE appointment status ─────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { STATUSCALLDISPLAYALL, STATUSSCREENDISPLAYALL } = req.body;
    const [result] = await db.query(
      `UPDATE callhistory SET STATUSCALLDISPLAYALL=?, STATUSSCREENDISPLAYALL=? WHERE SLNO=?`,
      [STATUSCALLDISPLAYALL ?? 1, STATUSSCREENDISPLAYALL ?? 1, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE appointment ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM callhistory WHERE SLNO=?', [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;