const express = require('express');
const router = express.Router();
const emergencyAdmissionVitalsController = require('../controllers/emergencyAdmissionVitalsController');

router.get('/', emergencyAdmissionVitalsController.getAllEmergencyAdmissionVitals);
router.get('/by-emergency-admission/:emergencyAdmissionId', emergencyAdmissionVitalsController.getEmergencyAdmissionVitalsByEmergencyAdmissionId);
router.get('/:id', emergencyAdmissionVitalsController.getEmergencyAdmissionVitalsById);
router.post('/', emergencyAdmissionVitalsController.createEmergencyAdmissionVitals);
router.put('/:id', emergencyAdmissionVitalsController.updateEmergencyAdmissionVitals);
router.delete('/:id', emergencyAdmissionVitalsController.deleteEmergencyAdmissionVitals);

module.exports = router;

