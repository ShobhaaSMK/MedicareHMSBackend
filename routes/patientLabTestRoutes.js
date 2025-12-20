const express = require('express');
const router = express.Router();
const patientLabTestController = require('../controllers/patientLabTestController');

/* GET /api/patient-lab-tests/count/test-status
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - patientId: String (UUID) | null,
  - labTestId: Number | null,
  - createdDate: String (YYYY-MM-DD) | null
Response: {
  success: Boolean,
  filters: {
    status: String | null,
    patientId: String (UUID) | null,
    labTestId: Number | null,
    createdDate: String | null
  },
  counts: {
    TotalActiveCount: Number,
    PendingCount: Number,
    InProgressCount: Number,
    CompletedCount: Number,
    NullStatusCount: Number
  },
  message: String
} */
router.get('/count/test-status', patientLabTestController.getTestStatusWiseCounts);

/* GET /api/patient-lab-tests/count/opd-ipd
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - testStatus: String | null, // "Pending" | "InProgress" | "Completed"
Response: {
  success: Boolean,
  filters: {
    status: String | null,
    testStatus: String | null
  },
  counts: {
    OPDCount: Number,
    IPDCount: Number,
    BothCount: Number,
    DirectCount: Number,
    TotalCount: Number
  },
  message: String
} */
router.get('/count/opd-ipd', patientLabTestController.getOPDIPDWiseCounts);

/* GET /api/patient-lab-tests/count/labtest-wise
Query Parameters:
  - status: String | null, // "Active" | "Inactive", defaults to "Active"
  - testStatus: String | null, // "Pending" | "InProgress" | "Completed"
  - patientType: String | null, // "OPD" | "Emergency" | "IPD" | "Direct"
Response: {
  success: Boolean,
  filters: {
    status: String | null,
    testStatus: String | null,
    patientType: String | null
  },
  data: Array<{
    LabTestId: Number,
    TestName: String,
    DisplayTestId: String,
    TestCategory: String | null,
    TotalCount: Number,
    ActiveCount: Number,
    PendingCount: Number,
    InProgressCount: Number,
    CompletedCount: Number,
    OPDCount: Number,
    EmergencyCount: Number
  }>
} */
router.get('/count/labtest-wise', patientLabTestController.getLabTestWiseCounts);

/* GET /api/patient-lab-tests/count/doctor-wise
Query Parameters:
  - status: String | null, // "Active" | "Inactive", defaults to "Active"
  - testStatus: String | null, // "Pending" | "InProgress" | "Completed"
  - patientType: String | null, // "OPD" | "Emergency" | "IPD" | "Direct"
Response: {
  success: Boolean,
  filters: {
    status: String | null,
    testStatus: String | null,
    patientType: String | null
  },
  data: Array<{
    DoctorId: Number,
    DoctorName: String,
    DoctorEmail: String | null,
    DoctorPhone: String | null,
    DoctorQualification: String | null,
    DepartmentName: String | null,
    TotalCount: Number,
    ActiveCount: Number,
    PendingCount: Number,
    InProgressCount: Number,
    CompletedCount: Number,
    OPDCount: Number,
    EmergencyCount: Number
  }>
} */
router.get('/count/doctor-wise', patientLabTestController.getDoctorWiseCounts);

/* GET /api/patient-lab-tests/with-details
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - testStatus: String | null, // "Pending" | "InProgress" | "Completed"
  - patientId: String (UUID) | null,
  - labTestId: Number | null,
  - appointmentId: Number | null,
  - roomAdmissionId: Number | null,
  - emergencyAdmissionId: Number | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientLabTestsId: Number,
    PatientType: String, // "OPD" | "Emergency" | "IPD" | "Direct"
    PatientId: String (UUID),
    LabTestId: Number,
    AppointmentId: Number | null,
    EmergencyAdmissionId: Number | null,
    BillId: Number | null,
    Priority: String | null, // "Normal" | "Urgent"
    LabTestDone: String, // "Yes" | "No"
    ReportsUrl: String | null,
    TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
    TestDoneDateTime: Date | null,
    Status: String, // "Active" | "Inactive"
    CreatedBy: String (UUID) | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    PatientPhoneNo: String | null,
    PatientGender: String | null,
    PatientAge: Number | null,
    PatientAddress: String | null,
    TestName: String | null,
    DisplayTestId: String | null,
    TestCategory: String | null,
    LabTestDescription: String | null,
    LabTestCharges: Number | null,
    PatientAppointmentId: Number | null,
    AppointmentDate: Date | null,
    AppointmentTime: String | null,
    AppointmentTokenNo: Number | null,
    AppointmentStatus: String | null,
    ConsultationCharge: Number | null,
    AppointmentDiagnosis: String | null,
    AppointmentDoctorId: Number | null,
    AppointmentDoctorName: String | null,
    AppointmentDoctorEmail: String | null,
    AppointmentDoctorPhone: String | null,
    AppointmentDoctorQualification: String | null,
    AppointmentDoctorDepartment: String | null,
    BillNo: String | null,
    BillDateTime: Date | null,
    BillAmount: Number | null,
    PaidStatus: String | null,
    CreatedByName: String | null,
    CreatedByEmail: String | null
  }>
} */
router.get('/with-details', patientLabTestController.getPatientLabTestsWithDetails);

