const express = require('express');
const router = express.Router();
const patientAdmitNurseVisitsController = require('../controllers/patientAdmitNurseVisitsController');

/* GET /api/patient-admit-nurse-visits
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - patientStatus: String | null, // "Stable" | "NotStable"
  - patientId: String (UUID) | null,
  - roomAdmissionId: Number | null,
  - visitDate: String (YYYY-MM-DD) | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientAdmitNurseVisitsId: String (UUID),
    RoomAdmissionId: Number,
    PatientId: String (UUID),
    VisitDate: Date,
    VisitTime: String (HH:MM:SS) | null,
    PatientStatus: String | null, // "Stable" | "NotStable"
    SupervisionDetails: String | null,
    Remarks: String | null,
    Status: String, // "Active" | "Inactive"
    RoomVisitsCreatedAt: Date,
    RoomVisitsCreatedBy: Number | null
  }>
} */
router.get('/', patientAdmitNurseVisitsController.getAllPatientAdmitNurseVisits);

/* GET /api/patient-admit-nurse-visits/room-admission/:id
Path Parameters:
  - id: Number (required), // RoomAdmissionId
Response: {
  success: Boolean,
  message: String,
  count: Number,
  roomAdmissionId: Number,
  data: Array<{
    PatientAdmitNurseVisitsId: String (UUID),
    RoomAdmissionId: Number,
    PatientId: String (UUID),
    VisitDate: Date,
    VisitTime: String (HH:MM:SS) | null,
    PatientStatus: String | null, // "Stable" | "NotStable"
    SupervisionDetails: String | null,
    Remarks: String | null,
    Status: String, // "Active" | "Inactive"
    RoomVisitsCreatedAt: Date,
    RoomVisitsCreatedBy: Number | null
  }>
} */
router.get('/room-admission/:id', patientAdmitNurseVisitsController.getPatientNurseVisitsByRoomAdmissionId);

/* GET /api/patient-admit-nurse-visits/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  data: {
    PatientAdmitNurseVisitsId: String (UUID),
    RoomAdmissionId: Number,
    PatientId: String (UUID),
    VisitDate: Date,
    VisitTime: String (HH:MM:SS) | null,
    PatientStatus: String | null, // "Stable" | "NotStable"
    SupervisionDetails: String | null,
    Remarks: String | null,
    Status: String, // "Active" | "Inactive"
    RoomVisitsCreatedAt: Date,
    RoomVisitsCreatedBy: Number | null
  }
} */
router.get('/:id', patientAdmitNurseVisitsController.getPatientAdmitNurseVisitsById);

/* POST /api/patient-admit-nurse-visits
Request: {
  RoomAdmissionId: Number | null,
  PatientId: String (UUID), (required)
  VisitDate: String (YYYY-MM-DD), (required)
  VisitTime: String (HH:MM or HH:MM:SS) | null,
  PatientStatus: String | null, // "Stable" | "NotStable"
  SupervisionDetails: String | null,
  Remarks: String | null,
  RoomVisitsCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitNurseVisitsId: String (UUID),
    RoomAdmissionId: Number,
    PatientId: String (UUID),
    VisitDate: Date,
    VisitTime: String (HH:MM:SS) | null,
    PatientStatus: String | null, // "Stable" | "NotStable"
    SupervisionDetails: String | null,
    Remarks: String | null,
    Status: String, // "Active" | "Inactive"
    RoomVisitsCreatedAt: Date,
    RoomVisitsCreatedBy: Number | null
  }
} */
router.post('/', patientAdmitNurseVisitsController.createPatientAdmitNurseVisits);

/* PUT /api/patient-admit-nurse-visits/:id
Path Parameters:
  - id: String (UUID), (required)
Request: {
  RoomAdmissionId: Number | null,
  PatientId: String (UUID),
  VisitDate: String (YYYY-MM-DD),
  VisitTime: String (HH:MM or HH:MM:SS) | null,
  PatientStatus: String | null, // "Stable" | "NotStable"
  SupervisionDetails: String | null,
  Remarks: String | null,
  RoomVisitsCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitNurseVisitsId: String (UUID),
    RoomAdmissionId: Number,
    PatientId: String (UUID),
    VisitDate: Date,
    VisitTime: String (HH:MM:SS) | null,
    PatientStatus: String | null, // "Stable" | "NotStable"
    SupervisionDetails: String | null,
    Remarks: String | null,
    Status: String, // "Active" | "Inactive"
    RoomVisitsCreatedAt: Date,
    RoomVisitsCreatedBy: Number | null
  }
} */
router.put('/:id', patientAdmitNurseVisitsController.updatePatientAdmitNurseVisits);

/* DELETE /api/patient-admit-nurse-visits/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', patientAdmitNurseVisitsController.deletePatientAdmitNurseVisits);

module.exports = router;

