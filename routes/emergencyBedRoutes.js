const express = require('express');
const router = express.Router();
const emergencyBedController = require('../controllers/emergencyBedController');

router.get('/', emergencyBedController.getAllEmergencyBeds);
router.get('/by-bedno/:bedNo', emergencyBedController.getEmergencyBedByBedNo);
router.get('/:id', emergencyBedController.getEmergencyBedById);
router.post('/', emergencyBedController.createEmergencyBed);
router.put('/:id', emergencyBedController.updateEmergencyBed);
router.delete('/:id', emergencyBedController.deleteEmergencyBed);

module.exports = router;

