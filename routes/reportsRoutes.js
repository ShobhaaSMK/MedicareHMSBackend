const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// Doctor Performance Comparison - IPD and OPD patients count by doctor
router.get('/doctor-performance-comparison', reportsController.getDoctorPerformanceComparison);

// OPD Patient Flow - Weekly Trend (OPD vs IPD by day of week)
router.get('/opd-patient-flow-weekly-trend', reportsController.getOPDPatientFlowWeeklyTrend);

// Department-wise IPD Admissions report
router.get('/department-wise-ipd-admissions', reportsController.getDepartmentWiseIPDAdmissions);

// Daily Surgery Schedule report
router.get('/daily-surgery-schedule', reportsController.getDailySurgerySchedule);

// ICU Occupancy Trend report
router.get('/icu-occupancy-trend', reportsController.getICUOccupancyTrend);

module.exports = router;

