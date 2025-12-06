const express = require('express');
const router = express.Router();
const patientAdmitVisitVitalsController = require('../controllers/patientAdmitVisitVitalsController');

/* GET /api/patient-admit-visit-vitals
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - vitalsStatus: String | null,
  - patientId: Number | null,
  - patientAdmitNurseVisitsId: String (UUID) | null,
  - fromDate: String (timestamp) | null,
  - toDate: String (timestamp) | null,
  - dailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientAdmitVisitVitalsId: String (UUID),
    PatientAdmitNurseVisitsId: String (UUID),
    PatientId: String (UUID),
    RecordedDateTime: Date,
    DailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
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
    Status: String, // "Active" | "Inactive"
  }>
} */
router.get('/', patientAdmitVisitVitalsController.getAllPatientAdmitVisitVitals);

/* GET /api/patient-admit-visit-vitals/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  data: {
    PatientAdmitVisitVitalsId: String (UUID),
    PatientAdmitNurseVisitsId: String (UUID),
    PatientId: String (UUID),
    RecordedDateTime: Date,
    DailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
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
    Status: String, // "Active" | "Inactive"
  }
} */
router.get('/:id', patientAdmitVisitVitalsController.getPatientAdmitVisitVitalsById);

/* POST /api/patient-admit-visit-vitals
Request: {
  PatientAdmitNurseVisitsId: String (UUID), (required)
  PatientId: String (UUID), (required)
  RecordedDateTime: String (timestamp), (required)
  DailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
  HeartRate: Number | null,
  BloodPressure: String | null,
  Temperature: Number | null,
  O2Saturation: Number | null,
  RespiratoryRate: Number | null,
  PulseRate: Number | null,
  VitalsStatus: String | null,
  VitalsRemarks: String | null,
  VitalsCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitVisitVitalsId: String (UUID),
    PatientAdmitNurseVisitsId: String (UUID),
    PatientId: String (UUID),
    RecordedDateTime: Date,
    DailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
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
    Status: String, // "Active" | "Inactive"
  }
} */
router.post('/', patientAdmitVisitVitalsController.createPatientAdmitVisitVitals);

/* PUT /api/patient-admit-visit-vitals/:id
Path Parameters:
  - id: String (UUID), (required)
Request: {
  PatientAdmitNurseVisitsId: String (UUID),
  PatientId: String (UUID),
  RecordedDateTime: String (timestamp),
  DailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
  HeartRate: Number | null,
  BloodPressure: String | null,
  Temperature: Number | null,
  O2Saturation: Number | null,
  RespiratoryRate: Number | null,
  PulseRate: Number | null,
  VitalsStatus: String | null,
  VitalsRemarks: String | null,
  VitalsCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitVisitVitalsId: String (UUID),
    PatientAdmitNurseVisitsId: String (UUID),
    PatientId: String (UUID),
    RecordedDateTime: Date,
    DailyOrHourlyVitals: String | null, // "Daily Vitals" | "Hourly Vitals"
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
    Status: String, // "Active" | "Inactive"
  }
} */
router.put('/:id', patientAdmitVisitVitalsController.updatePatientAdmitVisitVitals);

/* DELETE /api/patient-admit-visit-vitals/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', patientAdmitVisitVitalsController.deletePatientAdmitVisitVitals);

module.exports = router;

