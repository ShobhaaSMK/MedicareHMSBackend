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

/* GET /api/patient-icu-admissions/occupancy
Response: {
  success: Boolean,
  message: String,
  date: String (YYYY-MM-DD),
  data: {
    occupiedAdmissions: Number,
    totalICUBeds: Number,
    availableICUBeds: Number,
    occupancy: String, // "occupied/total" format (e.g., "5/10")
    occupancyRate: Number, // 0-100
    occupancyPercentage: String // "50%"
  }
} */
router.get('/occupancy', patientICUAdmissionController.getICUOccupancyData);

/* GET /api/patient-icu-admissions/available-beds
Response: {
  success: Boolean,
  message: String,
  date: String (YYYY-MM-DD),
  count: Number,
  data: {
    count: Number,
    criteria: {
      table: String,
      conditions: {
        status: String, // "Active"
        notOccupied: String // "Not in PatientICUAdmission with Occupied status for current date"
      }
    }
  }
} */
router.get('/available-beds', patientICUAdmissionController.getAvailableICUBeds);

/* GET /api/patient-icu-admissions/check-occupied
Query Parameters:
  - icuId: Number (required) - The ICU ID to check
Response: {
  success: Boolean,
  message: String,
  data: {
    icuId: Number,
    isOccupied: Boolean,
    admission: {
      PatientICUAdmissionId: String (UUID) | null,
      PatientId: String (UUID) | null,
      ICUId: Number | null,
      ICUAdmissionStatus: String | null, // "Occupied" | "Discharged"
      ICUAllocationFromDate: Date | null,
      ICUAllocationToDate: Date | null,
      PatientName: String | null,
      PatientNo: String | null,
      ICUNo: String | null,
      // ... other admission fields
    } | null
  }
} */
router.get('/check-occupied', patientICUAdmissionController.checkIfICUBedIsOccupied);

/* GET /api/patient-icu-admissions/check-availability
Query Parameters:
  - icuId: Number (required) - The ICUId to check availability for
  - checkDate: String (optional) - Date to check availability for in YYYY-MM-DD format (defaults to today)
  - allocationFromDate: String (optional) - Alternative parameter name for checkDate
  - ICUAllocationFromDate: String (optional) - Alternative parameter name for checkDate
Response: {
  success: Boolean,
  message: String,
  data: {
    icuId: Number,
    icuBedNo: String | null,
    icuType: String | null,
    icuRoomNameNo: String | null,
    checkDate: String (YYYY-MM-DD),
    isAvailable: Boolean,
    reason: String,
    conflictingAdmissions: Array<{
      PatientICUAdmissionId: String (UUID),
      PatientName: String | null,
      PatientNo: String | null,
      ICUAllocationFromDate: Date,
      ICUAllocationToDate: Date | null,
      ICUAdmissionStatus: String,
      ICUPatientStatus: String | null
    }>,
    conflictingCount: Number
  }
} */
router.get('/check-availability', patientICUAdmissionController.checkICUAvailability);

