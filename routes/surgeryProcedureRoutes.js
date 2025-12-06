const express = require('express');
const router = express.Router();
const surgeryProcedureController = require('../controllers/surgeryProcedureController');

/* GET /api/surgery-procedures
Query params: ?status=String (optional), ?surgeryType=String (optional), ?surgeryName=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    SurgeryId: Number,
    SurgeryType: String | null,
    SurgeryName: String,
    SurgeryDetails: String | null,
    PreSurgerySpecifications: String | null,
    PostSurgerySpecifications: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    CreatedByName: String | null
  }]
} */
router.get('/', surgeryProcedureController.getAllSurgeryProcedures);

/* GET /api/surgery-procedures/by-type/:surgeryType
Params: surgeryType (String)
Response: {
  success: Boolean,
  count: Number,
  surgeryType: String,
  data: [{
    SurgeryId: Number,
    SurgeryType: String | null,
    SurgeryName: String,
    SurgeryDetails: String | null,
    PreSurgerySpecifications: String | null,
    PostSurgerySpecifications: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    CreatedByName: String | null
  }]
} */
router.get('/by-type/:surgeryType', surgeryProcedureController.getSurgeryProceduresByType);

/* GET /api/surgery-procedures/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    SurgeryId: Number,
    SurgeryType: String | null,
    SurgeryName: String,
    SurgeryDetails: String | null,
    PreSurgerySpecifications: String | null,
    PostSurgerySpecifications: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    CreatedByName: String | null
  }
} */
router.get('/:id', surgeryProcedureController.getSurgeryProcedureById);

/* POST /api/surgery-procedures
Request: {
  SurgeryType: String (optional),
  SurgeryName: String (required),
  SurgeryDetails: String (optional),
  PreSurgerySpecifications: String (optional),
  PostSurgerySpecifications: String (optional),
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    SurgeryId: Number,
    SurgeryType: String | null,
    SurgeryName: String,
    SurgeryDetails: String | null,
    PreSurgerySpecifications: String | null,
    PostSurgerySpecifications: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    CreatedByName: String | null
  }
} */
router.post('/', surgeryProcedureController.createSurgeryProcedure);

/* PUT /api/surgery-procedures/:id
Params: id (Number)
Request: {
  SurgeryType: String (optional),
  SurgeryName: String (optional),
  SurgeryDetails: String (optional),
  PreSurgerySpecifications: String (optional),
  PostSurgerySpecifications: String (optional),
  Status: String (optional), // "Active" | "Inactive"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    SurgeryId: Number,
    SurgeryType: String | null,
    SurgeryName: String,
    SurgeryDetails: String | null,
    PreSurgerySpecifications: String | null,
    PostSurgerySpecifications: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    CreatedByName: String | null
  }
} */
router.put('/:id', surgeryProcedureController.updateSurgeryProcedure);

/* DELETE /api/surgery-procedures/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    SurgeryId: Number,
    SurgeryType: String | null,
    SurgeryName: String,
    SurgeryDetails: String | null,
    PreSurgerySpecifications: String | null,
    PostSurgerySpecifications: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    CreatedByName: String | null
  }
} */
router.delete('/:id', surgeryProcedureController.deleteSurgeryProcedure);

module.exports = router;