/* GET /api/patient-lab-tests/with-details/room-admission/:id
Path Parameters:
  - id: Number (required), // RoomAdmissionId
Response: {
  success: Boolean,
  message: String,
  count: Number,
  roomAdmissionId: Number,
  data: Array<{
    PatientLabTestsId: Number,
    PatientType: String,
    AppointmentId: Number | null,
    TestStatus: String,
    LabTestDone: String,
    Priority: String | null, // "Normal" | "Urgent"
    ReportsUrl: String | null,
    TestDoneDateTime: Date | null,
    Status: String,
    CreatedDate: Date,
    Patient: {
      PatientId: String (UUID),
      PatientName: String,
      PatientNo: String,
      PhoneNo: String | null,
      Gender: String | null,
      Age: Number | null,
      Address: String | null
    },
    LabTest: {
      LabTestId: Number,
      TestName: String,
      DisplayTestId: String,
      TestCategory: String | null,
      Description: String | null,
      Charges: Number | null
    },
    Appointment: Object | null,
    RoomAdmission: Object | null,
    Bill: Object | null,
    CreatedBy: Object | null
  }>
} */
router.get('/with-details/room-admission/:id', patientLabTestController.getPatientLabTestsWithDetailsById);

/* GET /api/patient-lab-tests
Query Parameters:
  - status: String | null, // "Active" | "Inactive"
  - patientType: String | null, // "OPD" | "Emergency" | "IPD" | "Direct"
  - testStatus: String | null, // "Pending" | "InProgress" | "Completed"
  - patientId: String (UUID) | null,
  - labTestId: Number | null
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    PatientLabTestsId: Number,
    PatientType: String, // "OPD" | "Emergency" | "IPD" | "Direct"
    PatientId: String (UUID),
    LabTestId: Number,
    AppointmentId: Number | null,
    RoomAdmissionId: Number | null,
    EmergencyAdmissionId: Number | null,
    BillId: Number | null,
    Priority: String | null, // "Normal" | "Urgent"
    LabTestDone: String, // "Yes" | "No"
    ReportsUrl: String | null,
    TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
    TestDoneDateTime: Date | null,
    Status: String, // "Active" | "Inactive"
    CreatedBy: String (UUID) | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    TestName: String | null,
    DisplayTestId: String | null,
    CreatedByName: String | null,
    AppointmentTokenNo: Number | null,
    BillNo: String | null
  }>
} */
router.get('/', patientLabTestController.getAllPatientLabTests);

/* GET /api/patient-lab-tests/get-folder
Query Parameters:
  - PatientNo_PatientName: String (required), // Format: "PatientNo_PatientName" (e.g., "P001_JohnDoe")
  - date: String (optional), // Format: "YYYY-MM-DD" (e.g., "2025-01-15") - If provided, returns specific date folder
Response (with date):
  {
    success: Boolean,
    message: String,
    PatientNo_PatientName: String,
    date: String,
    folderName: String,
    folderPath: String,
    folderUrl: String,
    filesCount: Number,
    files: Array<{
      fileName: String,
      filePath: String,
      fileUrl: String,
      size: Number,
      createdDate: Date,
      modifiedDate: Date,
      isDirectory: Boolean
    }>
  }
Response (without date - returns all folders):
  {
    success: Boolean,
    message: String,
    PatientNo_PatientName: String,
    count: Number,
    folders: Array<{
      folderName: String,
      folderPath: String,
      folderUrl: String,
      date: String | null,
      createdDate: Date,
      modifiedDate: Date,
      filesCount: Number
    }>
  }
} */
router.get('/get-folder', patientLabTestController.getPatientLabTestFolder);

