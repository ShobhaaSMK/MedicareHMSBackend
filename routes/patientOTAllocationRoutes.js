const express = require('express');
const router = express.Router();
const patientOTAllocationController = require('../controllers/patientOTAllocationController');


/* GET /api/patient-ot-allocations/count/today-scheduled-inprogress
Response: {
  success: Boolean,
  message: String,
  date: String (YYYY-MM-DD),
  counts: {
    todayScheduled: Number,
    inProgress: Number
  },
  data: {
    date: String (YYYY-MM-DD),
    todayScheduledCount: Number,
    inProgressCount: Number,
    todayScheduledStatus: Array<String>, // ["Scheduled", "In Progress"]
    inProgressStatus: String // "In Progress"
  }
} */
router.get('/count/today-scheduled-inprogress', patientOTAllocationController.getTodayOTScheduledAndInProgressCount);

/* GET /api/patient-ot-allocations/count/scheduled-inprogress
Query Parameters:
  - date: String (YYYY-MM-DD), (required)
Response: {
  success: Boolean,
  message: String,
  date: String (YYYY-MM-DD),
  counts: {
    scheduled: Number,
    inProgress: Number
  },
  data: {
    date: String (YYYY-MM-DD),
    scheduledCount: Number,
    inProgressCount: Number,
    scheduledStatus: Array<String>, // ["Scheduled", "In Progress"]
    inProgressStatus: String // "In Progress"
  }
} */
router.get('/count/scheduled-inprogress', patientOTAllocationController.getOTScheduledAndInProgressCountByDate);

/* GET /api/patient-ot-allocations
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - operationStatus: String | null, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed"
  - patientId: Number | null,
  - otId: Number | null,
  - surgeryId: Number | null,
  - leadSurgeonId: Number | null,
  - fromDate: String (YYYY-MM-DD) | null,
  - toDate: String (YYYY-MM-DD) | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientOTAllocationId: Number,
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    OTId: Number,
    OTSlotIds: Array<Number> | null, // Array of slot IDs
    OTSlots: Array<{ // Array of slot objects with details
      OTSlotId: Number,
      OTSlotNo: Number,
      SlotStartTime: String,
      SlotEndTime: String,
      OTSlotStatus: String
    }> | null,
    SurgeryId: Number | null,
    LeadSurgeonId: Number,
    AssistantDoctorId: Number | null,
    AnaesthetistId: Number | null,
    NurseId: Number | null,
    OTAllocationDate: Date,
    Duration: Number | null,
    OTStartTime: String (HH:MM:SS) | null,
    OTEndTime: String (HH:MM:SS) | null,
    OTActualStartTime: String (HH:MM:SS) | null,
    OTActualEndTime: String (HH:MM:SS) | null,
    OperationDescription: String | null,
    OperationStatus: String, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed", defaults to "Scheduled"
    PreOperationNotes: String | null,
    PostOperationNotes: String | null,
    OTDocuments: String | null,
    BillId: Number | null,
    OTAllocationCreatedBy: Number | null,
    OTAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    OTNo: String | null,
    SurgeryName: String | null,
    LeadSurgeonName: String | null,
    AssistantDoctorName: String | null,
    AnaesthetistName: String | null,
    NurseName: String | null,
    BillNo: String | null,
    CreatedByName: String | null
  }>
} */
router.get('/', patientOTAllocationController.getAllPatientOTAllocations);

/* GET /api/patient-ot-allocations/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  data: {
    PatientOTAllocationId: Number,
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    OTId: Number,
    //OTSlotId: Number | null, // Deprecated: use OTSlotIds array
    OTSlotIds: Array<Number> | null, // Array of slot IDs
    OTSlots: Array<{ // Array of slot objects with details
      OTSlotId: Number,
      OTSlotNo: Number,
      SlotStartTime: String,
      SlotEndTime: String,
      OTSlotStatus: String
    }> | null,
    SurgeryId: Number | null,
    LeadSurgeonId: Number,
    AssistantDoctorId: Number | null,
    AnaesthetistId: Number | null,
    NurseId: Number | null,
    OTAllocationDate: Date,
    Duration: Number | null,
    OTStartTime: String (HH:MM:SS) | null,
    OTEndTime: String (HH:MM:SS) | null,
    OTActualStartTime: String (HH:MM:SS) | null,
    OTActualEndTime: String (HH:MM:SS) | null,
    OperationDescription: String | null,
    OperationStatus: String, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed"
    PreOperationNotes: String | null,
    PostOperationNotes: String | null,
    OTDocuments: String | null,
    BillId: Number | null,
    OTAllocationCreatedBy: Number | null,
    OTAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    OTNo: String | null,
    SurgeryName: String | null,
    LeadSurgeonName: String | null,
    AssistantDoctorName: String | null,
    AnaesthetistName: String | null,
    NurseName: String | null,
    BillNo: String | null,
    CreatedByName: String | null,
    OTSlotNo: Number | null,
    SlotStartTime: String (HH:MM:SS) | null,
    SlotEndTime: String (HH:MM:SS) | null,
    OTSlotStatus: String | null // "Active" | "InActive"
  }
} */
router.get('/:id', patientOTAllocationController.getPatientOTAllocationById);

