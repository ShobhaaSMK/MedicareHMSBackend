const express = require('express');
const router = express.Router();
const roomAdmissionController = require('../controllers/roomAdmissionController');


/* GET /api/room-admissions
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - admissionStatus: String | null, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
  - patientId: String (UUID) | null,
  - doctorId: Number | null,
  - roomBedsId: Number | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    RoomAdmissionId: Number,
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    AdmittingDoctorId: Number,
    PatientId: String (UUID),
    RoomBedsId: Number,
    RoomAllocationDate: Date,
    RoomVacantDate: Date | null,
    AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
    CaseSheetDetails: String | null,
    CaseSheet: String | null,
    ShiftToAnotherRoom: String, // "Yes" | "No", defaults to "No"
    ShiftedTo: String | null,
    ShiftedToDetails: String | null,
    ScheduleOT: String, // "Yes" | "No", defaults to "No"
    OTAdmissionId: Number | null,
    IsLinkedToICU: String, // "Yes" | "No", defaults to "No"
    ICUAdmissionId: String (UUID) | null,
    BillId: Number | null,
    AllocatedBy: Number | null,
    AllocatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    AdmittingDoctorName: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    RoomNo: String | null,
    AllocatedByName: String | null
  }>
} */
router.get('/', roomAdmissionController.getAllRoomAdmissions);

/* GET /api/room-admissions/capacity-overview
Response: {
  success: Boolean,
  message: String,
  data: [{
    roomType: String, // "Regular Ward", "Special Room", "Special Shared Room"
    percentage: Number, // 0-100
    totalBeds: Number,
    occupied: Number,
    available: Number
  }]
} */
router.get('/capacity-overview', roomAdmissionController.getRoomCapacityOverview);

/* GET /api/room-admissions/count/total
Query Parameters:
  - status: String (optional), // "Active" | "Inactive"
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: {
    count: Number,
    status: String // "All" | "Active" | "Inactive"
  }
} */
router.get('/count/total', roomAdmissionController.getTotalAdmissionsCount);

/* GET /api/room-admissions/dashboard-metrics
Response: {
  success: Boolean,
  message: String,
  data: {
    totalAdmissions: Number,
    activePatients: Number,
    bedOccupancy: String, // "9/39" format (occupied/total)
    occupiedBeds: Number,
    availableBeds: Number,
    readyForAdmission: Number,
    avgStay: Number // Average stay duration in days (rounded to 1 decimal)
  }
} */
router.get('/dashboard-metrics', roomAdmissionController.getRoomAdmissionsDashboardMetrics);

/* GET /api/room-admissions/data
Query Parameters:
  - status: String (optional), // "Active" | "Inactive"
  - admissionStatus: String (optional), // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: [{
    roomAdmissionId: Number,
    bedNo: String,
    patientName: String,
    age: Number | null,
    gender: String | null,
    roomType: String,
    admissionDate: Date,
    admittedBy: String,
    diagnosis: String | null,
    admissionStatus: String,
    status: String, // "Active" | "Inactive"
    scheduleOT: String, // "Yes" | "No"
    patientType: String | null, // "OPD" | "Emergency" | "Direct"
    patientAppointmentId: Number | null, // Latest PatientAppointmentId based on AppointmentDate
    appointmentDate: Date | null, // Latest AppointmentDate
    appointmentTokenNo: Number | null, // Latest Appointment TokenNo
    emergencyBedSlotId: Number | null, // EmergencyBedSlotId from RoomAdmission
    emergencyAdmissionId: Number | null, // Latest EmergencyAdmissionId based on EmergencyAdmissionDate
    emergencyAdmissionDate: Date | null, // Latest EmergencyAdmissionDate
    emergencyAdmissionBedId: Number | null, // EmergencyBedId from latest EmergencyAdmission
    emergencyStatus: String | null, // Latest EmergencyStatus from EmergencyAdmission
    emergencyBedNo: String | null // Emergency Bed No from latest EmergencyAdmission
  }]
} */
router.get('/data', roomAdmissionController.getRoomAdmissionsData);

/* GET /api/room-admissions/data/:id
Path Parameters:
  - id: Number (required), // RoomAdmissionId
Response: {
  success: Boolean,
  message: String,
  data: {
    roomAdmissionId: Number,
    bedNo: String,
    patientName: String,
    age: Number | null,
    gender: String | null,
    roomType: String,
    admissionDate: Date,
    admittedBy: String,
    diagnosis: String | null,
    admissionStatus: String,
    status: String, // "Active" | "Inactive"
    scheduleOT: String // "Yes" | "No"
  }
} */
router.get('/data/:id', roomAdmissionController.getRoomAdmissionsDataById);

