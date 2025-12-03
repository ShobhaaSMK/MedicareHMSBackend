const express = require('express');
const router = express.Router();
const otslotController = require('../controllers/otslotController');

router.get('/by-ot/:otId', otslotController.getOTSlotsByOTId);
router.get('/', otslotController.getAllOTSlots);
router.get('/:id', otslotController.getOTSlotById);
router.post('/', otslotController.createOTSlot);
router.put('/:id', otslotController.updateOTSlot);
router.delete('/:id', otslotController.deleteOTSlot);

module.exports = router;

