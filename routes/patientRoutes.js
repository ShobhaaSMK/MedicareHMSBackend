const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

/* GET /api/patients/count/total-by-date
Query params: ?date=YYYY-MM-DD (required)
Response: {
  success: Boolean,
  message: String,
  date: String,
  counts: {
    ipd: Number,
    opd: Number,
    emergency: Number,
    total: Number
  },
  data: {
    date: String,
    ipdCount: Number,
    opdCount: Number,
    emergencyCount: Number,
    totalCount: Number,
    breakdown: {
      ipd: String,
      opd: String,
      emergency: String
    }
  }
} */
router.get('/count/total-by-date', patientController.getTotalPatientsCountByDate);

/* GET /api/patients/count/weekly-opd
Query params: ?date=YYYY-MM-DD (optional, defaults to current week)
Response: {
  success: Boolean,
  message: String,
  weekStartDate: String,
  weekEndDate: String,
  data: [{
    appointment_date: String (YYYY-MM-DD),
    day_name: String,
    patient_count: Number
  }]
} */
router.get('/count/weekly-opd', patientController.getWeeklyOPDPatientsCount);

/* GET /api/patients
Query params: ?status=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    PatientId: String (UUID),
    PatientNo: String,
    PatientName: String,
    LastName: String | null,
    PhoneNo: String,
    Gender: String | null,
    Age: Number | null,
    Address: String | null,
    AdhaarID: String | null,
    PANCard: String | null,
    PatientType: String | null,
    ChiefComplaint: String | null,
    Description: String | null,
    Status: String,
    RegisteredBy: Number,
    RegisteredDate: Date,
    RegisteredByUserName: String | null
  }]
} */
router.get('/', patientController.getAllPatients);

/* GET /api/patients/:id
Params: id (String UUID)
Response: {
  success: Boolean,
  data: {
    PatientId: String (UUID),
    PatientNo: String,
    PatientName: String,
    LastName: String | null,
    PhoneNo: String,
    Gender: String | null,
    Age: Number | null,
    Address: String | null,
    AdhaarID: String | null,
    PANCard: String | null,
    PatientType: String | null,
    ChiefComplaint: String | null,
    Description: String | null,
    Status: String,
    RegisteredBy: Number,
    RegisteredDate: Date,
    RegisteredByUserName: String | null
  }
} */
router.get('/:id', patientController.getPatientById);

/* POST /api/patients
Request: {
  PatientName: String (required),
  LastName: String (optional),
  PhoneNo: String (required),
  Gender: String (optional), // "Male" | "Female"
  Age: Number (optional),
  Address: String (optional),
  AdhaarID: String (optional), // Must be exactly 12 digits
  PANCard: String (optional), // Format: ABCDE1234F
  PatientType: String (optional), // "OPD" | "IPD" | "Emergency" | "Direct"
  ChiefComplaint: String (optional),
  Description: String (optional),
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  RegisteredBy: Number (required)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientId: String (UUID),
    PatientNo: String,
    PatientName: String,
    LastName: String | null,
    PhoneNo: String,
    Gender: String | null,
    Age: Number | null,
    Address: String | null,
    AdhaarID: String | null,
    PANCard: String | null,
    PatientType: String | null,
    ChiefComplaint: String | null,
    Description: String | null,
    Status: String,
    RegisteredBy: Number,
    RegisteredDate: Date,
    RegisteredByUserName: String | null
  }
} */
router.post('/', patientController.createPatient);

/* PUT /api/patients/:id
Params: id (String UUID)
Request: {
  PatientName: String (optional),
  LastName: String (optional),
  PhoneNo: String (optional),
  Gender: String (optional), // "Male" | "Female"
  Age: Number (optional),
  Address: String (optional),
  AdhaarID: String (optional), // Must be exactly 12 digits
  PANCard: String (optional), // Format: ABCDE1234F
  PatientType: String (optional), // "OPD" | "IPD" | "Emergency" | "Direct"
  ChiefComplaint: String (optional),
  Description: String (optional),
  Status: String (optional), // "Active" | "Inactive"
  RegisteredBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientId: String (UUID),
    PatientNo: String,
    PatientName: String,
    LastName: String | null,
    PhoneNo: String,
    Gender: String | null,
    Age: Number | null,
    Address: String | null,
    AdhaarID: String | null,
    PANCard: String | null,
    PatientType: String | null,
    ChiefComplaint: String | null,
    Description: String | null,
    Status: String,
    RegisteredBy: Number,
    RegisteredDate: Date,
    RegisteredByUserName: String | null
  }
} */
router.put('/:id', patientController.updatePatient);

/* DELETE /api/patients/:id
Params: id (String UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientId: String (UUID),
    PatientNo: String,
    PatientName: String,
    LastName: String | null,
    PhoneNo: String,
    Gender: String | null,
    Age: Number | null,
    Address: String | null,
    AdhaarID: String | null,
    PANCard: String | null,
    PatientType: String | null,
    ChiefComplaint: String | null,
    Description: String | null,
    Status: String,
    RegisteredBy: Number,
    RegisteredDate: Date,
    RegisteredByUserName: String | null
  }
} */
router.delete('/:id', patientController.deletePatient);

module.exports = router;

