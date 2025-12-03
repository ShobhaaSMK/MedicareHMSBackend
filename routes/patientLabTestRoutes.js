const express = require('express');
const router = express.Router();
const patientLabTestController = require('../controllers/patientLabTestController');

router.get('/count/test-status', patientLabTestController.getTestStatusWiseCounts);
router.get('/count/opd-ipd', patientLabTestController.getOPDIPDWiseCounts);
router.get('/count/labtest-wise', patientLabTestController.getLabTestWiseCounts);
router.get('/count/doctor-wise', patientLabTestController.getDoctorWiseCounts);
router.get('/with-details', patientLabTestController.getPatientLabTestsWithDetails);
router.get('/', patientLabTestController.getAllPatientLabTests);
router.get('/:id', patientLabTestController.getPatientLabTestById);
router.post('/', patientLabTestController.createPatientLabTest);
router.put('/:id', patientLabTestController.updatePatientLabTest);
router.delete('/:id', patientLabTestController.deletePatientLabTest);

module.exports = router;

