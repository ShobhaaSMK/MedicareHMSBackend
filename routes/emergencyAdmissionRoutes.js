const express = require('express');
const router = express.Router();
const emergencyAdmissionController = require('../controllers/emergencyAdmissionController');

/* GET /api/emergency-admissions
Query params: ?status=String (optional), ?emergencyStatus=String (optional), ?patientId=String UUID (optional), ?doctorId=Number (optional), ?emergencyBedSlotId=Number (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }]
} */
router.get('/', emergencyAdmissionController.getAllEmergencyAdmissions);

/* GET /api/emergency-admissions/by-date/:date
Params: date (String) // YYYY-MM-DD format
Response: {
  success: Boolean,
  count: Number,
  date: String,
  data: [{
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }]
} */
router.get('/by-date/:date', emergencyAdmissionController.getEmergencyAdmissionByDate);

/* GET /api/emergency-admissions/by-status/:status
Params: status (String) // "Admitted" | "IPD" | "OT" | "ICU" | "Discharged"
Response: {
  success: Boolean,
  count: Number,
  emergencyStatus: String,
  data: [{
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }]
} */
router.get('/by-status/:status', emergencyAdmissionController.getEmergencyAdmissionByStatus);

/* GET /api/emergency-admissions/patient/:patientId
Params: patientId (String UUID)
Query params: ?status=String (optional), ?emergencyStatus=String (optional)
Response: {
  success: Boolean,
  count: Number,
  patientId: String,
  data: [{
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    EBedSlotNo: String | null,
    EmergencyBedNo: String | null,
    CreatedByName: String | null,
    EmergencyAdmissionId_EmergencyAdmissionDate: String | null
  }]
} */
router.get('/patient/:patientId', emergencyAdmissionController.getEmergencyAdmissionsByPatientId);

/* GET /api/emergency-admissions/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }
} */
router.get('/:id', emergencyAdmissionController.getEmergencyAdmissionById);

/* POST /api/emergency-admissions
Request: {
  DoctorId: Number (required),
  PatientId: String UUID (required),
  EmergencyBedSlotId: Number (required),
  EmergencyAdmissionDate: String (required), // YYYY-MM-DD format
  EmergencyStatus: String (optional), // "Admitted" | "IPD" | "OT" | "ICU" | "Discharged"
  AllocationFromDate: String (optional), // YYYY-MM-DD format
  AllocationToDate: String (optional), // YYYY-MM-DD format
  NumberOfDays: Number (optional),
  Diagnosis: String (optional),
  TreatementDetails: String (optional),
  PatientCondition: String (optional), // "Critical" | "Stable"
  TransferToIPD: String (optional), // "Yes" | "No", defaults to "No"
  TransferToOT: String (optional), // "Yes" | "No", defaults to "No"
  TransferToICU: String (optional), // "Yes" | "No", defaults to "No"
  TransferTo: String (optional),
  TransferDetails: String (optional),
  AdmissionCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }
} */
router.post('/', emergencyAdmissionController.createEmergencyAdmission);

/* PUT /api/emergency-admissions/:id
Params: id (Number)
Request: {
  DoctorId: Number (optional),
  PatientId: String UUID (optional),
  EmergencyBedSlotId: Number (optional),
  EmergencyAdmissionDate: String (optional), // YYYY-MM-DD format
  EmergencyStatus: String (optional), // "Admitted" | "IPD" | "OT" | "ICU" | "Discharged"
  AllocationFromDate: String (optional), // YYYY-MM-DD format
  AllocationToDate: String (optional), // YYYY-MM-DD format
  NumberOfDays: Number (optional),
  Diagnosis: String (optional),
  TreatementDetails: String (optional),
  PatientCondition: String (optional), // "Critical" | "Stable"
  TransferToIPD: String (optional), // "Yes" | "No"
  TransferToOT: String (optional), // "Yes" | "No"
  TransferToICU: String (optional), // "Yes" | "No"
  TransferTo: String (optional),
  TransferDetails: String (optional),
  AdmissionCreatedBy: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }
} */
router.put('/:id', emergencyAdmissionController.updateEmergencyAdmission);

/* DELETE /api/emergency-admissions/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyAdmissionId: Number,
    DoctorId: Number,
    PatientId: String (UUID),
    EmergencyBedSlotId: Number,
    EmergencyAdmissionDate: Date,
    EmergencyStatus: String | null,
    AllocationFromDate: Date | null,
    AllocationToDate: Date | null,
    NumberOfDays: Number | null,
    Diagnosis: String | null,
    TreatementDetails: String | null,
    PatientCondition: String | null,
    TransferToIPD: String,
    TransferToOT: String,
    TransferToICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    AdmissionCreatedBy: Number | null,
    AdmissionCreatedAt: Date,
    Status: String
  }
} */
router.delete('/:id', emergencyAdmissionController.deleteEmergencyAdmission);

module.exports = router;

