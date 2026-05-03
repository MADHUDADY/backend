// backend/controllers/doctorController.js
const db   = require('../config/db');
const path = require('path');
const fs   = require('fs');

// ── Helper ────────────────────────────────────────────────────────────────────
const photoPath = (file) =>
  file ? `/uploads/doctors/${file.filename}` : null;

// ── GET all doctors ───────────────────────────────────────────────────────────
const getAllDoctors = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, cat.CATEGORYE AS DepartmentName
       FROM doctorservice d
       LEFT JOIN category cat ON d.CATEGORYID = cat.CATEGORYID
       WHERE d.ACTIVE = 'Y'
       ORDER BY d.SERVICEID DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET doctor by ID ──────────────────────────────────────────────────────────
const getDoctorById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, cat.CATEGORYE AS DepartmentName
       FROM doctorservice d
       LEFT JOIN category cat ON d.CATEGORYID = cat.CATEGORYID
       WHERE d.SERVICEID = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET doctors by category ───────────────────────────────────────────────────
const getDoctorsByCategory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM doctorservice
       WHERE CATEGORYID = ? AND ACTIVE = 'Y'
       ORDER BY SERVICE_E ASC`,
      [req.params.categoryId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET doctors by clinic + category ─────────────────────────────────────────
const getDoctorsByClinicAndCategory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM doctorservice
       WHERE CLINICID = ? AND CATEGORYID = ? AND ACTIVE = 'Y'
       ORDER BY SERVICE_E ASC`,
      [req.params.clinicId, req.params.categoryId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE doctor ─────────────────────────────────────────────────────────────
const createDoctor = async (req, res) => {
  try {
    const {
      SERVICE_E, SHORTNAME, CATEGORYID, ZONE, CLINICID,
      ROOMNAME, MEDSOFT_ID, MEDSOFT_NAME, PASSWORD,
      LANGUAGE, NATIONALITY, AGE, DOB,
      CONTACT, WHATSAPP, ADDRESS,
    } = req.body;

    // ── Required field checks ─────────────────────────────────────────────
    if (!SERVICE_E || !SERVICE_E.trim())
      return res.status(400).json({ success: false, message: 'Doctor name is required' });

    if (!CATEGORYID)
      return res.status(400).json({ success: false, message: 'Department is required' });

    if (!MEDSOFT_ID || !MEDSOFT_ID.trim())
      return res.status(400).json({ success: false, message: 'License number is required' });

    // ── ✅ LICENSE UNIQUE CHECK — globally unique across all clinics ───────
    const licenseNo = MEDSOFT_ID.trim();
    const [licenseCheck] = await db.query(
      `SELECT d.SERVICEID, d.SERVICE_E, d.CLINICID, c.COMPANYNAME
       FROM doctorservice d
       LEFT JOIN companydetails c ON d.CLINICID = c.COMPANYID
       WHERE d.MEDSOFT_ID = ? AND d.ACTIVE = 'Y'
       LIMIT 1`,
      [licenseNo]
    );

    if (licenseCheck.length > 0) {
      const existing = licenseCheck[0];
      return res.status(409).json({
        success:          false,
        isDuplicate:      true,
        message:          `License "${licenseNo}" is already registered to Dr. ${existing.SERVICE_E}. Each doctor has a unique license — cannot register again.`,
        existingDoctorId: existing.SERVICEID,
        existingClinicId: existing.CLINICID,
        existingClinicName: existing.COMPANYNAME || existing.CLINICID,
      });
    }
    // ── End license check ─────────────────────────────────────────────────

    const photo     = photoPath(req.file);
    const shortName = (SHORTNAME || SERVICE_E || '').substring(0, 5).trim();

    const [result] = await db.query(
      `INSERT INTO doctorservice
         (SERVICE_E, SHORTNAME, CATEGORYID, ZONE, CLINICID,
          ROOMNAME, MEDSOFT_ID, MEDSOFT_NAME, PASSWORD,
          LANGUAGE, NATIONALITY, AGE, DOB,
          CONTACT, WHATSAPP, ADDRESS,
          PHOTO,
          ACTIVE, WALKIN_ACTIVE, APPOINTMENT_ACTIVE, REPORT_ACTIVE,
          RECEPTIONCALL, RECEPTIONCALLBACK, CASHIERCALL,
          RECEPTIONTOCASHIER,
          TICKETSTART_W,  TICKETEND_W,  SERIES_W,
          TICKETSTART_APP,TICKETEND_APP,SERIES_APP,
          TICKETSTART_REP,TICKETEND_REP,SERIES_REP,
          TICKETSTART_EMERGENCY,TICKETEND_EMERGENCY,SERIES_EMERGENCY,
          TICKETSTART_MEDREP,TICKETEND_MEDREP,SERIES_MEDREP,
          TICKETSTART_FT, TICKETEND_FT, SERIES_FT,
          TICKETSTART_VIP,TICKETEND_VIP,SERIES_VIP,
          WALKINCALL, REPORTCALL, NEXTCALL,
          WALKINCOUNT, REPORTCOUNT,
          CALLTYPE, SERVICE_TYPE, TICKET_STATUS)
       VALUES
         (?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?,
          'Y','Y','Y','Y',
          'N','N','N',
          'N',
          1, 99, ?,
          1, 99, ?,
          1, 99, ?,
          1, 99, 'VP',
          1, 99, 'M',
          1, 99, 'FT',
          1, 99, 'VP',
          1,  1, 'R',
          0,  0,
          'N','T', 0)`,
      [
        SERVICE_E.trim(),
        shortName,
        CATEGORYID,
        ZONE         || '1',
        CLINICID     || '101',
        ROOMNAME     || '',
        licenseNo,
        MEDSOFT_NAME || '',
        PASSWORD     || '123',
        LANGUAGE     || null,
        NATIONALITY  || null,
        AGE          || null,
        DOB          || null,
        CONTACT      || null,
        WHATSAPP     || null,
        ADDRESS      || null,
        photo,
        // SERIES_W, SERIES_APP, SERIES_REP
        shortName,
        shortName,
        shortName,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      id:      result.insertId,
    });
  } catch (err) {
    console.error('createDoctor error:', err);
    // MySQL duplicate key error (DB-level catch as backup)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success:     false,
        isDuplicate: true,
        message:     `License number already exists in the system. Each doctor can only be registered once.`,
      });
    }
    res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
};

