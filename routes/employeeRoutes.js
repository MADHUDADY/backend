const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── LOGIN — public route (token అవసరం లేదు) ──────────────────────────────────
// Note: Main login /api/clinic/login లో handle అవుతోంది
// ఇది /api/employees/login కోసం — రెండూ పని చేస్తాయి
router.post('/login', async (req, res) => {
  try {
    const { EMPID, PWD } = req.body;
    if (!EMPID || !PWD)
      return res.status(400).json({ success: false, message: 'EMPID and PWD required' });

    const [rows] = await db.query(
      "SELECT Id, EMPID, EMPNAME, ROLE, CENTERID FROM employees WHERE EMPID = ? AND PWD = ? AND ACTIVE = 'Y'",
      [EMPID, PWD]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = rows[0];

    // ADMIN normalize చేయి
    const normalizedRole = (user.ROLE === 'ADMIN') ? 'Admin' : user.ROLE;

    const jwt    = require('jsonwebtoken');
    const token  = jwt.sign(
      {
        id:       user.Id,
        empId:    user.EMPID,
        empName:  user.EMPNAME,
        role:     normalizedRole,
        centerId: user.CENTERID,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: { ...user, ROLE: normalizedRole },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ఇక్కడ నుండి అన్నీ login అవసరం ───────────────────────────────────────────
router.use(verifyToken);

// ── GET all employees — Admin మాత్రమే ────────────────────────────────────────
router.get('/', requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT Id, EMPID, EMPNAME, ACTIVE, ROLE, CENTERID, MOBILE, EMAILID, DEPARTMENT, GENDER, EMPTYPE, CENTERNAME FROM employees WHERE ACTIVE = 'Y'"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET employee by ID — Admin మాత్రమే ───────────────────────────────────────
router.get('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE Id = ?', [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CREATE employee — Admin మాత్రమే ──────────────────────────────────────────
router.post('/', requireRole('Admin'), async (req, res) => {
  try {
    const { EMPID, EMPNAME, PWD, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER } = req.body;

    if (!EMPID || !EMPNAME || !PWD)
      return res.status(400).json({ success: false, message: 'EMPID, EMPNAME, PWD required' });

    const [result] = await db.query(
      `INSERT INTO employees
       (EMPID, EMPNAME, PWD, ROLE, ACTIVE, CENTERID,
        MOBILE, EMAILID, DEPARTMENT, GENDER, EMPTYPE, CREATEDDATE)
       VALUES (?, ?, ?, ?, 'Y', '101', ?, ?, ?, ?, 'Permanent', NOW())`,
      [EMPID, EMPNAME, PWD, ROLE || 'Staff',
       MOBILE || '', EMAILID || '', DEPARTMENT || '', GENDER || '']
    );
    res.status(201).json({ success: true, message: 'Employee created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── UPDATE employee — Admin మాత్రమే ──────────────────────────────────────────
router.put('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const { EMPNAME, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER } = req.body;
    const [result] = await db.query(
      `UPDATE employees
       SET EMPNAME=?, ROLE=?, MOBILE=?, EMAILID=?, DEPARTMENT=?, GENDER=?
       WHERE Id=?`,
      [EMPNAME, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE employee soft — Admin మాత్రమే ─────────────────────────────────────
router.delete('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE employees SET ACTIVE='N' WHERE Id=?", [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;