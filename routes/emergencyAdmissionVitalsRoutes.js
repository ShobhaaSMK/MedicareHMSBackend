const express = require('express');
const router = express.Router();
const emergencyAdmissionVitalsController = require('../controllers/emergencyAdmissionVitalsController');

/* GET /api/emergency-admission-vitals
Query params: ?status=String (optional), ?emergencyAdmissionId=Number (optional), ?nurseId=Number (optional), ?vitalsStatus=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    EmergencyAdmissionVitalsId: Number,
    EmergencyAdmissionId: Number,
    NurseId: Number,
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
router.get('/', emergencyAdmissionVitalsController.getAllEmergencyAdmissionVitals);

/* GET /api/emergency-admission-vitals/by-emergency-admission/:emergencyAdmissionId
Params: emergencyAdmissionId (Number)
Response: {
  success: Boolean,
  count: Number,
  emergencyAdmissionId: Number,
  data: [{
    EmergencyAdmissionVitalsId: Number,
    EmergencyAdmissionId: Number,
    NurseId: Number,
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
router.get('/by-emergency-admission/:emergencyAdmissionId', emergencyAdmissionVitalsController.getEmergencyAdmissionVitalsByEmergencyAdmissionId);

/* GET /api/emergency-admission-vitals/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    EmergencyAdmissionVitalsId: Number,
    EmergencyAdmissionId: Number,
    NurseId: Number,
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
router.get('/:id', emergencyAdmissionVitalsController.getEmergencyAdmissionVitalsById);

/* POST /api/emergency-admission-vitals
Request: {
  EmergencyAdmissionId: Number (required),
  NurseId: Number (required),
  RecordedDateTime: String (required), // YYYY-MM-DD HH:MM:SS format
  HeartRate: Number (optional),
  BloodPressure: String (optional),
  Temperature: Number (optional),
  O2Saturation: Number (optional), // 0-100
  RespiratoryRate: Number (optional),
  PulseRate: Number (optional),
  VitalsStatus: String (optional), // "Stable" | "Critical" | "Improving"
  VitalsRemarks: String (optional),
  VitalsCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyAdmissionVitalsId: Number,
    EmergencyAdmissionId: Number,
    NurseId: Number,
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
router.post('/', emergencyAdmissionVitalsController.createEmergencyAdmissionVitals);

/* PUT /api/emergency-admission-vitals/:id
Params: id (Number)
Request: {
  EmergencyAdmissionId: Number (optional),
  NurseId: Number (optional),
  RecordedDateTime: String (optional), // YYYY-MM-DD HH:MM:SS format
  HeartRate: Number (optional),
  BloodPressure: String (optional),
  Temperature: Number (optional),
  O2Saturation: Number (optional), // 0-100
  RespiratoryRate: Number (optional),
  PulseRate: Number (optional),
  VitalsStatus: String (optional), // "Stable" | "Critical" | "Improving"
  VitalsRemarks: String (optional),
  VitalsCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyAdmissionVitalsId: Number,
    EmergencyAdmissionId: Number,
    NurseId: Number,
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
router.put('/:id', emergencyAdmissionVitalsController.updateEmergencyAdmissionVitals);

/* DELETE /api/emergency-admission-vitals/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyAdmissionVitalsId: Number,
    EmergencyAdmissionId: Number,
    NurseId: Number,
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
router.delete('/:id', emergencyAdmissionVitalsController.deleteEmergencyAdmissionVitals);

module.exports = router;

