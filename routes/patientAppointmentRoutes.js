const express = require('express');
const router = express.Router();
const patientAppointmentController = require('../controllers/patientAppointmentController');

/* GET /api/patient-appointments/count/today-active
Response: {
  success: Boolean,
  date: String (YYYY-MM-DD),
  count: Number,
  message: String
} */
router.get('/count/today-active', patientAppointmentController.getTodayActiveAppointmentsCount);


/* GET /api/patient-appointments/count/active
Query params: ?date=String (YYYY-MM-DD) (optional, defaults to today)
Response: {
  success: Boolean,
  date: String (YYYY-MM-DD),
  count: Number,
  message: String
} */
router.get('/count/active', patientAppointmentController.getActiveAppointmentsCountByDate);

/* GET /api/patient-appointments/count/doctor-wise
Query params: ?status=String (optional), ?appointmentDate=String (YYYY-MM-DD) (optional)
Response: {
  success: Boolean,
  count: Number,
  totalPatients: Number,
  totalAppointments: Number,
  filters: {
    status: String | null,
    appointmentDate: String | null
  },
  data: [{
    DoctorId: Number,
    DoctorName: String,
    DoctorEmail: String | null,
    DoctorPhone: String | null,
    DoctorQualification: String | null,
    DepartmentName: String | null,
    SpecialisationDetails: String | null,
    PatientCount: Number,
    TotalAppointments: Number
  }]
} */
router.get('/count/doctor-wise', patientAppointmentController.getDoctorWisePatientCount);

/* GET /api/patient-appointments/count/status
Query params: ?appointmentDate=String (YYYY-MM-DD) (optional), ?doctorId=Number (optional)
Response: {
  success: Boolean,
  filters: {
    appointmentDate: String | null,
    doctorId: Number | null
  },
  counts: {
    TotalActiveAppointments: Number,
    WaitingCount: Number,
    ConsultingCount: Number,
    CompletedCount: Number
  },
  message: String
} */
router.get('/count/status', patientAppointmentController.getAppointmentCountsByStatus);

/* GET /api/patient-appointments/count/active-waiting-consulting
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: {
    count: Number,
    status: String,
    appointmentStatus: [String]
  }
} */
router.get('/count/active-waiting-consulting', patientAppointmentController.getActiveWaitingOrConsultingCount);


/* GET /api/patient-appointments
Query params: ?status=String (optional), ?appointmentStatus=String (optional), ?patientId=String UUID (optional), ?doctorId=Number (optional), ?appointmentDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String,
    AppointmentStatus: String, // "Waiting" | "Consulting" | "Completed"
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String, // "Yes" | "No"
    ReferToAnotherDoctor: String, // "Yes" | "No"
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String, // "Yes" | "No"
    TransferTo: String | null, // "IPD Room Admission" | "ICU" | "OT"
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String, // "Active" | "InActive"
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    AadharId: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }]
} */
router.get('/', patientAppointmentController.getAllAppointments);

/* GET /api/patient-appointments/doctor/:doctorId
Params: doctorId (Number) - required
Query params: ?status=String (optional), ?appointmentStatus=String (optional), ?appointmentDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  doctorId: Number,
  data: [{
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String,
    AppointmentStatus: String, // "Waiting" | "Consulting" | "Completed"
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String, // "Yes" | "No"
    ReferToAnotherDoctor: String, // "Yes" | "No"
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String, // "Yes" | "No"
    TransferTo: String | null, // "IPD Room Admission" | "ICU" | "OT"
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String, // "Active" | "InActive"
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    AadharId: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }]
} */
router.get('/doctor/:doctorId', patientAppointmentController.getAppointmentsByDoctorId);

/* GET /api/patient-appointments/patient/:patientId
Params: patientId (String UUID) - required
Query params: ?status=String (optional), ?appointmentStatus=String (optional)
Response: {
  success: Boolean,
  count: Number,
  patientId: String (UUID),
  data: [{
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String,
    AppointmentStatus: String, // "Waiting" | "Consulting" | "Completed"
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String, // "Yes" | "No"
    ReferToAnotherDoctor: String, // "Yes" | "No"
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String, // "Yes" | "No"
    TransferTo: String | null, // "IPD Room Admission" | "ICU" | "OT"
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String, // "Active" | "InActive"
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    AadharId: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }]
} */
router.get('/patient/:patientId', patientAppointmentController.getAppointmentsByPatientId);

