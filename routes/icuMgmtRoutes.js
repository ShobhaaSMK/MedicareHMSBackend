const express = require('express');
const router = express.Router();
const icuController = require('../controllers/icuController');

router.get('/', icuController.getAllICUs);
router.get('/by-bedno/:bedNo', icuController.getICUByBedNo);
router.get('/:id', icuController.getICUById);
router.post('/', icuController.createICU);
router.put('/:id', icuController.updateICU);
router.delete('/:id', icuController.deleteICU);

module.exports = router;

