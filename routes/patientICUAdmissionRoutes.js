const express = require('express');
const router = express.Router();
const patientICUAdmissionController = require('../controllers/patientICUAdmissionController');

/* GET /api/patient-icu-admissions/count/icu-beds-occupied
Query Parameters:
  - date: String (YYYY-MM-DD), (required)
Response: {
  success: Boolean,
  message: String,
  date: String (YYYY-MM-DD),
  data: {
    totalICUBeds: Number,
    occupiedICUBeds: Number,
    availableICUBeds: Number,
    occupancyRate: Number
  }
} */
router.get('/count/icu-beds-occupied', patientICUAdmissionController.getICUBedsAndOccupiedCountByDate);

/* GET /api/patient-icu-admissions
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - icuPatientStatus: String | null, // "Serious" | "Available" | "Critical" | "Stable"
  - patientId: String (UUID) | null,
  - icuId: Number | null,
  - patientAppointmentId: Number | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    RoomAdmissionId: Number | null,
    ICUId: Number,
    ICUPatientStatus: String, // "Serious" | "Available" | "Critical" | "Stable"
    ICUAdmissionStatus: String, // "Occupied" | "Discharged", defaults to "Occupied"
    ICUAllocationFromDate: Date,
    ICUAllocationToDate: Date,
    NumberOfDays: Number,
    Diagnosis: String,
    TreatementDetails: String,
    PatientCondition: String,
    ICUAllocationCreatedBy: Number,
    ICUAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    ICUNo: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    CreatedByName: String | null
  }>
} */
router.get('/', patientICUAdmissionController.getAllPatientICUAdmissions);

/* GET /api/patient-icu-admissions/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  data: {
    PatientICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    RoomAdmissionId: Number | null,
    ICUId: Number,
    ICUPatientStatus: String, // "Serious" | "Available" | "Critical" | "Stable"
    ICUAdmissionStatus: String, // "Occupied" | "Discharged"
    ICUAllocationFromDate: Date,
    ICUAllocationToDate: Date,
    NumberOfDays: Number,
    Diagnosis: String,
    TreatementDetails: String,
    PatientCondition: String,
    ICUAllocationCreatedBy: Number,
    ICUAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    ICUNo: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    CreatedByName: String | null
  }
} */
router.get('/:id', patientICUAdmissionController.getPatientICUAdmissionById);

/* POST /api/patient-icu-admissions
Request: {
  PatientId: String (UUID), (required)
  PatientAppointmentId: Number | null,
  EmergencyBedSlotId: Number | null,
  RoomAdmissionId: Number | null,
  ICUId: Number, (required)
  ICUPatientStatus: String, (required) // "Serious" | "Available" | "Critical" | "Stable"
  ICUAdmissionStatus: String, // "Occupied" | "Discharged", defaults to "Occupied"
  ICUAllocationFromDate: String (YYYY-MM-DD), (required)
  ICUAllocationToDate: String (YYYY-MM-DD), (required)
  NumberOfDays: Number, (required)
  Diagnosis: String, (required)
  TreatementDetails: String, (required)
  PatientCondition: String, (required)
  ICUAllocationCreatedBy: Number, (required)
  Status: String, // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    RoomAdmissionId: Number | null,
    ICUId: Number,
    ICUPatientStatus: String, // "Serious" | "Available" | "Critical" | "Stable"
    ICUAdmissionStatus: String, // "Occupied" | "Discharged"
    ICUAllocationFromDate: Date,
    ICUAllocationToDate: Date,
    NumberOfDays: Number,
    Diagnosis: String,
    TreatementDetails: String,
    PatientCondition: String,
    ICUAllocationCreatedBy: Number,
    ICUAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    ICUNo: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    CreatedByName: String | null
  }
} */
router.post('/', patientICUAdmissionController.createPatientICUAdmission);

/* PUT /api/patient-icu-admissions/:id
Path Parameters:
  - id: String (UUID), (required)
Request: {
  PatientId: String (UUID),
  PatientAppointmentId: Number | null,
  EmergencyBedSlotId: Number | null,
  ICUId: Number,
  ICUPatientStatus: String, // "Serious" | "Available" | "Critical" | "Stable"
  ICUAdmissionStatus: String, // "Occupied" | "Discharged"
  ICUAllocationFromDate: String (YYYY-MM-DD),
  ICUAllocationToDate: String (YYYY-MM-DD),
  NumberOfDays: Number,
  Diagnosis: String,
  TreatementDetails: String,
  PatientCondition: String,
  ICUAllocationCreatedBy: Number,
  Status: String, // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    RoomAdmissionId: Number | null,
    ICUId: Number,
    ICUPatientStatus: String, // "Serious" | "Available" | "Critical" | "Stable"
    ICUAdmissionStatus: String, // "Occupied" | "Discharged"
    ICUAllocationFromDate: Date,
    ICUAllocationToDate: Date,
    NumberOfDays: Number,
    Diagnosis: String,
    TreatementDetails: String,
    PatientCondition: String,
    ICUAllocationCreatedBy: Number,
    ICUAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    ICUNo: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    CreatedByName: String | null
  }
} */
router.put('/:id', patientICUAdmissionController.updatePatientICUAdmission);

/* DELETE /api/patient-icu-admissions/:id
Path Parameters:
  - id: String (UUID), (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', patientICUAdmissionController.deletePatientICUAdmission);

module.exports = router;

