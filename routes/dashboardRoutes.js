const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/icu-occupied-count', dashboardController.getICUOccupiedPatientsCount);
router.get('/icu-total-count', dashboardController.getTotalICUCount);
router.get('/active-patients-count', dashboardController.getActivePatientsCount);
router.get('/doctor-wise-appointment-counts', dashboardController.getDoctorWiseAppointmentCounts);
router.get('/ipd-room-distribution', dashboardController.getIPDRoomDistribution);
router.get('/opd-patient-flow-weekly', dashboardController.getOPDPatientFlowWeekly);
router.get('/count/today-opd', dashboardController.getTodayOPDPatientsCount);
router.get('/count/active-tokens', dashboardController.getActiveTokensCount);
router.get('/count/today-ipd', dashboardController.getTodayIPDAdmissionsCount);
router.get('/count/today-scheduled', dashboardController.getTodayOTScheduledCount);
router.get('/departments', dashboardController.getAllDepartments);

module.exports = router;
