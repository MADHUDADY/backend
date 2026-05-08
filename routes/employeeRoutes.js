// const express = require('express');
// const router  = express.Router();
// const db      = require('../config/db');

// // ── GET all employees ────────────────────────────────────────────────────────
// router.get('/', async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       "SELECT Id, EMPID, EMPNAME, ACTIVE, ROLE, CENTERID, MOBILE, EMAILID, DEPARTMENT, GENDER, EMPTYPE, CENTERNAME FROM employees WHERE ACTIVE = 'Y'"
//     );
//     res.json({ success: true, data: rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ── LOGIN ─────────────────────────────────────────────────────────────────────
// router.post('/login', async (req, res) => {
//   try {
//     const { EMPID, PWD } = req.body;
//     if (!EMPID || !PWD)
//       return res.status(400).json({ success: false, message: 'EMPID and PWD required' });

//     const [rows] = await db.query(
//       "SELECT Id, EMPID, EMPNAME, ROLE, CENTERID FROM employees WHERE EMPID = ? AND PWD = ? AND ACTIVE = 'Y'",
//       [EMPID, PWD]
//     );
//     if (rows.length === 0)
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });

//     res.json({ success: true, message: 'Login successful', data: rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ── GET employee by ID ────────────────────────────────────────────────────────
// router.get('/:id', async (req, res) => {
//   try {
//     const [rows] = await db.query('SELECT * FROM employees WHERE Id = ?', [req.params.id]);
//     if (rows.length === 0)
//       return res.status(404).json({ success: false, message: 'Employee not found' });
//     res.json({ success: true, data: rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ── CREATE employee ───────────────────────────────────────────────────────────
// router.post('/', async (req, res) => {
//   try {
//     const { EMPID, EMPNAME, PWD, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER } = req.body;

//     if (!EMPID || !EMPNAME || !PWD)
//       return res.status(400).json({ success: false, message: 'EMPID, EMPNAME, PWD required' });

//     const [result] = await db.query(
//       `INSERT INTO employees (EMPID, EMPNAME, PWD, ROLE, ACTIVE, CENTERID, MOBILE, EMAILID, DEPARTMENT, GENDER, EMPTYPE, CREATEDDATE)
//        VALUES (?, ?, ?, ?, 'Y', '101', ?, ?, ?, ?, 'Permanent', NOW())`,
//       [EMPID, EMPNAME, PWD, ROLE || 'Staff', MOBILE || '', EMAILID || '', DEPARTMENT || '', GENDER || '']
//     );
//     res.status(201).json({ success: true, message: 'Employee created', id: result.insertId });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ── UPDATE employee ───────────────────────────────────────────────────────────
// router.put('/:id', async (req, res) => {
//   try {
//     const { EMPNAME, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER } = req.body;
//     const [result] = await db.query(
//       `UPDATE employees SET EMPNAME=?, ROLE=?, MOBILE=?, EMAILID=?, DEPARTMENT=?, GENDER=? WHERE Id=?`,
//       [EMPNAME, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER, req.params.id]
//     );
//     if (result.affectedRows === 0)
//       return res.status(404).json({ success: false, message: 'Employee not found' });
//     res.json({ success: true, message: 'Employee updated' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ── DELETE employee (soft) ────────────────────────────────────────────────────
// router.delete('/:id', async (req, res) => {
//   try {
//     const [result] = await db.query(
//       "UPDATE employees SET ACTIVE='N' WHERE Id=?", [req.params.id]
//     );
//     if (result.affectedRows === 0)
//       return res.status(404).json({ success: false, message: 'Employee not found' });
//     res.json({ success: true, message: 'Employee deleted' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// module.exports = router;
const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── GET all employees (protected) ────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT Id, EMPID, EMPNAME, ACTIVE, ROLE, CENTERID, MOBILE, EMAILID, DEPARTMENT, GENDER, EMPTYPE, CENTERNAME FROM employees WHERE ACTIVE = 'Y'"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
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

    // ── Generate JWT token ──────────────────────────────────────────────────
    const token = jwt.sign(
      { empId: user.EMPID, empName: user.EMPNAME, role: user.ROLE, centerId: user.CENTERID },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ success: true, message: 'Login successful', token, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET employee by ID (protected) ───────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE Id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CREATE employee (Admin only) ──────────────────────────────────────────────
router.post('/', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { EMPID, EMPNAME, PWD, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER } = req.body;

    if (!EMPID || !EMPNAME || !PWD)
      return res.status(400).json({ success: false, message: 'EMPID, EMPNAME, PWD required' });

    const [result] = await db.query(
      `INSERT INTO employees (EMPID, EMPNAME, PWD, ROLE, ACTIVE, CENTERID, MOBILE, EMAILID, DEPARTMENT, GENDER, EMPTYPE, CREATEDDATE)
       VALUES (?, ?, ?, ?, 'Y', '101', ?, ?, ?, ?, 'Permanent', NOW())`,
      [EMPID, EMPNAME, PWD, ROLE || 'Staff', MOBILE || '', EMAILID || '', DEPARTMENT || '', GENDER || '']
    );
    res.status(201).json({ success: true, message: 'Employee created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── UPDATE employee (Admin only) ──────────────────────────────────────────────
router.put('/:id', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { EMPNAME, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER } = req.body;
    const [result] = await db.query(
      `UPDATE employees SET EMPNAME=?, ROLE=?, MOBILE=?, EMAILID=?, DEPARTMENT=?, GENDER=? WHERE Id=?`,
      [EMPNAME, ROLE, MOBILE, EMAILID, DEPARTMENT, GENDER, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE employee - soft (Admin only) ───────────────────────────────────────
router.delete('/:id', verifyToken, requireRole('Admin'), async (req, res) => {
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