const express = require('express');
const router = express.Router();
const billEntityController = require('../controllers/billEntityController');

/* GET /api/bill-entities
Query params: ?status=String (optional), ?billEntity=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    BillEntityId: Number,
    BillEntity: String,
    EntityDescription: String | null,
    Status: String,
    BillEntityCreatedBy: Number | null,
    BillEntityCreatedAt: Date,
    CreatedByUserName: String | null
  }]
} */
router.get('/', billEntityController.getAllBillEntities);

/* GET /api/bill-entities/by-type/:billEntity
Params: billEntity (String)
Response: {
  success: Boolean,
  count: Number,
  billEntity: String,
  data: [{
    BillEntityId: Number,
    BillEntity: String,
    EntityDescription: String | null,
    Status: String,
    BillEntityCreatedBy: Number | null,
    BillEntityCreatedAt: Date,
    CreatedByUserName: String | null
  }]
} */
router.get('/by-type/:billEntity', billEntityController.getBillEntitiesByType);

/* POST /api/bill-entities
Request: {
  BillEntity: String (required), // "OPD_VISIT" | "LAB" | "IPD_ADMISSION" | "OT_CASE" | "ICU_STAY" | "PHARMACY"
  EntityDescription: String (optional),
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  BillEntityCreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillEntityId: Number,
    BillEntity: String,
    EntityDescription: String | null,
    Status: String,
    BillEntityCreatedBy: Number | null,
    BillEntityCreatedAt: Date,
    CreatedByUserName: String | null
  }
} */
router.post('/', billEntityController.createBillEntity);

/* GET /api/bill-entities/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    BillEntityId: Number,
    BillEntity: String,
    EntityDescription: String | null,
    Status: String,
    BillEntityCreatedBy: Number | null,
    BillEntityCreatedAt: Date,
    CreatedByUserName: String | null
  }
} */
router.get('/:id', billEntityController.getBillEntityById);

/* PUT /api/bill-entities/:id
Params: id (Number)
Request: {
  BillEntity: String (optional), // "OPD_VISIT" | "LAB" | "IPD_ADMISSION" | "OT_CASE" | "ICU_STAY" | "PHARMACY"
  EntityDescription: String (optional),
  Status: String (optional), // "Active" | "Inactive"
  BillEntityCreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillEntityId: Number,
    BillEntity: String,
    EntityDescription: String | null,
    Status: String,
    BillEntityCreatedBy: Number | null,
    BillEntityCreatedAt: Date,
    CreatedByUserName: String | null
  }
} */
router.put('/:id', billEntityController.updateBillEntity);

/* DELETE /api/bill-entities/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    BillEntityId: Number,
    BillEntity: String,
    EntityDescription: String | null,
    Status: String,
    BillEntityCreatedBy: Number | null,
    BillEntityCreatedAt: Date,
    CreatedByUserName: String | null
  }
} */
router.delete('/:id', billEntityController.deleteBillEntity);

module.exports = router;

