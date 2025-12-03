const express = require('express');
const router = express.Router();
const patientAdmitNurseVisitsController = require('../controllers/patientAdmitNurseVisitsController');

router.get('/', patientAdmitNurseVisitsController.getAllPatientAdmitNurseVisits);
router.get('/:id', patientAdmitNurseVisitsController.getPatientAdmitNurseVisitsById);
router.post('/', patientAdmitNurseVisitsController.createPatientAdmitNurseVisits);
router.put('/:id', patientAdmitNurseVisitsController.updatePatientAdmitNurseVisits);
router.delete('/:id', patientAdmitNurseVisitsController.deletePatientAdmitNurseVisits);

module.exports = router;

