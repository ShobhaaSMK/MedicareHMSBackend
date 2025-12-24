const express = require('express');
const router = express.Router();
const icuController = require('../controllers/icuController');

/* GET /api/icu
Query params: ?status=String (optional), ?icuType=String (optional), ?isVentilatorAttached=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    ICUId: Number,
    ICUBedNo: String,
    ICUType: String | null,
    ICURoomNameNo: String | null,
    ICUDescription: String | null,
    IsVentilatorAttached: String,
    ICUStartTimeofDay: String | null,
    ICUEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/', icuController.getAllICUs);

/* GET /api/icu/by-bedno/:bedNo
Params: bedNo (String)
Response: {
  success: Boolean,
  data: {
    ICUId: Number,
    ICUBedNo: String,
    ICUType: String | null,
    ICURoomNameNo: String | null,
    ICUDescription: String | null,
    IsVentilatorAttached: String,
    ICUStartTimeofDay: String | null,
    ICUEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/by-bedno/:bedNo', icuController.getICUByBedNo);

/* GET /api/icu/active-count
Response: {
  success: Boolean,
  count: Number,
  message: String
} */
router.get('/active-count', icuController.getActiveICUBedsCount);

/* GET /api/icu/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    ICUId: Number,
    ICUBedNo: String,
    ICUType: String | null,
    ICURoomNameNo: String | null,
    ICUDescription: String | null,
    IsVentilatorAttached: String,
    ICUStartTimeofDay: String | null,
    ICUEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/:id', icuController.getICUById);

/* POST /api/icu
Request: {
  ICUBedNo: String (required),
  ICUType: String (optional),
  ICURoomNameNo: String (optional),
  ICUDescription: String (optional),
  IsVentilatorAttached: String (required), // "Yes" | "No"
  ICUStartTimeofDay: String (optional),
  ICUEndTimeofDay: String (optional),
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUId: Number,
    ICUBedNo: String,
    ICUType: String | null,
    ICURoomNameNo: String | null,
    ICUDescription: String | null,
    IsVentilatorAttached: String,
    ICUStartTimeofDay: String | null,
    ICUEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.post('/', icuController.createICU);

/* PUT /api/icu/:id
Params: id (Number)
Request: {
  ICUBedNo: String (optional),
  ICUType: String (optional),
  ICURoomNameNo: String (optional),
  ICUDescription: String (optional),
  IsVentilatorAttached: String (optional), // "Yes" | "No"
  ICUStartTimeofDay: String (optional),
  ICUEndTimeofDay: String (optional),
  Status: String (optional), // "Active" | "Inactive"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUId: Number,
    ICUBedNo: String,
    ICUType: String | null,
    ICURoomNameNo: String | null,
    ICUDescription: String | null,
    IsVentilatorAttached: String,
    ICUStartTimeofDay: String | null,
    ICUEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.put('/:id', icuController.updateICU);

/* DELETE /api/icu/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUId: Number,
    ICUBedNo: String,
    ICUType: String | null,
    ICURoomNameNo: String | null,
    ICUDescription: String | null,
    IsVentilatorAttached: String,
    ICUStartTimeofDay: String | null,
    ICUEndTimeofDay: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.delete('/:id', icuController.deleteICU);

module.exports = router;

