const express = require('express');
const router = express.Router();
const icuNurseVisitsController = require('../controllers/icuNurseVisitsController');

/* GET /api/icu-nurse-visits
Query params: ?status=String (optional), ?patientId=Number (optional), ?nurseId=Number (optional), ?icuAdmissionId=String UUID (optional), ?fromDate=String (optional), ?toDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    ICUNurseVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: Number,
    NurseId: Number,
    NurseVisitedDateTime: Date,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    NurseName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }]
} */
router.get('/', icuNurseVisitsController.getAllICUNurseVisits);

/* GET /api/icu-nurse-visits/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  data: {
    ICUNurseVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: Number,
    NurseId: Number,
    NurseVisitedDateTime: Date,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    NurseName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.get('/:id', icuNurseVisitsController.getICUNurseVisitsById);

/* POST /api/icu-nurse-visits
Request: {
  ICUAdmissionId: String UUID (required),
  PatientId: Number (required),
  NurseId: Number (required),
  NurseVisitedDateTime: String (required), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  NurseVisitsDetails: String (optional),
  PatientCondition: String (optional),
  VisitCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUNurseVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: Number,
    NurseId: Number,
    NurseVisitedDateTime: Date,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    NurseName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.post('/', icuNurseVisitsController.createICUNurseVisits);

/* PUT /api/icu-nurse-visits/:id
Params: id (String - UUID)
Request: {
  ICUAdmissionId: String UUID (optional),
  PatientId: Number (optional),
  NurseId: Number (optional),
  NurseVisitedDateTime: String (optional), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  NurseVisitsDetails: String (optional),
  PatientCondition: String (optional),
  VisitCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUNurseVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: Number,
    NurseId: Number,
    NurseVisitedDateTime: Date,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    NurseName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.put('/:id', icuNurseVisitsController.updateICUNurseVisits);

/* DELETE /api/icu-nurse-visits/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUNurseVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: Number,
    NurseId: Number,
    NurseVisitedDateTime: Date,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    NurseName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.delete('/:id', icuNurseVisitsController.deleteICUNurseVisits);

module.exports = router;

