const express = require('express');
const router = express.Router();
const patientAdmitDoctorVisitsController = require('../controllers/patientAdmitDoctorVisitsController');

/* GET /api/patient-admit-doctor-visits
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - patientId: Number | null,
  - doctorId: String (UUID) | null,
  - roomAdmissionId: String (UUID) | null,
  - fromDate: String (timestamp) | null,
  - toDate: String (timestamp) | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientAdmitDoctorVisitsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsRemarks: String | null,
    PatientCondition: String | null,
    Status: String, // "Active" | "Inactive"
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date
  }>
} */
router.get('/', patientAdmitDoctorVisitsController.getAllPatientAdmitDoctorVisits);

/* GET /api/patient-admit-doctor-visits/room-admission/:id
Path Parameters:
  - id: Number (required), // RoomAdmissionId
Response: {
  success: Boolean,
  message: String,
  count: Number,
  roomAdmissionId: Number,
  data: Array<{
    PatientAdmitDoctorVisitsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsRemarks: String | null,
    PatientCondition: String | null,
    Status: String, // "Active" | "Inactive"
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date
  }>
} */
router.get('/room-admission/:id', patientAdmitDoctorVisitsController.getPatientAdmitDoctorVisitsByRoomAdmissionId);

/* GET /api/patient-admit-doctor-visits/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  data: {
    PatientAdmitDoctorVisitsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsRemarks: String | null,
    PatientCondition: String | null,
    Status: String, // "Active" | "Inactive"
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date
  }
} */
router.get('/:id', patientAdmitDoctorVisitsController.getPatientAdmitDoctorVisitsById);

/* POST /api/patient-admit-doctor-visits
Request: {
  RoomAdmissionId: Number | null,
  PatientId: String (UUID), (required)
  DoctorId: Number, (required)
  DoctorVisitedDateTime: String (timestamp), (required)
  VisitsRemarks: String | null,
  PatientCondition: String | null,
  VisitCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitDoctorVisitsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsRemarks: String | null,
    PatientCondition: String | null,
    Status: String, // "Active" | "Inactive"
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date
  }
} */
router.post('/', patientAdmitDoctorVisitsController.createPatientAdmitDoctorVisits);

/* PUT /api/patient-admit-doctor-visits/:id
Path Parameters:
  - id: String (UUID), (required)
Request: {
  RoomAdmissionId: Number | null,
  PatientId: String (UUID),
  DoctorId: Number,
  DoctorVisitedDateTime: String (timestamp),
  VisitsRemarks: String | null,
  PatientCondition: String | null,
  VisitCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAdmitDoctorVisitsId: String (UUID),
    RoomAdmissionId: Number | null,
    PatientId: String (UUID),
    DoctorId: Number,
    DoctorVisitedDateTime: Date,
    VisitsRemarks: String | null,
    PatientCondition: String | null,
    Status: String, // "Active" | "Inactive"
    VisitCreatedBy: Number | null,
    VisitCreatedAt: Date
  }
} */
router.put('/:id', patientAdmitDoctorVisitsController.updatePatientAdmitDoctorVisits);

/* DELETE /api/patient-admit-doctor-visits/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', patientAdmitDoctorVisitsController.deletePatientAdmitDoctorVisits);

module.exports = router;

