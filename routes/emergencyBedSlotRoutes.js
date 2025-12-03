const express = require('express');
const router = express.Router();
const emergencyBedSlotController = require('../controllers/emergencyBedSlotController');

router.get('/', emergencyBedSlotController.getAllEmergencyBedSlots);
router.get('/by-emergency-bed/:emergencyBedId', emergencyBedSlotController.getEmergencyBedSlotsByEmergencyBedId);
router.get('/:id', emergencyBedSlotController.getEmergencyBedSlotById);
router.post('/', emergencyBedSlotController.createEmergencyBedSlot);
router.put('/:id', emergencyBedSlotController.updateEmergencyBedSlot);
router.delete('/:id', emergencyBedSlotController.deleteEmergencyBedSlot);

module.exports = router;

