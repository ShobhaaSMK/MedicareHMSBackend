const express = require('express');
const router = express.Router();
const doctorDepartmentController = require('../controllers/doctorDepartmentController');

router.get('/', doctorDepartmentController.getAllDepartments);
router.get('/:id', doctorDepartmentController.getDepartmentById);
router.post('/', doctorDepartmentController.createDepartment);
router.put('/:id', doctorDepartmentController.updateDepartment);
router.delete('/:id', doctorDepartmentController.deleteDepartment);

module.exports = router;

