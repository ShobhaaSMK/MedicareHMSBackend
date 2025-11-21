const express = require('express');
const router = express.Router();
const admissionRoomController = require('../controllers/admissionRoomController');

router.get('/', admissionRoomController.getAllRooms);
router.get('/:id', admissionRoomController.getRoomById);
router.post('/', admissionRoomController.createRoom);
router.put('/:id', admissionRoomController.updateRoom);
router.delete('/:id', admissionRoomController.deleteRoom);

module.exports = router;

