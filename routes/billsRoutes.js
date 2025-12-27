const express = require('express');
const router = express.Router();
const billsController = require('../controllers/billsController');

// Create a new bill /bills/
router.post('/', billsController.createBill);

// Get all bills with optional filters
router.get('/', billsController.getAllBills);

// Get bill by ID
router.get('/:id', billsController.getBillById);

// Update bill by ID
router.put('/:id', billsController.updateBill);

// Delete bill by ID
router.delete('/:id', billsController.deleteBill);

// Get bills by patient ID
router.get('/patient/:patientId', billsController.getBillsByPatientId);

// Get bills by bill type
router.get('/type/:billType', billsController.getBillsByType);

// Get bills by payment status
router.get('/status/:paidStatus', billsController.getBillsByPaymentStatus);

// Update payment status
router.patch('/:id/payment', billsController.updatePaymentStatus);

// Generate bill number
router.get('/generate/billno', billsController.generateBillNumber);

module.exports = router;
