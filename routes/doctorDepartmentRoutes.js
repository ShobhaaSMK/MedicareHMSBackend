const express = require('express');
const router = express.Router();
const doctorDepartmentController = require('../controllers/doctorDepartmentController');

/* GET /api/doctor-departments
Query params: ?status=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    DoctorDepartmentId: Number,
    DepartmentName: String,
    DepartmentCategory: String | null,
    SpecialisationDetails: String | null,
    NoOfDoctors: Number,
    Status: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }]
} */
router.get('/', doctorDepartmentController.getAllDepartments);

/* GET /api/doctor-departments/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    DoctorDepartmentId: Number,
    DepartmentName: String,
    DepartmentCategory: String | null,
    SpecialisationDetails: String | null,
    NoOfDoctors: Number,
    Status: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.get('/:id', doctorDepartmentController.getDepartmentById);

/* POST /api/doctor-departments
Request: {
  DepartmentName: String (required),
  DepartmentCategory: String (optional), // "Clinical" | "Surgical" | "Diagnostic" | "Critical Care" | "Support"
  SpecialisationDetails: String (optional),
  NoOfDoctors: Number (optional), // Defaults to 0
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    DoctorDepartmentId: Number,
    DepartmentName: String,
    DepartmentCategory: String | null,
    SpecialisationDetails: String | null,
    NoOfDoctors: Number,
    Status: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.post('/', doctorDepartmentController.createDepartment);

/* PUT /api/doctor-departments/:id
Params: id (Number)
Request: {
  DepartmentName: String (optional),
  DepartmentCategory: String (optional), // "Clinical" | "Surgical" | "Diagnostic" | "Critical Care" | "Support"
  SpecialisationDetails: String (optional),
  NoOfDoctors: Number (optional),
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    DoctorDepartmentId: Number,
    DepartmentName: String,
    DepartmentCategory: String | null,
    SpecialisationDetails: String | null,
    NoOfDoctors: Number,
    Status: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.put('/:id', doctorDepartmentController.updateDepartment);

/* DELETE /api/doctor-departments/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    DoctorDepartmentId: Number,
    DepartmentName: String,
    DepartmentCategory: String | null,
    SpecialisationDetails: String | null,
    NoOfDoctors: Number,
    Status: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.delete('/:id', doctorDepartmentController.deleteDepartment);

module.exports = router;

