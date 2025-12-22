const express = require('express');
const router = express.Router();
const billItemsController = require('../controllers/billItemsController');

/* GET /api/bill-items
Query Parameters:
  - status: String (optional) - 'Active' | 'Inactive'
  - billId: String (UUID) (optional)
  - itemCategory: String (optional) - 'Consultation' | 'Lab test' | 'Medicine' | 'Room Charges' | 'OT Charges' | 'ICU Charges' | 'Emergency' | 'Other'
  - createdBy: Number (optional)
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    BillItemsId: String (UUID),
    BillId: String (UUID) | null,
    ItemCategory: String | null,
    Quantity: Number,
    UnitPrice: Number,
    TotalPrice: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    BillNo: String | null,
    PatientId: String (UUID) | null,
    PatientName: String | null,
    PatientNo: String | null,
    CreatedByUserName: String | null
  }>
} */
router.get('/', billItemsController.getAllBillItems);

/* GET /api/bill-items/:id
Path Parameters:
  - id: String (UUID) (required) - BillItemsId
Response: {
  success: Boolean,
  data: {
    BillItemsId: String (UUID),
    BillId: String (UUID) | null,
    ItemCategory: String | null,
    Quantity: Number,
    UnitPrice: Number,
    TotalPrice: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    BillNo: String | null,
    PatientId: String (UUID) | null,
    PatientName: String | null,
    PatientNo: String | null,
    CreatedByUserName: String | null
  }
} */
router.get('/:id', billItemsController.getBillItemById);

/* GET /api/bill-items/by-bill/:billId
Path Parameters:
  - billId: String (UUID) (required) - BillId
Response: {
  success: Boolean,
  count: Number,
  billId: String (UUID),
  data: Array<{
    BillItemsId: String (UUID),
    BillId: String (UUID) | null,
    ItemCategory: String | null,
    Quantity: Number,
    UnitPrice: Number,
    TotalPrice: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    BillNo: String | null,
    PatientId: String (UUID) | null,
    PatientName: String | null,
    PatientNo: String | null,
    CreatedByUserName: String | null
  }>
} */
router.get('/by-bill/:billId', billItemsController.getBillItemsByBillId);

/* POST /api/bill-items
Request Body: {
  BillId: String (UUID) (required)
  ItemCategory: String (required) - 'Consultation' | 'Lab test' | 'Medicine' | 'Room Charges' | 'OT Charges' | 'ICU Charges' | 'Emergency' | 'Other'
  Quantity: Number (required)
  UnitPrice: Number (required)
  TotalPrice: Number (optional) - Auto-calculated as Quantity * UnitPrice if not provided
  Status: String (optional) - 'Active' | 'Inactive' (default: 'Active')
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillItemsId: String (UUID),
    BillId: String (UUID) | null,
    ItemCategory: String | null,
    Quantity: Number,
    UnitPrice: Number,
    TotalPrice: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    BillNo: String | null,
    PatientId: String (UUID) | null,
    PatientName: String | null,
    PatientNo: String | null,
    CreatedByUserName: String | null
  }
} */
router.post('/', billItemsController.createBillItem);

/* PUT /api/bill-items/:id
Path Parameters:
  - id: String (UUID) (required) - BillItemsId
Request Body: {
  BillId: String (UUID) (optional)
  ItemCategory: String (optional) - 'Consultation' | 'Lab test' | 'Medicine' | 'Room Charges' | 'OT Charges' | 'ICU Charges' | 'Emergency' | 'Other'
  Quantity: Number (optional)
  UnitPrice: Number (optional)
  TotalPrice: Number (optional) - Auto-calculated as Quantity * UnitPrice if not provided
  Status: String (optional) - 'Active' | 'Inactive'
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillItemsId: String (UUID),
    BillId: String (UUID) | null,
    ItemCategory: String | null,
    Quantity: Number,
    UnitPrice: Number,
    TotalPrice: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    BillNo: String | null,
    PatientId: String (UUID) | null,
    PatientName: String | null,
    PatientNo: String | null,
    CreatedByUserName: String | null
  }
} */
router.put('/:id', billItemsController.updateBillItem);

/* DELETE /api/bill-items/:id
Path Parameters:
  - id: String (UUID) (required) - BillItemsId
Response: {
  success: Boolean,
  message: String,
  data: {
    BillItemsId: String (UUID),
    BillId: String (UUID) | null,
    ItemCategory: String | null,
    Quantity: Number,
    UnitPrice: Number,
    TotalPrice: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.delete('/:id', billItemsController.deleteBillItem);

module.exports = router;

