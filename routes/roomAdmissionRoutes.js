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