/* GET /api/room-admissions/patient/:patientId
Path Parameters:
  - patientId: String (UUID) - required
Query Parameters:
  - status: String (optional), // "Active" | "Inactive"
  - admissionStatus: String (optional), // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
Response: {
  success: Boolean,
  count: Number,
  patientId: String (UUID),
  data: Array<{
    RoomAdmissionId: Number,
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    AdmittingDoctorId: Number,
    PatientId: String (UUID),
    RoomBedsId: Number,
    RoomAllocationDate: Date,
    RoomVacantDate: Date | null,
    AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
    CaseSheetDetails: String | null,
    CaseSheet: String | null,
    ShiftToAnotherRoom: String, // "Yes" | "No", defaults to "No"
    ShiftedTo: String | null,
    ShiftedToDetails: String | null,
    ScheduleOT: String, // "Yes" | "No", defaults to "No"
    OTAdmissionId: Number | null,
    IsLinkedToICU: String, // "Yes" | "No", defaults to "No"
    ICUAdmissionId: String (UUID) | null,
    BillId: Number | null,
    AllocatedBy: Number | null,
    AllocatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    AdmittingDoctorName: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    RoomNo: String | null,
    AllocatedByName: String | null
  }>
} */
router.get('/patient/:patientId', roomAdmissionController.getRoomAdmissionsByPatientId);

/* GET /api/room-admissions/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  data: {
    RoomAdmissionId: Number,
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    AdmittingDoctorId: Number,
    PatientId: String (UUID),
    RoomBedsId: Number,
    RoomAllocationDate: Date,
    RoomVacantDate: Date | null,
    AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
    CaseSheetDetails: String | null,
    CaseSheet: String | null,
    ShiftToAnotherRoom: String, // "Yes" | "No"
    ShiftedTo: String | null,
    ShiftedToDetails: String | null,
    ScheduleOT: String, // "Yes" | "No"
    OTAdmissionId: Number | null,
    IsLinkedToICU: String, // "Yes" | "No"
    ICUAdmissionId: String (UUID) | null,
    BillId: Number | null,
    AllocatedBy: Number | null,
    AllocatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    AdmittingDoctorName: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    RoomNo: String | null,
    AllocatedByName: String | null
  }
} */
/* GET /api/room-admissions/check-availability
Query Parameters:
  - roomBedsId: Number (required) - The RoomBedsId to check availability for
  - checkDate: String (optional) - Date to check availability for in YYYY-MM-DD format (defaults to today)
Response: {
  success: Boolean,
  message: String,
  data: {
    roomBedsId: Number,
    roomNo: String | null,
    bedNo: String | null,
    checkDate: String (YYYY-MM-DD),
    isAvailable: Boolean,
    reason: String,
    conflictingAdmissions: Array<{
      RoomAdmissionId: Number,
      PatientName: String | null,
      PatientNo: String | null,
      RoomAllocationDate: Date,
      RoomVacantDate: Date | null,
      AdmissionStatus: String
    }>,
    conflictingCount: Number
  }
} */
router.get('/check-availability', roomAdmissionController.checkRoomAvailability);

/* GET /api/room-admissions/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  data: {
    RoomAdmissionId: Number,
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    AdmittingDoctorId: Number,
    PatientId: String (UUID),
    RoomBedsId: Number,
    RoomAllocationDate: Date,
    RoomVacantDate: Date | null,
    AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
    CaseSheetDetails: String | null,
    CaseSheet: String | null,
    ShiftToAnotherRoom: String, // "Yes" | "No"
    ShiftedTo: String | null,
    ShiftedToDetails: String | null,
    ScheduleOT: String, // "Yes" | "No"
    OTAdmissionId: Number | null,
    IsLinkedToICU: String, // "Yes" | "No"
    ICUAdmissionId: String (UUID) | null,
    BillId: Number | null,
    AllocatedBy: Number | null,
    AllocatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    AdmittingDoctorName: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    RoomNo: String | null,
    AllocatedByName: String | null
  }
} */
router.get('/:id', roomAdmissionController.getRoomAdmissionById);

