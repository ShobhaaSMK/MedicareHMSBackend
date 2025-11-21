const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

router.get('/', emergencyController.getAllEmergencyBeds);
router.get('/:id', emergencyController.getEmergencyBedById);
router.post('/', emergencyController.createEmergencyBed);
router.put('/:id', emergencyController.updateEmergencyBed);
router.delete('/:id', emergencyController.deleteEmergencyBed);

module.exports = router;

