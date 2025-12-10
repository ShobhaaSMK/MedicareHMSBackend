const express = require('express');
const router = express.Router();
const icuNurseVisitVitalsController = require('../controllers/icuNurseVisitVitalsController');

/* GET /api/icu-nurse-visit-vitals
Query params: ?status=String (optional), ?vitalsStatus=String (optional), ?patientId=Number (optional), ?icuNurseVisitsId=String UUID (optional), ?fromDate=String (optional), ?toDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    ICUNurseVisitVitalsId: String (UUID),
    ICUNurseVisitsId: String (UUID),
    PatientId: Number,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }]
} */
router.get('/', icuNurseVisitVitalsController.getAllICUNurseVisitVitals);

/* GET /api/icu-nurse-visit-vitals/icu-nurse-visits/:icuNurseVisitsId
Path Parameters:
  - icuNurseVisitsId: String (UUID), (required)
Response: {
  success: Boolean,
  count: Number,
  icuNurseVisitsId: String (UUID),
  data: Array<{
    ICUNurseVisitVitalsId: String (UUID),
    ICUNurseVisitsId: String (UUID),
    PatientId: Number,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }>
} */
router.get('/icu-nurse-visits/:icuNurseVisitsId', icuNurseVisitVitalsController.getICUNurseVisitVitalsByICUNurseVisitsId);

/* GET /api/icu-nurse-visit-vitals/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  data: {
    ICUNurseVisitVitalsId: String (UUID),
    ICUNurseVisitsId: String (UUID),
    PatientId: Number,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.get('/:id', icuNurseVisitVitalsController.getICUNurseVisitVitalsById);

/* POST /api/icu-nurse-visit-vitals
Request: {
  ICUNurseVisitsId: String UUID (required),
  PatientId: Number (required),
  RecordedDateTime: String (required), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  HeartRate: Number (optional),
  BloodPressure: String (optional),
  Temperature: Number (optional),
  O2Saturation: Number (optional), // 0-100
  RespiratoryRate: Number (optional),
  PulseRate: Number (optional),
  VitalsStatus: String (optional),
  VitalsRemarks: String (optional),
  VitalsCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUNurseVisitVitalsId: String (UUID),
    ICUNurseVisitsId: String (UUID),
    PatientId: Number,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.post('/', icuNurseVisitVitalsController.createICUNurseVisitVitals);

/* PUT /api/icu-nurse-visit-vitals/:id
Params: id (String - UUID)
Request: {
  ICUNurseVisitsId: String UUID (optional),
  PatientId: Number (optional),
  RecordedDateTime: String (optional), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  HeartRate: Number (optional),
  BloodPressure: String (optional),
  Temperature: Number (optional),
  O2Saturation: Number (optional), // 0-100
  RespiratoryRate: Number (optional),
  PulseRate: Number (optional),
  VitalsStatus: String (optional),
  VitalsRemarks: String (optional),
  VitalsCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUNurseVisitVitalsId: String (UUID),
    ICUNurseVisitsId: String (UUID),
    PatientId: Number,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.put('/:id', icuNurseVisitVitalsController.updateICUNurseVisitVitals);

/* DELETE /api/icu-nurse-visit-vitals/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUNurseVisitVitalsId: String (UUID),
    ICUNurseVisitsId: String (UUID),
    PatientId: Number,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.delete('/:id', icuNurseVisitVitalsController.deleteICUNurseVisitVitals);

module.exports = router;

