const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/* GET /api/users/count/role-wise
Query params: ?status=String (optional)
Response: {
  success: Boolean,
  count: Number,
  totalUsers: Number,
  totalActiveUsers: Number,
  totalInactiveUsers: Number,
  filters: {
    status: String | null
  },
  data: [{
    RoleId: String (UUID),
    RoleName: String,
    RoleDescription: String | null,
    UserCount: Number,
    ActiveUserCount: Number,
    InactiveUserCount: Number
  }]
} */
router.get('/count/role-wise', userController.getRoleWiseUserCount);

/* GET /api/users
Query params: ?status=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    UserId: Number,
    RoleId: String (UUID),
    UserName: String,
    PhoneNo: String | null,
    EmailId: String | null,
    DoctorDepartmentId: String (UUID) | null,
    DoctorQualification: String | null,
    DoctorType: String | null, // "INHOUSE" | "VISITING"
    DoctorOPDCharge: Number | null,
    DoctorSurgeryCharge: Number | null,
    OPDConsultation: String | null, // "Yes" | "No"
    IPDVisit: String | null, // "Yes" | "No"
    OTHandle: String | null, // "Yes" | "No"
    ICUVisits: String | null, // "Yes" | "No"
    Status: String, // "Active" | "InActive"
    CreatedBy: Number | null,
    CreatedAt: Date,
    RoleName: String | null,
    DepartmentName: String | null
  }]
} */
router.get('/', userController.getAllUsers);

/* GET /api/users/:id/doctor-details
Params: id (Number) - UserId/Staff ID
Response: {
  success: Boolean,
  data: {
    doctor: {
      UserId: Number,
      RoleId: String (UUID),
      UserName: String,
      PhoneNo: String | null,
      EmailId: String | null,
      DoctorDepartmentId: String (UUID) | null,
      DoctorQualification: String | null,
      DoctorType: String | null,
      DoctorOPDCharge: Number | null,
      DoctorSurgeryCharge: Number | null,
      OPDConsultation: String | null,
      IPDVisit: String | null,
      OTHandle: String | null,
      ICUVisits: String | null,
      Status: String,
      CreatedBy: Number | null,
      CreatedAt: Date,
      RoleName: String | null,
      DepartmentName: String | null
    },
    statistics: {
      appointments: {
        total: Number,
        waiting: Number,
        consulting: Number,
        completed: Number,
        today: Number,
        uniquePatients: Number
      },
      labTests: {
        total: Number,
        pending: Number,
        inProgress: Number,
        completed: Number
      },
      icuVisits: {
        total: Number,
        today: Number
      },
      roomAdmissions: {
        total: Number,
        active: Number,
        discharged: Number
      },
      patientAdmitVisits: {
        total: Number,
        today: Number
      },
      otAllocations: {
        total: Number,
        scheduled: Number,
        inProgress: Number,
        completed: Number
      },
      emergencyAdmissions: {
        total: Number,
        active: Number
      },
      icuAdmissions: {
        total: Number,
        active: Number
      }
    }
  }
} */
router.get('/:id/doctor-details', userController.getDoctorDetails);

/* GET /api/users/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    UserId: Number,
    RoleId: String (UUID),
    UserName: String,
    PhoneNo: String | null,
    EmailId: String | null,
    DoctorDepartmentId: String (UUID) | null,
    DoctorQualification: String | null,
    DoctorType: String | null, // "INHOUSE" | "VISITING"
    DoctorOPDCharge: Number | null,
    DoctorSurgeryCharge: Number | null,
    OPDConsultation: String | null, // "Yes" | "No"
    IPDVisit: String | null, // "Yes" | "No"
    OTHandle: String | null, // "Yes" | "No"
    ICUVisits: String | null, // "Yes" | "No"
    Status: String, // "Active" | "InActive"
    CreatedBy: Number | null,
    CreatedAt: Date,
    RoleName: String | null,
    DepartmentName: String | null
  }
} */
router.get('/:id', userController.getUserById);

/* POST /api/users
Request: {
  RoleId: String (UUID) (required),
  UserName: String (required),
  Password: String (required),
  PhoneNo: String (optional),
  EmailId: String (optional),
  DoctorDepartmentId: String (UUID) (optional),
  DoctorQualification: String (optional),
  DoctorType: String (optional), // "INHOUSE" | "VISITING"
  DoctorOPDCharge: Number (optional),
  DoctorSurgeryCharge: Number (optional),
  OPDConsultation: String (optional), // "Yes" | "No"
  IPDVisit: String (optional), // "Yes" | "No"
  OTHandle: String (optional), // "Yes" | "No"
  ICUVisits: String (optional), // "Yes" | "No"
  Status: String (optional), // "Active" | "InActive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    UserId: Number,
    RoleId: String (UUID),
    UserName: String,
    PhoneNo: String | null,
    EmailId: String | null,
    DoctorDepartmentId: String (UUID) | null,
    DoctorQualification: String | null,
    DoctorType: String | null,
    DoctorOPDCharge: Number | null,
    DoctorSurgeryCharge: Number | null,
    OPDConsultation: String | null,
    IPDVisit: String | null,
    OTHandle: String | null,
    ICUVisits: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    RoleName: String | null,
    DepartmentName: String | null
  }
} */
router.post('/', userController.createUser);

/* PUT /api/users/:id
Params: id (Number)
Request: {
  RoleId: String (UUID) (optional),
  UserName: String (optional),
  Password: String (optional),
  PhoneNo: String (optional),
  EmailId: String (optional),
  DoctorDepartmentId: String (UUID) (optional),
  DoctorQualification: String (optional),
  DoctorType: String (optional), // "INHOUSE" | "VISITING"
  DoctorOPDCharge: Number (optional),
  DoctorSurgeryCharge: Number (optional),
  OPDConsultation: String (optional), // "Yes" | "No"
  IPDVisit: String (optional), // "Yes" | "No"
  OTHandle: String (optional), // "Yes" | "No"
  ICUVisits: String (optional), // "Yes" | "No"
  Status: String (optional), // "Active" | "InActive"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    UserId: Number,
    RoleId: String (UUID),
    UserName: String,
    PhoneNo: String | null,
    EmailId: String | null,
    DoctorDepartmentId: String (UUID) | null,
    DoctorQualification: String | null,
    DoctorType: String | null,
    DoctorOPDCharge: Number | null,
    DoctorSurgeryCharge: Number | null,
    OPDConsultation: String | null,
    IPDVisit: String | null,
    OTHandle: String | null,
    ICUVisits: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    RoleName: String | null,
    DepartmentName: String | null
  }
} */
router.put('/:id', userController.updateUser);

/* DELETE /api/users/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    UserId: Number,
    RoleId: String (UUID),
    UserName: String,
    PhoneNo: String | null,
    EmailId: String | null,
    DoctorDepartmentId: String (UUID) | null,
    DoctorQualification: String | null,
    DoctorType: String | null,
    DoctorOPDCharge: Number | null,
    DoctorSurgeryCharge: Number | null,
    OPDConsultation: String | null,
    IPDVisit: String | null,
    OTHandle: String | null,
    ICUVisits: String | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date,
    RoleName: String | null,
    DepartmentName: String | null
  }
} */
router.delete('/:id', userController.deleteUser);

module.exports = router;

