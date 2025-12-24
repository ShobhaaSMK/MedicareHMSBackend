const express = require('express');
const router = express.Router();
const icuVisitVitalsController = require('../controllers/icuVisitVitalsController');

/* GET /api/icu-visit-vitals
Query params: ?status=String (optional), ?vitalsStatus=String (optional), ?patientId=String UUID (optional), ?icuAdmissionId=String UUID (optional), ?nurseId=Number (optional), ?fromDate=String (optional), ?toDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseName: String | null,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }]
} */
router.get('/', icuVisitVitalsController.getAllICUVisitVitals);

/* GET /api/icu-visit-vitals/icu-admission/:icuAdmissionId
Path Parameters:
  - icuAdmissionId: String (UUID), (required)
Response: {
  success: Boolean,
  count: Number,
  icuAdmissionId: String (UUID),
  data: Array<{
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseName: String | null,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }>
} */
router.get('/icu-admission/:icuAdmissionId', icuVisitVitalsController.getICUVisitVitalsByICUAdmissionId);

/* GET /api/icu-visit-vitals/icu-admission/:icuAdmissionId/latest
Path Parameters:
  - icuAdmissionId: String (UUID), (required)
Response: {
  success: Boolean,
  icuAdmissionId: String (UUID),
  data: {
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseId: Number,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.get('/icu-admission/:icuAdmissionId/latest', icuVisitVitalsController.getLatestICUVisitVitalsByICUAdmissionId);

/* GET /api/icu-visit-vitals/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  data: {
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseId: Number,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.get('/:id', icuVisitVitalsController.getICUVisitVitalsById);

/* POST /api/icu-visit-vitals
Request: {
  ICUAdmissionId: String UUID (required),
  PatientId: String UUID (required),
  NurseId: Number (optional),
  NurseVisitsDetails: String (optional),
  PatientCondition: String (optional),
  DailyOrHourlyVitals: String (optional), // "Daily" | "Hourly" | "Daily Vitals" | "Hourly Vitals"
  RecordedDateTime: String (required), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  HeartRate: Number (optional), // Integer
  BloodPressure: String (optional),
  Temperature: Number (optional), // Integer
  O2Saturation: Number (optional), // Integer
  BloodSugar: Number (optional),
  RespiratoryRate: Number (optional), // Integer
  PulseRate: Number (optional), // Integer
  VitalsStatus: String (optional),
  VitalsRemarks: String (optional),
  VitalsCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseId: Number,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.post('/', icuVisitVitalsController.createICUVisitVitals);

/* PUT /api/icu-visit-vitals/:id
Params: id (String - UUID)
Request: {
  ICUAdmissionId: String UUID (optional),
  PatientId: String UUID (optional),
  NurseId: Number (optional),
  NurseVisitsDetails: String (optional),
  PatientCondition: String (optional),
  RecordedDateTime: String (optional), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  HeartRate: Number (optional), // Integer
  BloodPressure: String (optional),
  Temperature: Number (optional), // Integer
  O2Saturation: Number (optional), // Integer
  BloodSugar: Number (optional),
  RespiratoryRate: Number (optional), // Integer
  PulseRate: Number (optional), // Integer
  VitalsStatus: String (optional),
  VitalsRemarks: String (optional),
  VitalsCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseId: Number,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.put('/:id', icuVisitVitalsController.updateICUVisitVitals);

/* DELETE /api/icu-visit-vitals/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    ICUVisitVitalsId: String (UUID),
    ICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    NurseId: Number,
    NurseVisitsDetails: String | null,
    PatientCondition: String | null,
    DailyOrHourlyVitals: String | null,
    RecordedDateTime: Date,
    HeartRate: Number | null,
    BloodPressure: String | null,
    Temperature: Number | null,
    O2Saturation: Number | null,
    BloodSugar: Number | null,
    RespiratoryRate: Number | null,
    PulseRate: Number | null,
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String
  }
} */
router.delete('/:id', icuVisitVitalsController.deleteICUVisitVitals);

module.exports = router;

