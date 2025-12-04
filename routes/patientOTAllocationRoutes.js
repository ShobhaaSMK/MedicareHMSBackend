const express = require('express');
const router = express.Router();
const patientOTAllocationController = require('../controllers/patientOTAllocationController');

router.get('/count/today-scheduled', patientOTAllocationController.getTodayOTScheduledCount);
router.get('/count/today-scheduled-inprogress', patientOTAllocationController.getTodayOTScheduledAndInProgressCount);
router.get('/count/scheduled-inprogress', patientOTAllocationController.getOTScheduledAndInProgressCountByDate);
router.get('/', patientOTAllocationController.getAllPatientOTAllocations);
router.get('/:id', patientOTAllocationController.getPatientOTAllocationById);
router.post('/for-room-admission', patientOTAllocationController.createOTAllocationForRoomAdmission);
router.post('/', patientOTAllocationController.createPatientOTAllocation);
router.put('/:id', patientOTAllocationController.updatePatientOTAllocation);
router.delete('/:id', patientOTAllocationController.deletePatientOTAllocation);

module.exports = router;

