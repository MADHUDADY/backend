const express = require('express');
const router  = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth');

const {
  getAllPatients,
  getPatientById,
  getPatientByRegNo,
  checkByMobile,
  checkByName,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

// ── అన్ని routes కి login అవసరం ──────────────────────────────────────────────
router.use(verifyToken);

// ── Specific routes — /:id కంటే ముందు ఉండాలి ────────────────────────────────

// Mobile/Name check — Staff + Reception కూడా చేయవచ్చు (Appointment లో కావాలి)
router.get('/check/mobile/:mobile', checkByMobile);
router.get('/check/name/:name',     checkByName);
router.get('/reg/:regNo',           getPatientByRegNo);

// GET — అందరూ చూడవచ్చు
router.get('/',    getAllPatients);
router.get('/:id', getPatientById);

// CREATE — Admin + Staff + Reception చేయవచ్చు
router.post('/', requireRole('Admin', 'Staff', 'Reception', 'Call Centre'), createPatient);

// UPDATE — Admin + Staff + Reception చేయవచ్చు
router.put('/:id', requireRole('Admin', 'Staff', 'Reception', 'Call Centre'), updatePatient);

// DELETE — Admin మాత్రమే
router.delete('/:id', requireRole('Admin'), deletePatient);

module.exports = router;