/* POST /api/patient-ot-allocations/for-room-admission
Note: This endpoint has been removed and returns 410 Gone.
Response: {
  success: Boolean,
  message: String
} */
router.post('/for-room-admission', patientOTAllocationController.createOTAllocationForRoomAdmission);

/* POST /api/patient-ot-allocations
Request: {
  PatientId: String (UUID), (required)
  RoomAdmissionId: Number | null,
  PatientAppointmentId: Number | null,
  EmergencyBedSlotId: Number | null,
  OTId: Number, (required)
  OTSlotIds: Array<Number> | null, // Array of slot IDs (optional)
  SurgeryId: Number | null,
  LeadSurgeonId: Number, (required)
  AssistantDoctorId: Number | null,
  AnaesthetistId: Number | null,
  NurseId: Number | null,
  OTAllocationDate: String (YYYY-MM-DD), (required)
  Duration: Number | null,
  OTStartTime: String (HH:MM or HH:MM:SS) | null,
  OTEndTime: String (HH:MM or HH:MM:SS) | null,
  OTActualStartTime: String (HH:MM or HH:MM:SS) | null,
  OTActualEndTime: String (HH:MM or HH:MM:SS) | null,
  OperationDescription: String | null,
  OperationStatus: String, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed", defaults to "Scheduled"
  PreOperationNotes: String | null,
  PostOperationNotes: String | null,
  OTDocuments: String | null,
  BillId: Number | null,
  OTAllocationCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientOTAllocationId: Number,
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    OTId: Number,
    SurgeryId: Number | null,
    LeadSurgeonId: Number,
    AssistantDoctorId: Number | null,
    AnaesthetistId: Number | null,
    NurseId: Number | null,
    OTAllocationDate: Date,
    Duration: Number | null,
    OTStartTime: String (HH:MM:SS) | null,
    OTEndTime: String (HH:MM:SS) | null,
    OTActualStartTime: String (HH:MM:SS) | null,
    OTActualEndTime: String (HH:MM:SS) | null,
    OperationDescription: String | null,
    OperationStatus: String, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed"
    PreOperationNotes: String | null,
    PostOperationNotes: String | null,
    OTDocuments: String | null,
    BillId: Number | null,
    OTAllocationCreatedBy: Number | null,
    OTAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    OTNo: String | null,
    SurgeryName: String | null,
    LeadSurgeonName: String | null,
    AssistantDoctorName: String | null,
    AnaesthetistName: String | null,
    NurseName: String | null,
    BillNo: String | null,
    CreatedByName: String | null
  }
} */
router.post('/', patientOTAllocationController.createPatientOTAllocation);

/* PUT /api/patient-ot-allocations/:id
Path Parameters:
  - id: Number, (required)
Request: {
  PatientId: String (UUID),
  PatientAppointmentId: Number | null,
  EmergencyBedSlotId: Number | null,
  OTId: Number,
  //OTSlotId: Number | null, // Deprecated: use OTSlotIds array
  OTSlotIds: Array<Number> | null, // Array of slot IDs
  SurgeryId: Number | null,
  LeadSurgeonId: Number,
  AssistantDoctorId: Number | null,
  AnaesthetistId: Number | null,
  NurseId: Number | null,
  OTAllocationDate: String (YYYY-MM-DD),
  Duration: Number | null,
  OTStartTime: String (HH:MM or HH:MM:SS) | null,
  OTEndTime: String (HH:MM or HH:MM:SS) | null,
  OTActualStartTime: String (HH:MM or HH:MM:SS) | null,
  OTActualEndTime: String (HH:MM or HH:MM:SS) | null,
  OperationDescription: String | null,
  OperationStatus: String, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed"
  PreOperationNotes: String | null,
  PostOperationNotes: String | null,
  OTDocuments: String | null,
  BillId: Number | null,
  OTAllocationCreatedBy: Number | null,
  Status: String, // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientOTAllocationId: Number,
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyBedSlotId: Number | null,
    OTId: Number,
    SurgeryId: Number | null,
    LeadSurgeonId: Number,
    AssistantDoctorId: Number | null,
    AnaesthetistId: Number | null,
    NurseId: Number | null,
    OTAllocationDate: Date,
    Duration: Number | null,
    OTStartTime: String (HH:MM:SS) | null,
    OTEndTime: String (HH:MM:SS) | null,
    OTActualStartTime: String (HH:MM:SS) | null,
    OTActualEndTime: String (HH:MM:SS) | null,
    OperationDescription: String | null,
    OperationStatus: String, // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed"
    PreOperationNotes: String | null,
    PostOperationNotes: String | null,
    OTDocuments: String | null,
    BillId: Number | null,
    OTAllocationCreatedBy: Number | null,
    OTAllocationCreatedAt: Date,
    Status: String, // "Active" | "Inactive"
    PatientName: String | null,
    PatientNo: String | null,
    OTNo: String | null,
    SurgeryName: String | null,
    LeadSurgeonName: String | null,
    AssistantDoctorName: String | null,
    AnaesthetistName: String | null,
    NurseName: String | null,
    BillNo: String | null,
    CreatedByName: String | null
  }
} */
router.put('/:id', patientOTAllocationController.updatePatientOTAllocation);

/* DELETE /api/patient-ot-allocations/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', patientOTAllocationController.deletePatientOTAllocation);

module.exports = router;

