const express = require('express');
const router = express.Router();
const patientAdmitVisitVitalsController = require('../controllers/patientAdmitVisitVitalsController');

router.get('/', patientAdmitVisitVitalsController.getAllPatientAdmitVisitVitals);
router.get('/:id', patientAdmitVisitVitalsController.getPatientAdmitVisitVitalsById);
router.post('/', patientAdmitVisitVitalsController.createPatientAdmitVisitVitals);
router.put('/:id', patientAdmitVisitVitalsController.updatePatientAdmitVisitVitals);
router.delete('/:id', patientAdmitVisitVitalsController.deletePatientAdmitVisitVitals);

module.exports = router;