/* GET /api/patient-lab-tests/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  data: {
    PatientLabTestsId: Number,
    PatientType: String, // "OPD" | "Emergency" | "IPD" | "Direct"
    PatientId: String (UUID),
    LabTestId: Number,
    AppointmentId: Number | null,
    RoomAdmissionId: Number | null,
    EmergencyAdmissionId: Number | null,
    BillId: Number | null,
    Priority: String | null, // "Normal" | "Urgent"
    LabTestDone: String, // "Yes" | "No"
    ReportsUrl: String | null,
    TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
    TestDoneDateTime: Date | null,
    Status: String, // "Active" | "Inactive"
    CreatedBy: String (UUID) | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    TestName: String | null,
    DisplayTestId: String | null,
    CreatedByName: String | null,
    AppointmentTokenNo: Number | null,
    BillNo: String | null
  }
} */
router.get('/:id', patientLabTestController.getPatientLabTestById);

/* POST /api/patient-lab-tests
Request: {
  PatientType: String, (required) // "OPD" | "Emergency" | "IPD" | "Direct"
  PatientId: String (UUID), (required)
  LabTestId: Number, (required)
  AppointmentId: Number | null,
  RoomAdmissionId: Number | null,
  EmergencyAdmissionId: Number | null,
  BillId: Number | null,
  Priority: String | null,
  LabTestDone: String, // "Yes" | "No", defaults to "No"
  ReportsUrl: String | null,
  TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
  TestDoneDateTime: String (timestamp) | null,
  Status: String, // "Active" | "Inactive", defaults to "Active"
  CreatedBy: String (UUID) | null
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientLabTestsId: Number,
    PatientType: String, // "OPD" | "Emergency" | "IPD" | "Direct"
    PatientId: String (UUID),
    LabTestId: Number,
    AppointmentId: Number | null,
    RoomAdmissionId: Number | null,
    EmergencyAdmissionId: Number | null,
    BillId: Number | null,
    Priority: String | null, // "Normal" | "Urgent"
    LabTestDone: String, // "Yes" | "No"
    ReportsUrl: String | null,
    TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
    TestDoneDateTime: Date | null,
    Status: String, // "Active" | "Inactive"
    CreatedBy: String (UUID) | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    TestName: String | null,
    DisplayTestId: String | null,
    CreatedByName: String | null,
    AppointmentTokenNo: Number | null,
    BillNo: String | null
  }
} */
router.post('/', patientLabTestController.createPatientLabTest);

/* POST /api/patient-lab-tests/upload-files
Query Parameters or Form Field:
  - PatientNo_PatientName: String (required), // Format: "PatientNo_PatientName" (e.g., "P001_JohnDoe")
Request Body (multipart/form-data):
  - files: File[] (required), // One or more files to upload (max 10 files, 10MB each)
Response: {
  success: Boolean,
  message: String,
  folderName: String, // Format: "PatientNo_PatientName_YYYY-MM-DD"
  folderPath: String,
  filesCount: Number,
  files: Array<{
    originalName: String,
    fileName: String,
    filePath: String,
    size: Number,
    mimetype: String
  }>
} */
router.post('/upload-files', patientLabTestController.uploadPatientLabTestFiles);

/* PUT /api/patient-lab-tests/:id
Path Parameters:
  - id: Number, (required)
Request: {
  PatientType: String, // "OPD" | "Emergency" | "IPD" | "Direct"
  PatientId: String (UUID),
  LabTestId: Number,
  AppointmentId: Number | null,
  RoomAdmissionId: Number | null,
  EmergencyAdmissionId: Number | null,
  BillId: Number | null,
  Priority: String | null,
  LabTestDone: String, // "Yes" | "No"
  ReportsUrl: String | null,
  TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
  TestDoneDateTime: String (timestamp) | null,
  Status: String, // "Active" | "Inactive"
  CreatedBy: String (UUID) | null
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientLabTestsId: Number,
    PatientType: String, // "OPD" | "Emergency" | "IPD" | "Direct"
    PatientId: String (UUID),
    LabTestId: Number,
    AppointmentId: Number | null,
    RoomAdmissionId: Number | null,
    EmergencyAdmissionId: Number | null,
    BillId: Number | null,
    Priority: String | null, // "Normal" | "Urgent"
    LabTestDone: String, // "Yes" | "No"
    ReportsUrl: String | null,
    TestStatus: String | null, // "Pending" | "InProgress" | "Completed"
    TestDoneDateTime: Date | null,
    Status: String, // "Active" | "Inactive"
    CreatedBy: String (UUID) | null,
    CreatedDate: Date,
    PatientName: String | null,
    PatientNo: String | null,
    TestName: String | null,
    DisplayTestId: String | null,
    CreatedByName: String | null,
    AppointmentTokenNo: Number | null,
    BillNo: String | null
  }
} */
router.put('/:id', patientLabTestController.updatePatientLabTest);

/* DELETE /api/patient-lab-tests/:id
Path Parameters:
  - id: Number, (required)
Response: {
  success: Boolean,
  message: String
} */
router.delete('/:id', patientLabTestController.deletePatientLabTest);

module.exports = router;