/* GET /api/patient-icu-admissions/icu-management
Response: {
  success: Boolean,
  message: String,
  date: String (YYYY-MM-DD),
  count: Number,
  data: Array<{
    // ICU Bed Details
    icuId: Number,
    icuBedNo: String,
    icuType: String | null,
    icuRoomNameNo: String | null,
    icuDescription: String | null,
    isVentilatorAttached: String, // "Yes" | "No"
    icuStartTimeofDay: Time | null,
    icuEndTimeofDay: Time | null,
    icuStatus: String, // "Active" | "Inactive"
    icuCreatedBy: Number | null,
    icuCreatedAt: Date | null,
    // Admission Details (null if bed is available)
    patientICUAdmissionId: String (UUID) | null,
    patientId: String (UUID) | null,
    patientAppointmentId: Number | null,
    emergencyBedSlotId: Number | null,
    roomAdmissionId: Number | null,
    icuPatientStatus: String | null, // "Serious" | "Available" | "Critical" | "Stable"
    icuAdmissionStatus: String | null, // "Occupied" | "Discharged"
    icuAllocationFromDate: Date | null,
    icuAllocationToDate: Date | null,
    numberOfDays: Number | null,
    diagnosis: String | null,
    treatementDetails: String | null,
    patientCondition: String | null,
    icuAllocationCreatedBy: Number | null,
    icuAllocationCreatedAt: Date | null,
    admissionStatus: String | null, // "Active" | "Inactive"
    onVentilator: String | null, // "Yes" | "No"
    // Patient Details (null if bed is available)
    patientName: String | null,
    patientNo: String | null,
    patientAge: Number | null,
    patientGender: String | null,
    patientPhoneNo: String | null,
    appointmentTokenNo: Number | null,
    createdByName: String | null,
    // Computed field
    isOccupied: Boolean
  }>
} */
router.get('/icu-management', patientICUAdmissionController.getICUAdmissionsforICUMgmt);

/* GET /api/patient-icu-admissions/icu-beds-details
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: Array<{
    // ICU Bed Details
    icuId: Number,
    icuBedNo: String,
    icuType: String | null,
    icuRoomNameNo: String | null,
    icuDescription: String | null,
    isVentilatorAttached: String, // "Yes" | "No"
    icuStartTimeofDay: Time | null,
    icuEndTimeofDay: Time | null,
    icuStatus: String, // "Active" | "Inactive"
    icuCreatedBy: Number | null,
    icuCreatedAt: Date | null,
    // Array of all admission records for this bed
    admissions: Array<{
      patientICUAdmissionId: String (UUID) | null,
      patientId: String (UUID) | null,
      patientAppointmentId: Number | null,
      emergencyBedSlotId: Number | null,
      roomAdmissionId: Number | null,
      icuPatientStatus: String | null,
      icuAdmissionStatus: String | null,
      icuAllocationFromDate: Date | null,
      icuAllocationToDate: Date | null,
      numberOfDays: Number | null,
      diagnosis: String | null,
      treatementDetails: String | null,
      patientCondition: String | null,
      icuAllocationCreatedBy: Number | null,
      icuAllocationCreatedAt: Date | null,
      admissionStatus: String | null,
      onVentilator: String | null,
      attendingDoctorId: Number | null,
      patientName: String | null,
      patientNo: String | null,
      patientAge: Number | null,
      patientGender: String | null,
      patientPhoneNo: String | null,
      appointmentTokenNo: Number | null,
      appointmentDate: Date | null,
      appointmentTime: Time | null,
      createdByName: String | null
    }>
  }>
} */
router.get('/icu-beds-details', patientICUAdmissionController.getICUBedsDetailsMgmt);

/* GET /api/patient-icu-admissions/icu-beds-details/:id
Path Parameters:
  - id: Number (required), // ICUId
Response: {
  success: Boolean,
  message: String,
  data: {
    // ICU Bed Details
    icuId: Number,
    icuBedNo: String,
    icuType: String | null,
    icuRoomNameNo: String | null,
    icuDescription: String | null,
    isVentilatorAttached: String, // "Yes" | "No"
    icuStartTimeofDay: Time | null,
    icuEndTimeofDay: Time | null,
    icuStatus: String, // "Active" | "Inactive"
    icuCreatedBy: Number | null,
    icuCreatedAt: Date | null,
    // Array of all admission records for this bed
    admissions: Array<{
      patientICUAdmissionId: String (UUID) | null,
      patientId: String (UUID) | null,
      patientAppointmentId: Number | null,
      emergencyBedSlotId: Number | null,
      roomAdmissionId: Number | null,
      icuPatientStatus: String | null,
      icuAdmissionStatus: String | null,
      icuAllocationFromDate: Date | null,
      icuAllocationToDate: Date | null,
      numberOfDays: Number | null,
      diagnosis: String | null,
      treatementDetails: String | null,
      patientCondition: String | null,
      icuAllocationCreatedBy: Number | null,
      icuAllocationCreatedAt: Date | null,
      admissionStatus: String | null,
      onVentilator: String | null,
      attendingDoctorId: Number | null,
      patientName: String | null,
      patientNo: String | null,
      patientAge: Number | null,
      patientGender: String | null,
      patientPhoneNo: String | null,
      appointmentTokenNo: Number | null,
      appointmentDate: Date | null,
      appointmentTime: Time | null,
      createdByName: String | null
    }>,
    admissionCount: Number
  }
} */
router.get('/icu-beds-details/:id', patientICUAdmissionController.getICUBedsDetailsMgmtByICUId);

