const express = require('express');
const router = express.Router();
const roomAdmissionController = require('../controllers/roomAdmissionController');

router.get('/count/today-ipd', roomAdmissionController.getTodayIPDAdmissionsCount);
router.get('/', roomAdmissionController.getAllRoomAdmissions);
router.get('/:id', roomAdmissionController.getRoomAdmissionById);
router.post('/', roomAdmissionController.createRoomAdmission);
router.put('/:id', roomAdmissionController.updateRoomAdmission);
router.delete('/:id', roomAdmissionController.deleteRoomAdmission);

module.exports = router;

