const express = require('express');
const router = express.Router();
const otController = require('../controllers/otController');

/* GET /api/ot
Query params: ?status=String (optional), ?otType=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/', otController.getAllOTs);

/* GET /api/ot/by-otno/:otNo
Params: otNo (String)
Response: {
  success: Boolean,
  data: {
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/by-otno/:otNo', otController.getOTByNo);

/* GET /api/ot/by-type/:otType
Params: otType (String)
Response: {
  success: Boolean,
  count: Number,
  otType: String,
  data: [{
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/by-type/:otType', otController.getOTByType);

/* GET /api/ot/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/:id', otController.getOTById);

/* POST /api/ot
Request: {
  OTNo: String (required),
  OTType: String (optional),
  OTName: String (optional),
  OTDescription: String (optional),
  OTStartTimeofDay: String (optional),
  OTEndTimeofDay: String (optional),
  Status: String (optional), // "Active" | "InActive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.post('/', otController.createOT);

/* PUT /api/ot/:id
Params: id (Number)
Request: {
  OTNo: String (optional),
  OTType: String (optional),
  OTName: String (optional),
  OTDescription: String (optional),
  OTStartTimeofDay: String (optional),
  OTEndTimeofDay: String (optional),
  Status: String (optional), // "Active" | "InActive"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.put('/:id', otController.updateOT);

/* DELETE /api/ot/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    OTId: Number,
    OTNo: String,
    OTType: String | null,
    OTName: String | null,
    OTDescription: String | null,
    OTStartTimeofDay: String | null,
    OTEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.delete('/:id', otController.deleteOT);

module.exports = router;