/* GET /api/patient-icu-admissions/icu-beds-details/bed/:icuBedId
Path Parameters:
  - icuBedId: String (required), // ICUBedNo
Response: {
  success: Boolean,
  message: String,
  data: {
    // ICU Bed Details
    icuId: Number,
    icuBedNo: String,
    icuType: String | null,
    icuRoomNameNo: String | null,
    icuDescription: String | null,
    isVentilatorAttached: String, // "Yes" | "No"
    icuStartTimeofDay: Time | null,
    icuEndTimeofDay: Time | null,
    icuStatus: String, // "Active" | "Inactive"
    icuCreatedBy: Number | null,
    icuCreatedAt: Date | null,
    // Array of all admission records for this bed
    admissions: Array<{
      patientICUAdmissionId: String (UUID) | null,
      patientId: String (UUID) | null,
      patientAppointmentId: Number | null,
      emergencyBedSlotId: Number | null,
      roomAdmissionId: Number | null,
      icuPatientStatus: String | null,
      icuAdmissionStatus: String | null,
      icuAllocationFromDate: Date | null,
      icuAllocationToDate: Date | null,
      numberOfDays: Number | null,
      diagnosis: String | null,
      treatementDetails: String | null,
      patientCondition: String | null,
      icuAllocationCreatedBy: Number | null,
      icuAllocationCreatedAt: Date | null,
      admissionStatus: String | null,
      onVentilator: String | null,
      attendingDoctorId: Number | null,
      patientName: String | null,
      patientNo: String | null,
      patientAge: Number | null,
      patientGender: String | null,
      patientPhoneNo: String | null,
      appointmentTokenNo: Number | null,
      appointmentDate: Date | null,
      appointmentTime: Time | null,
      createdByName: String | null
    }>,
    admissionCount: Number
  }
} */
router.get('/icu-beds-details/bed/:icuBedId', patientICUAdmissionController.getICUBedsDetailsMgmtByICUBedId);

/* GET /api/patient-icu-admissions/icu-management/:id
Path Parameters:
  - id: String (UUID), (required) // PatientICUAdmissionId
Response: {
  success: Boolean,
  message: String,
  data: {
    icu: {
      icuId: Number,
      icuBedNo: String,
      icuType: String | null,
      icuRoomNameNo: String | null,
      icuDescription: String | null,
      isVentilatorAttached: String, // "Yes" | "No"
      icuStartTimeofDay: Time | null,
      icuEndTimeofDay: Time | null,
      icuStatus: String, // "Active" | "Inactive"
      icuCreatedBy: Number | null,
      icuCreatedAt: Date | null
    },
    admission: {
      patientICUAdmissionId: String (UUID),
      patientId: String (UUID),
      patientAppointmentId: Number | null,
      emergencyBedSlotId: Number | null,
      roomAdmissionId: Number | null,
      icuId: Number,
      icuPatientStatus: String | null,
      icuAdmissionStatus: String | null,
      icuAllocationFromDate: Date | null,
      icuAllocationToDate: Date | null,
      numberOfDays: Number | null,
      diagnosis: String | null,
      treatementDetails: String | null,
      patientCondition: String | null,
      icuAllocationCreatedBy: Number | null,
      icuAllocationCreatedAt: Date | null,
      admissionStatus: String | null,
      onVentilator: String | null, // "Yes" | "No"
      attendingDoctorId: Number | null
    },
    patient: {
      patientId: String (UUID),
      patientName: String,
      patientNo: String,
      age: Number | null,
      gender: String | null,
      phoneNo: String | null,
      emailId: String | null,
      address: String | null,
      dateOfBirth: Date | null,
      bloodGroup: String | null,
      emergencyContactName: String | null,
      emergencyContactPhone: String | null,
      patientStatus: String | null
    },
    appointment: {
      patientAppointmentId: Number | null,
      tokenNo: Number | null,
      appointmentDate: Date | null,
      appointmentTime: Time | null,
      appointmentStatus: String | null
    } | null,
    createdBy: {
      userId: Number | null,
      userName: String | null,
      emailId: String | null,
      phoneNo: String | null
    } | null
  }
} */
router.get('/icu-management/:id', patientICUAdmissionController.getICUAdmissionsforICUMgmtByPatientICUAdmissionId);

