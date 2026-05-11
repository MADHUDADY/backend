const db  = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

// GET clinic/company details
const getClinicDetails = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ID, COMPANYNAME, COMPANYADDRESS, COMPANYADDRESS2,
              COMPANYID, ACTIVE, KIOSKMESSAGE1, KIOSKMESSAGE2,
              PRINTLANGUAGE, BACKUPEXPIRY
       FROM companydetails WHERE ACTIVE = 'Y' LIMIT 1`
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Clinic details not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all categories
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM category WHERE ACTIVE = 'Y' ORDER BY CATEGORYID"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all services
const getAllServices = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM service WHERE ACTIVE = 'Y' ORDER BY SERVICEID"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all counters
const getAllCounters = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM counter WHERE ACTIVE = 'Y' ORDER BY COUNTERID"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all employees
const getAllEmployees = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT Id, EMPID, EMPNAME, ACTIVE, ROLE, CENTERID, MOBILE, EMAILID, DEPARTMENT FROM employees WHERE ACTIVE = 'Y'"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Employee Login — JWT token generate చేస్తుంది ──────────────────────────
const employeeLogin = async (req, res) => {
  try {
    const { EMPID, PWD } = req.body;

    const [rows] = await db.query(
      `SELECT Id, EMPID, EMPNAME, ROLE, CENTERID
       FROM employees
       WHERE EMPID = ? AND PWD = ? AND ACTIVE = 'Y'`,
      [EMPID, PWD]
    );

    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = rows[0];

    // ADMIN/Admin రెండూ normalize చేయి
    const normalizedRole = (user.ROLE === 'ADMIN') ? 'Admin' : user.ROLE;

    // JWT token sign చేయి
    const token = jwt.sign(
      {
        id:       user.Id,
        empId:    user.EMPID,
        empName:  user.EMPNAME,
        role:     normalizedRole,
        centerId: user.CENTERID,
      },
      SECRET,
      { expiresIn: EXPIRES }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        ...user,
        ROLE: normalizedRole,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE clinic details
const updateClinicDetails = async (req, res) => {
  try {
    const {
      COMPANYNAME, COMPANYADDRESS, COMPANYADDRESS2,
      KIOSKMESSAGE1, KIOSKMESSAGE2,
    } = req.body;

    const [result] = await db.query(
      `UPDATE companydetails
       SET COMPANYNAME=?, COMPANYADDRESS=?, COMPANYADDRESS2=?,
           KIOSKMESSAGE1=?, KIOSKMESSAGE2=?
       WHERE ID=?`,
      [COMPANYNAME, COMPANYADDRESS, COMPANYADDRESS2 || null,
       KIOSKMESSAGE1, KIOSKMESSAGE2, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    res.json({ success: true, message: 'Clinic details updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getClinicDetails,
  getAllCategories,
  getAllServices,
  getAllCounters,
  getAllEmployees,
  employeeLogin,
  updateClinicDetails,
};