// ── UPDATE doctor ─────────────────────────────────────────────────────────────
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT * FROM doctorservice WHERE SERVICEID = ?', [id]
    );
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Doctor not found' });

    const old = existing[0];

    const {
      SERVICE_E, SHORTNAME, CATEGORYID, ZONE, CLINICID,
      ROOMNAME, MEDSOFT_ID, MEDSOFT_NAME, PASSWORD,
      LANGUAGE, NATIONALITY, AGE, DOB,
      CONTACT, WHATSAPP, ADDRESS,
    } = req.body;

    // ── ✅ LICENSE UNIQUE CHECK on update — skip if same doctor ──────────
    if (MEDSOFT_ID && MEDSOFT_ID.trim()) {
      const licenseNo = MEDSOFT_ID.trim();
      const [licenseCheck] = await db.query(
        `SELECT d.SERVICEID, d.SERVICE_E, d.CLINICID, c.COMPANYNAME
         FROM doctorservice d
         LEFT JOIN companydetails c ON d.CLINICID = c.COMPANYID
         WHERE d.MEDSOFT_ID = ? AND d.ACTIVE = 'Y' AND d.SERVICEID != ?
         LIMIT 1`,
        [licenseNo, id]  // ← SERVICEID != id means skip current doctor
      );

      if (licenseCheck.length > 0) {
        const dup = licenseCheck[0];
        return res.status(409).json({
          success:            false,
          isDuplicate:        true,
          message:            `License "${licenseNo}" is already registered to Dr. ${dup.SERVICE_E}. Cannot use the same license for another doctor.`,
          existingDoctorId:   dup.SERVICEID,
          existingClinicName: dup.COMPANYNAME || dup.CLINICID,
        });
      }
    }
    // ── End license check ─────────────────────────────────────────────────

    // Handle photo
    let photo = old.PHOTO;
    if (req.file) {
      photo = photoPath(req.file);
      if (old.PHOTO) {
        const oldFilePath = path.join(__dirname, '..', old.PHOTO);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
    }

    await db.query(
      `UPDATE doctorservice SET
         SERVICE_E    = ?,
         SHORTNAME    = ?,
         CATEGORYID   = ?,
         ZONE         = ?,
         CLINICID     = ?,
         ROOMNAME     = ?,
         MEDSOFT_ID   = ?,
         MEDSOFT_NAME = ?,
         PASSWORD     = ?,
         LANGUAGE     = ?,
         NATIONALITY  = ?,
         AGE          = ?,
         DOB          = ?,
         CONTACT      = ?,
         WHATSAPP     = ?,
         ADDRESS      = ?,
         PHOTO        = ?,
         RECEPTIONTOCASHIER = COALESCE(RECEPTIONTOCASHIER, 'N')
       WHERE SERVICEID = ?`,
      [
        (SERVICE_E   || old.SERVICE_E  ).trim(),
        (SHORTNAME   || old.SHORTNAME  || SERVICE_E || '').substring(0, 5),
        CATEGORYID   || old.CATEGORYID,
        ZONE         || old.ZONE       || '1',
        CLINICID     || old.CLINICID   || '101',
        ROOMNAME     !== undefined ? ROOMNAME    : old.ROOMNAME,
        (MEDSOFT_ID  || old.MEDSOFT_ID || '').trim(),
        MEDSOFT_NAME !== undefined ? MEDSOFT_NAME : old.MEDSOFT_NAME,
        PASSWORD     || old.PASSWORD   || '123',
        LANGUAGE     !== undefined ? LANGUAGE    : old.LANGUAGE,
        NATIONALITY  !== undefined ? NATIONALITY : old.NATIONALITY,
        AGE          !== undefined ? (AGE  || null) : old.AGE,
        DOB          !== undefined ? (DOB  || null) : old.DOB,
        CONTACT      !== undefined ? (CONTACT  || null) : old.CONTACT,
        WHATSAPP     !== undefined ? (WHATSAPP || null) : old.WHATSAPP,
        ADDRESS      !== undefined ? (ADDRESS  || null) : old.ADDRESS,
        photo,
        id,
      ]
    );

    res.json({ success: true, message: 'Doctor updated successfully' });
  } catch (err) {
    console.error('updateDoctor error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success:     false,
        isDuplicate: true,
        message:     'License number already exists. Each doctor can only be registered once.',
      });
    }
    res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
};

// ── DELETE doctor (soft delete) ───────────────────────────────────────────────
const deleteDoctor = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE doctorservice SET ACTIVE = 'N' WHERE SERVICEID = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorsByCategory,
  getDoctorsByClinicAndCategory,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};