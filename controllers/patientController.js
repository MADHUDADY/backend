const db = require('../config/db');

const getAllPatients = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM hispatientdetails WHERE Active = 'Y' ORDER BY SLNO DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM hispatientdetails WHERE SLNO = ?', [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPatientByRegNo = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM hispatientdetails WHERE RegNo = ? AND Active = 'Y'",
      [req.params.regNo]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const checkByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM hispatientdetails WHERE Mobile = ? AND Active = 'Y' LIMIT 1",
      [mobile]
    );
    if (rows.length > 0)
      return res.json({ success: true, exists: true, data: rows[0] });
    res.json({ success: true, exists: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const checkByName = async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM hispatientdetails WHERE PatientName LIKE ? AND Active = 'Y' LIMIT 1",
      [`%${name}%`]
    );
    if (rows.length > 0)
      return res.json({ success: true, exists: true, data: rows[0] });
    res.json({ success: true, exists: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE patient — duplicate unte existing return cheyyi ────────────────────
const createPatient = async (req, res) => {
  try {
    const {
      PatientName, Age, DOB, Gender, Mobile, Address, Email,
      RegNo, VisitDate, ClinicId, ClinicName, TicketNumber
    } = req.body;

    if (!PatientName)
      return res.status(400).json({ success: false, message: 'PatientName is required' });
    if (!Mobile)
      return res.status(400).json({ success: false, message: 'Mobile is required' });

    // ✅ Duplicate check — existing patient unte return cheyyi (409 kadu!)
    const [existing] = await db.query(
      "SELECT SLNO, PatientName, Mobile, Gender, Age FROM hispatientdetails WHERE Mobile = ? AND Active = 'Y' LIMIT 1",
      [Mobile]
    );
    if (existing.length > 0)
      return res.status(200).json({
        success:  true,
        message:  'Patient already exists',
        id:       existing[0].SLNO,
        data:     existing[0],
        existing: true,
      });

    const visitDate = VisitDate || new Date().toISOString().slice(0, 10);

    const [result] = await db.query(
      `INSERT INTO hispatientdetails
       (PatientName, Age, DOB, Gender, Mobile, Address, Email,
        RegNo, VisitDate, ClinicId, ClinicName, TicketNumber, TicketTime, Active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Y')`,
      [
        PatientName, Age||null, DOB||null, Gender||'', Mobile,
        Address||'', Email||'', RegNo||'', visitDate,
        ClinicId||'101', ClinicName||'', TicketNumber||''
      ]
    );
    res.status(201).json({ success: true, message: 'Patient created', id: result.insertId, existing: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { PatientName, Age, DOB, Gender, Mobile, Address, Email, RegNo, VisitDate } = req.body;
    const visitDate = VisitDate || new Date().toISOString().slice(0, 10);
    const [result] = await db.query(
      `UPDATE hispatientdetails
       SET PatientName=?, Age=?, DOB=?, Gender=?, Mobile=?, Address=?, Email=?, RegNo=?, VisitDate=?
       WHERE SLNO=?`,
      [PatientName, Age||null, DOB||null, Gender, Mobile, Address, Email, RegNo, visitDate, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE hispatientdetails SET Active='N' WHERE SLNO=?", [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllPatients, getPatientById, getPatientByRegNo,
  checkByMobile, checkByName, createPatient, updatePatient, deletePatient
};