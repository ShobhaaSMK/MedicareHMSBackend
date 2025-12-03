const express = require('express');
const router = express.Router();
const emergencyAdmissionController = require('../controllers/emergencyAdmissionController');

router.get('/', emergencyAdmissionController.getAllEmergencyAdmissions);
router.get('/by-date/:date', emergencyAdmissionController.getEmergencyAdmissionByDate);
router.get('/by-status/:status', emergencyAdmissionController.getEmergencyAdmissionByStatus);
router.get('/:id', emergencyAdmissionController.getEmergencyAdmissionById);
router.post('/', emergencyAdmissionController.createEmergencyAdmission);
router.put('/:id', emergencyAdmissionController.updateEmergencyAdmission);
router.delete('/:id', emergencyAdmissionController.deleteEmergencyAdmission);

module.exports = router;