/* POST /api/room-admissions
Request: {
  PatientAppointmentId: Number | null,
  EmergencyBedSlotId: Number | null,
  PatientType: String | null, // "OPD" | "Emergency" | "Direct" - Required if PatientAppointmentId and EmergencyBedSlotId are both null
  AdmittingDoctorId: Number, (required)
  PatientId: String (UUID), (required)
  RoomBedsId: Number, (required)
  RoomAllocationDate: String (YYYY-MM-DD), (required)
  RoomVacantDate: String (YYYY-MM-DD) | null,
  AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged", defaults to "Active"
  CaseSheetDetails: String | null,
  CaseSheet: String | null,
  ShiftToAnotherRoom: String, // "Yes" | "No", defaults to "No"
  ShiftedTo: String | null,
  ShiftedToDetails: String | null,
  ScheduleOT: String, // "Yes" | "No", defaults to "No"
  OTAdmissionId: Number | null,
  IsLinkedToICU: String, // "Yes" | "No", defaults to "No"
  ICUAdmissionId: String (UUID) | null,
  BillId: Number | null,
  AllocatedBy: Number | null,
  Status: String, // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    RoomAdmissionId: Number,
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    PatientType: String | null, // "OPD" | "Emergency" | "Direct"
    AdmittingDoctorId: Number,
    PatientId: String (UUID),
    RoomBedsId: Number,
    RoomAllocationDate: Date,
    RoomVacantDate: Date | null,
    AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
    CaseSheetDetails: String | null,
    CaseSheet: String | null,
    ShiftToAnotherRoom: String, // "Yes" | "No"
    ShiftedTo: String | null,
    ShiftedToDetails: String | null,
    ScheduleOT: String, // "Yes" | "No"
    OTAdmissionId: Number | null,
    IsLinkedToICU: String, // "Yes" | "No"
    ICUAdmissionId: String (UUID) | null,
    BillId: Number | null,
    AllocatedBy: Number | null,
    AllocatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    AdmittingDoctorName: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    RoomNo: String | null,
    AllocatedByName: String | null
  }
} */
router.post('/', roomAdmissionController.createRoomAdmission);

/* PUT /api/room-admissions/:id
Path Parameters:
  - id: Number, (required)
Request: {
  PatientAppointmentId: Number | null,
  EmergencyBedSlotId: Number | null,
  PatientType: String | null, // "OPD" | "Emergency" | "Direct"
  AdmittingDoctorId: Number,
  PatientId: String (UUID),
  RoomBedsId: Number,
  RoomAllocationDate: String (YYYY-MM-DD),
  RoomVacantDate: String (YYYY-MM-DD) | null,
  AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
  CaseSheetDetails: String | null,
  CaseSheet: String | null,
  ShiftToAnotherRoom: String, // "Yes" | "No"
  ShiftedTo: String | null,
  ShiftedToDetails: String | null,
  ScheduleOT: String, // "Yes" | "No"
  OTAdmissionId: Number | null,
  IsLinkedToICU: String, // "Yes" | "No"
  ICUAdmissionId: String (UUID) | null,
  BillId: Number | null,
  AllocatedBy: Number | null,
  Status: String, // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    RoomAdmissionId: Number,
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    PatientType: String | null, // "OPD" | "Emergency" | "Direct"
    AdmittingDoctorId: Number,
    PatientId: String (UUID),
    RoomBedsId: Number,
    RoomAllocationDate: Date,
    RoomVacantDate: Date | null,
    AdmissionStatus: String, // "Active" | "Surgery Scheduled" | "Moved to ICU" | "Discharged"
    CaseSheetDetails: String | null,
    CaseSheet: String | null,
    ShiftToAnotherRoom: String, // "Yes" | "No"
    ShiftedTo: String | null,
    ShiftedToDetails: String | null,
    ScheduleOT: String, // "Yes" | "No"
    OTAdmissionId: Number | null,
    IsLinkedToICU: String, // "Yes" | "No"
    ICUAdmissionId: String (UUID) | null,
    BillId: Number | null,
    AllocatedBy: Number | null,
    AllocatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    AdmittingDoctorName: String | null,
    AppointmentTokenNo: Number | null,
    BedNo: String | null,
    RoomNo: String | null,
    AllocatedByName: String | null
  }
} */
router.put('/:id', roomAdmissionController.updateRoomAdmission);

/* DELETE /api/room-admissions/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', roomAdmissionController.deleteRoomAdmission);

module.exports = router;

