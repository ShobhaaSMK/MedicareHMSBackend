const express = require('express');
const router = express.Router();
const icuDoctorVisitsController = require('../controllers/icuDoctorVisitsController');

/* GET /api/icu-doctor-visits
Query params: ?status=String (optional), ?patientId=String UUID (optional), ?doctorId=Number (optional), ?icuAdmissionId=String UUID (optional), ?fromDate=String (optional), ?toDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    ICUDoctorVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }]
} */
router.get('/', icuDoctorVisitsController.getAllICUDoctorVisits);

/* GET /api/icu-doctor-visits/icu-admission/:icuAdmissionId
Path Parameters:
  - icuAdmissionId: String (UUID), (required)
Response: {
  success: Boolean,
  count: Number,
  icuAdmissionId: String (UUID),
  data: Array<{
    ICUDoctorVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }>
} */
router.get('/icu-admission/:icuAdmissionId', icuDoctorVisitsController.getICUDoctorVisitsByICUAdmissionId);

/* GET /api/icu-doctor-visits/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  data: {
    ICUDoctorVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.get('/:id', icuDoctorVisitsController.getICUDoctorVisitsById);

/* POST /api/icu-doctor-visits
Request: {
  ICUAdmissionId: String UUID (required),
  PatientId: String UUID (required),
  DoctorId: Number (required),
  DoctorVisitedDateTime: String (required), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  VisitsDetails: String (optional),
  PatientCondition: String (optional),
  VisitCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUDoctorVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.post('/', icuDoctorVisitsController.createICUDoctorVisits);

/* PUT /api/icu-doctor-visits/:id
Params: id (String - UUID)
Request: {
  ICUAdmissionId: String UUID (optional),
  PatientId: String UUID (optional),
  DoctorId: Number (optional),
  DoctorVisitedDateTime: String (optional), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  VisitsDetails: String (optional),
  PatientCondition: String (optional),
  VisitCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUDoctorVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.put('/:id', icuDoctorVisitsController.updateICUDoctorVisits);

/* DELETE /api/icu-doctor-visits/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUDoctorVisitsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsDetails: String | null,
    PatientCondition: String | null,
    Status: String,
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    ICUNo: String | null,
    CreatedByName: String | null
  }
} */
router.delete('/:id', icuDoctorVisitsController.deleteICUDoctorVisits);

module.exports = router;

