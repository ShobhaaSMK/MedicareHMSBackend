const express = require('express');
const router = express.Router();
const billsController = require('../controllers/billsController');

router.get('/', billsController.getAllBills);
router.get('/by-billno/:billNo', billsController.getBillByBillNo);
router.get('/by-patient/:patientId', billsController.getBillsByPatientId);
router.get('/:id', billsController.getBillById);
router.post('/', billsController.createBill);
router.put('/:id', billsController.updateBill);
router.delete('/:id', billsController.deleteBill);

module.exports = router;

