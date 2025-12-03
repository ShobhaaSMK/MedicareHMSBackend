const express = require('express');
const router = express.Router();
const patientAdmitDoctorVisitsController = require('../controllers/patientAdmitDoctorVisitsController');

router.get('/', patientAdmitDoctorVisitsController.getAllPatientAdmitDoctorVisits);
router.get('/:id', patientAdmitDoctorVisitsController.getPatientAdmitDoctorVisitsById);
router.post('/', patientAdmitDoctorVisitsController.createPatientAdmitDoctorVisits);
router.put('/:id', patientAdmitDoctorVisitsController.updatePatientAdmitDoctorVisits);
router.delete('/:id', patientAdmitDoctorVisitsController.deletePatientAdmitDoctorVisits);

module.exports = router;

