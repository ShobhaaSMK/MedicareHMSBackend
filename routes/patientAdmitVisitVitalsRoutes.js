const express = require('express');
const router = express.Router();
const patientAdmitVisitVitalsController = require('../controllers/patientAdmitVisitVitalsController');

/* GET /api/patient-admit-visit-vitals
Query Parameters:
  - status: String (optional) // "Active" | "Inactive"
  - vitalsStatus: String (optional)
  - patientId: String UUID (optional)
  - roomAdmissionId: Number (optional)
  - nurseId: Number (optional)
  - patientStatus: String (optional) // "Stable" | "Notstable"
  - dailyOrHourlyVitals: String (optional) // "Daily" | "Hourly" | "Daily Vitals" | "Hourly Vitals"
  - fromDate: String (optional) // ISO timestamp
  - toDate: String (optional) // ISO timestamp
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientAdmitVisitVitalsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    NurseId: Number | null,
    PatientStatus: String | null, // "Stable" | "Notstable"
    RecordedDateTime: Date,
    VisitRemarks: String | null,
    DailyOrHourlyVitals: String | null, // "Daily" | "Hourly"
    HeartRate: Number | null, // Integer
    BloodPressure: String | null,
    Temperature: Number | null, // Integer
    O2Saturation: Number | null, // Integer
    RespiratoryRate: Number | null, // Integer
    PulseRate: Number | null, // Integer
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String // "Active" | "Inactive"
  }>
} */
router.get('/', patientAdmitVisitVitalsController.getAllPatientAdmitVisitVitals);

/* GET /api/patient-admit-visit-vitals/room-admission/:roomAdmissionId
Path Parameters:
  - roomAdmissionId: Number (required)
Response: {
  success: Boolean,
  count: Number,
  roomAdmissionId: Number,
  data: Array<{
    PatientAdmitVisitVitalsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    NurseId: Number | null,
    PatientStatus: String | null, // "Stable" | "Notstable"
    RecordedDateTime: Date,
    VisitRemarks: String | null,
    DailyOrHourlyVitals: String | null, // "Daily" | "Hourly"
    HeartRate: Number | null, // Integer
    BloodPressure: String | null,
    Temperature: Number | null, // Integer
    O2Saturation: Number | null, // Integer
    RespiratoryRate: Number | null, // Integer
    PulseRate: Number | null, // Integer
    VitalsStatus: String | null,
    VitalsRemarks: String | null,
    VitalsCreatedBy: Number | null,
    VitalsCreatedAt: Date,
    Status: String // "Active" | "Inactive"
  }>
} */
router.get('/room-admission/:roomAdmissionId', patientAdmitVisitVitalsController.getPatientAdmitVisitVitalsByRoomAdmissionId);

/* GET /api/patient-admit-visit-vitals/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  data: {
    PatientAdmitVisitVitalsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    NurseId: Number | null,
    PatientStatus: String | null,
    RecordedDateTime: Date,
    VisitRemarks: String | null,
    DailyOrHourlyVitals: String | null,
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
router.get('/:id', patientAdmitVisitVitalsController.getPatientAdmitVisitVitalsById);

/* POST /api/patient-admit-visit-vitals
Request: {
  RoomAdmissionId: Number (optional),
  PatientId: String UUID (required),
  NurseId: Number (optional),
  PatientStatus: String (optional), // "Stable" | "Notstable"
  RecordedDateTime: String (required), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  VisitRemarks: String (optional),
  DailyOrHourlyVitals: String (optional), // "Daily" | "Hourly"
  HeartRate: Number (optional), // Integer
  BloodPressure: String (optional),
  Temperature: Number (optional), // Integer
  O2Saturation: Number (optional), // Integer
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
    PatientAdmitVisitVitalsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    NurseId: Number | null,
    PatientStatus: String | null,
    RecordedDateTime: Date,
    VisitRemarks: String | null,
    DailyOrHourlyVitals: String | null,
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
router.post('/', patientAdmitVisitVitalsController.createPatientAdmitVisitVitals);

/* PUT /api/patient-admit-visit-vitals/:id
Params: id (String - UUID)
Request: {
  RoomAdmissionId: Number (optional),
  PatientId: String UUID (optional),
  NurseId: Number (optional),
  PatientStatus: String (optional),
  RecordedDateTime: String (optional), // ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
  VisitRemarks: String (optional),
  DailyOrHourlyVitals: String (optional), // "Daily" | "Hourly"
  HeartRate: Number (optional), // Integer
  BloodPressure: String (optional),
  Temperature: Number (optional), // Integer
  O2Saturation: Number (optional), // Integer
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
    PatientAdmitVisitVitalsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    NurseId: Number | null,
    PatientStatus: String | null,
    RecordedDateTime: Date,
    VisitRemarks: String | null,
    DailyOrHourlyVitals: String | null,
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
router.put('/:id', patientAdmitVisitVitalsController.updatePatientAdmitVisitVitals);

/* DELETE /api/patient-admit-visit-vitals/:id
Params: id (String - UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitVisitVitalsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    NurseId: Number | null,
    PatientStatus: String | null,
    RecordedDateTime: Date,
    VisitRemarks: String | null,
    DailyOrHourlyVitals: String | null,
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
router.delete('/:id', patientAdmitVisitVitalsController.deletePatientAdmitVisitVitals);

module.exports = router;
