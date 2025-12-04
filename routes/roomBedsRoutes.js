const express = require('express');
const router = express.Router();
const roomBedsController = require('../controllers/roomBedsController');

router.get('/count/active', roomBedsController.getActiveBedsCount);
router.get('/count/by-roomtype', roomBedsController.getIPDRoomCountsByType);
router.get('/', roomBedsController.getAllRoomBeds);
router.get('/by-bedno/:bedNo', roomBedsController.getRoomBedsByBedNo);
router.get('/by-category/:category', roomBedsController.getRoomBedsByCategory);
router.get('/by-roomtype/:roomType', roomBedsController.getRoomBedsByRoomType);
router.get('/:id', roomBedsController.getRoomBedsById);
router.post('/', roomBedsController.createRoomBeds);
router.put('/:id', roomBedsController.updateRoomBeds);
router.delete('/:id', roomBedsController.deleteRoomBeds);

module.exports = router;

