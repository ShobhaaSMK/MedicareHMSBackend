const express = require('express');
const router = express.Router();
const patientICUAdmissionController = require('../controllers/patientICUAdmissionController');

router.get('/', patientICUAdmissionController.getAllPatientICUAdmissions);
router.get('/:id', patientICUAdmissionController.getPatientICUAdmissionById);
router.post('/', patientICUAdmissionController.createPatientICUAdmission);
router.put('/:id', patientICUAdmissionController.updatePatientICUAdmission);
router.delete('/:id', patientICUAdmissionController.deletePatientICUAdmission);

module.exports = router;

