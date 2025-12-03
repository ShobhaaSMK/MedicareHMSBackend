const express = require('express');
const router = express.Router();
const billEntityController = require('../controllers/billEntityController');

router.get('/', billEntityController.getAllBillEntities);
router.get('/by-type/:billEntity', billEntityController.getBillEntitiesByType);
router.post('/', billEntityController.createBillEntity);
router.get('/:id', billEntityController.getBillEntityById);
router.put('/:id', billEntityController.updateBillEntity);
router.delete('/:id', billEntityController.deleteBillEntity);

module.exports = router;