/* GET /api/patient-icu-admissions/count/critical
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: {
    count: Number,
    criteria: {
      table: String,
      conditions: {
        icuPatientStatus: String, // "Critical"
        status: String, // "Active"
        icuAdmissionStatus: String // "Occupied"
      }
    }
  }
} */
router.get('/count/critical', patientICUAdmissionController.getCriticalPatientsCount);

/* GET /api/patient-icu-admissions/count/on-ventilator
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: {
    count: Number,
    criteria: {
      table: String,
      conditions: {
        onVentilator: String, // "Yes"
        status: String, // "Active"
        icuAdmissionStatus: String // "Occupied"
      }
    }
  }
} */
router.get('/count/on-ventilator', patientICUAdmissionController.getOnVentilatorPatientsCount);

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
    EmergencyAdmissionId: Number | null,
    EmergencyBedId: Number | null,
    RoomAdmissionId: Number | null,
    PatientType: String | null, // "OPD" | "IPD" | "Emergency" | "Direct"
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
    OnVentilator: String, // "Yes" | "No"
    AttendingDoctorId: Number | null
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
    EmergencyAdmissionId: Number | null,
    EmergencyBedId: Number | null,
    RoomAdmissionId: Number | null,
    PatientType: String | null, // "OPD" | "IPD" | "Emergency" | "Direct"
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
    OnVentilator: String, // "Yes" | "No"
    AttendingDoctorId: Number | null
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
  EmergencyAdmissionId: Number | null,
  EmergencyBedId: Number | null,
  RoomAdmissionId: Number | null,
  PatientType: String | null, // "OPD" | "IPD" | "Emergency" | "Direct"
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
  OnVentilator: String, // "Yes" | "No", defaults to "No"
  AttendingDoctorId: Number | null, (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyAdmissionId: Number | null,
    EmergencyBedId: Number | null,
    RoomAdmissionId: Number | null,
    PatientType: String | null, // "OPD" | "IPD" | "Emergency" | "Direct"
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
    OnVentilator: String, // "Yes" | "No"
    AttendingDoctorId: Number | null
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
  EmergencyAdmissionId: Number | null,
  EmergencyBedId: Number | null,
  RoomAdmissionId: Number | null,
  PatientType: String | null, // "OPD" | "IPD" | "Emergency" | "Direct"
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
  OnVentilator: String, // "Yes" | "No"
  AttendingDoctorId: Number | null
}
Response: {
  success: Boolean,
  message: String,
  data: {
    PatientICUAdmissionId: String (UUID),
    PatientId: String (UUID),
    PatientAppointmentId: Number | null,
    EmergencyAdmissionId: Number | null,
    EmergencyBedId: Number | null,
    RoomAdmissionId: Number | null,
    PatientType: String | null, // "OPD" | "IPD" | "Emergency" | "Direct"
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
    OnVentilator: String, // "Yes" | "No"
    AttendingDoctorId: Number | null
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

