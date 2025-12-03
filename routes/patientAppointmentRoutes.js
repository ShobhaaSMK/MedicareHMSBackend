const express = require('express');
const router = express.Router();
const patientAppointmentController = require('../controllers/patientAppointmentController');

router.get('/count/today-active', patientAppointmentController.getTodayActiveAppointmentsCount);
router.get('/count/active', patientAppointmentController.getActiveAppointmentsCountByDate);
router.get('/count/doctor-wise', patientAppointmentController.getDoctorWisePatientCount);
router.get('/count/status', patientAppointmentController.getAppointmentCountsByStatus);
router.get('/count/active-tokens', patientAppointmentController.getActiveTokensCount);
router.get('/', patientAppointmentController.getAllAppointments);
router.get('/:id', patientAppointmentController.getAppointmentById);
router.post('/', patientAppointmentController.createAppointment);
router.put('/:id', patientAppointmentController.updateAppointment);
router.delete('/:id', patientAppointmentController.deleteAppointment);

module.exports = router;

