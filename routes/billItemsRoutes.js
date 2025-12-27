const express = require('express');
const router = express.Router();
const billItemsController = require('../controllers/billItemsController');

// Create a new bill item
router.post('/', billItemsController.createBillItem);

// Get all bill items with optional filters
router.get('/', billItemsController.getAllBillItems);

// Get bill item by ID
router.get('/:id', billItemsController.getBillItemById);

// Update bill item by ID
router.put('/:id', billItemsController.updateBillItem);

// Delete bill item by ID (soft delete)
router.delete('/:id', billItemsController.deleteBillItem);

// Get bill items by bill ID
router.get('/bill/:billId', billItemsController.getBillItemsByBillId);

// Get bill items by item category
router.get('/category/:itemCategory', billItemsController.getBillItemsByCategory);

// Get bill items by status
router.get('/status/:status', billItemsController.getBillItemsByStatus);

// Bulk create bill items for a bill
router.post('/bulk/:billId', billItemsController.bulkCreateBillItems);

// Update total price for a bill (recalculate from items)
router.patch('/bill/:billId/recalculate', billItemsController.recalculateBillTotal);

module.exports = router;
