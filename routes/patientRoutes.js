const express = require('express');
const router  = express.Router();
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

// ⚠️ Specific routes MUST come before /:id
router.get('/check/mobile/:mobile', checkByMobile);
router.get('/check/name/:name',     checkByName);
router.get('/reg/:regNo',           getPatientByRegNo);

router.get('/',       getAllPatients);
router.get('/:id',    getPatientById);
router.post('/',      createPatient);
router.put('/:id',    updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;