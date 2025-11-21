const express = require('express');
const router = express.Router();
const icuMgmtController = require('../controllers/icuMgmtController');

router.get('/', icuMgmtController.getAllICUs);
router.get('/:id', icuMgmtController.getICUById);
router.post('/', icuMgmtController.createICU);
router.put('/:id', icuMgmtController.updateICU);
router.delete('/:id', icuMgmtController.deleteICU);

module.exports = router;