/* GET /api/patient-appointments/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String,
    AppointmentStatus: String, // "Waiting" | "Consulting" | "Completed"
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String, // "Yes" | "No"
    ReferToAnotherDoctor: String, // "Yes" | "No"
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String, // "Yes" | "No"
    TransferTo: String | null, // "IPD Room Admission" | "ICU" | "OT"
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String, // "Active" | "InActive"
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    AadharId: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }
} */
router.get('/:id', patientAppointmentController.getAppointmentById);

/* POST /api/patient-appointments
Request: {
  PatientId: String UUID (required),
  DoctorId: Number (required),
  AppointmentDate: String (required), // YYYY-MM-DD format
  AppointmentTime: String (required), // HH:MM or HH:MM:SS format
  AppointmentStatus: String (optional), // "Waiting" | "Consulting" | "Completed", defaults to "Waiting"
  ConsultationCharge: Number (optional),
  Diagnosis: String (optional),
  FollowUpDetails: String (optional),
  PrescriptionsUrl: String (optional),
  ToBeAdmitted: String (optional), // "Yes" | "No", defaults to "No"
  ReferToAnotherDoctor: String (optional), // "Yes" | "No", defaults to "No"
  ReferredDoctorId: Number (optional), // Required if ReferToAnotherDoctor is "Yes"
  TransferToIPDOTICU: String (optional), // "Yes" | "No", defaults to "No"
  TransferTo: String (optional), // "IPD Room Admission" | "ICU" | "OT"
  TransferDetails: String (optional),
  BillId: Number (optional),
  Status: String (optional), // "Active" | "InActive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String, // Auto-generated (T-0001, T-0002, etc.)
    AppointmentStatus: String,
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String,
    ReferToAnotherDoctor: String,
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }
} */
router.post('/', patientAppointmentController.createAppointment);

/* PUT /api/patient-appointments/:id
Params: id (Number)
Request: {
  PatientId: String UUID (optional),
  DoctorId: Number (optional),
  AppointmentDate: String (optional), // YYYY-MM-DD format
  AppointmentTime: String (optional), // HH:MM or HH:MM:SS format
  AppointmentStatus: String (optional), // "Waiting" | "Consulting" | "Completed"
  ConsultationCharge: Number (optional),
  Diagnosis: String (optional),
  FollowUpDetails: String (optional),
  PrescriptionsUrl: String (optional),
  ToBeAdmitted: String (optional), // "Yes" | "No"
  ReferToAnotherDoctor: String (optional), // "Yes" | "No"
  ReferredDoctorId: Number (optional),
  TransferToIPDOTICU: String (optional), // "Yes" | "No"
  TransferTo: String (optional), // "IPD Room Admission" | "ICU" | "OT"
  TransferDetails: String (optional),
  BillId: Number (optional),
  Status: String (optional), // "Active" | "InActive"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String,
    AppointmentStatus: String,
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String,
    ReferToAnotherDoctor: String,
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }
} */
router.put('/:id', patientAppointmentController.updateAppointment);

/* DELETE /api/patient-appointments/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientAppointmentId: Number,
    PatientId: String (UUID),
    DoctorId: Number,
    AppointmentDate: Date,
    AppointmentTime: String,
    TokenNo: String,
    AppointmentStatus: String,
    ConsultationCharge: Number | null,
    Diagnosis: String | null,
    FollowUpDetails: String | null,
    PrescriptionsUrl: String | null,
    ToBeAdmitted: String,
    ReferToAnotherDoctor: String,
    ReferredDoctorId: Number | null,
    ReferredDoctorName: String | null,
    TransferToIPDOTICU: String,
    TransferTo: String | null,
    TransferDetails: String | null,
    BillId: Number | null,
    BillNo: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DoctorName: String | null,
    CreatedByName: String | null
  }
} */
router.delete('/:id', patientAppointmentController.deleteAppointment);

module.exports = router;

