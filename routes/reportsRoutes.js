const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

/* GET /api/reports/doctor-performance-comparison
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - startDate: String (YYYY-MM-DD) | null, // Optional, filter IPD by RoomAllocationDate and OPD by AppointmentDate
  - endDate: String (YYYY-MM-DD) | null // Optional, filter IPD by RoomAllocationDate and OPD by AppointmentDate
Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range.
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    date: String | null,
    startDate: String | null,
    endDate: String | null
  },
  summary: {
    totalDoctors: Number,
    totalIPDPatients: Number,
    totalOPDPatients: Number,
    totalPatients: Number
  },
  data: Array<{
    doctorId: Number,
    doctorName: String,
    doctorEmail: String | null,
    doctorPhone: String | null,
    doctorQualification: String | null,
    departmentName: String | null,
    ipdPatientCount: Number,
    opdPatientCount: Number
  }>,
  chartData: {
    labels: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number
    }>
  }
} */
router.get('/doctor-performance-comparison', reportsController.getDoctorPerformanceComparison);

/* GET /api/reports/opd-patient-flow-weekly-trend
Query Parameters:
  - date: String (YYYY-MM-DD) | null // Optional, defaults to current week starting from Monday
Note: Use this to select which week to view. The date will determine the week (Monday to Sunday).
Response: {
  success: Boolean,
  message: String,
  week: {
    startDate: String (YYYY-MM-DD),
    endDate: String (YYYY-MM-DD)
  },
  summary: {
    totalOPDPatients: Number,
    totalIPDAdmissions: Number,
    totalPatients: Number
  },
  data: Array<{
    date: String (YYYY-MM-DD),
    day: String, // "Monday", "Tuesday", etc.
    dayNumber: Number, // 0-6 (0=Sunday, 1=Monday, etc.)
    opdPatientCount: Number,
    ipdAdmissionCount: Number,
    totalCount: Number
  }>,
  chartData: {
    labels: Array<String>,
    dates: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number,
      tension: Number
    }>
  }
} */
router.get('/opd-patient-flow-weekly-trend', reportsController.getOPDPatientFlowWeeklyTrend);

/* GET /api/reports/department-wise-ipd-admissions
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - startDate: String (YYYY-MM-DD) | null, // Optional, filter by RoomAllocationDate
  - endDate: String (YYYY-MM-DD) | null // Optional, filter by RoomAllocationDate
Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range.
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    date: String | null,
    startDate: String | null,
    endDate: String | null
  },
  summary: {
    totalDepartments: Number,
    totalIPDAdmissions: Number
  },
  data: Array<{
    departmentId: String (UUID) | null,
    departmentName: String,
    ipdAdmissionCount: Number,
    totalAdmissions: Number,
    percentage: String
  }>,
  chartData: {
    labels: Array<String>,
    values: Array<Number>,
    percentages: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: Array<String>,
      borderColor: Array<String>,
      borderWidth: Number
    }>
  }
} */
router.get('/department-wise-ipd-admissions', reportsController.getDepartmentWiseIPDAdmissions);

/* GET /api/reports/daily-surgery-schedule
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - startDate: String (YYYY-MM-DD) | null, // Optional, filter by OTAllocationDate, defaults to last 7 days
  - endDate: String (YYYY-MM-DD) | null // Optional, filter by OTAllocationDate, defaults to today
Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range (defaults to last 7 days).
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    date: String | null,
    startDate: String,
    endDate: String
  },
  summary: {
    totalScheduled: Number,
    totalCompleted: Number,
    totalInProgress: Number,
    totalCancelled: Number,
    totalPostponed: Number,
    totalSurgeries: Number
  },
  data: Array<{
    date: String (YYYY-MM-DD),
    scheduledCount: Number,
    completedCount: Number,
    inProgressCount: Number,
    cancelledCount: Number,
    postponedCount: Number,
    totalCount: Number
  }>,
  chartData: {
    labels: Array<String>,
    dates: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number,
      tension: Number
    }>
  }
} */
router.get('/daily-surgery-schedule', reportsController.getDailySurgerySchedule);

/* GET /api/reports/icu-occupancy-trend
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - startDate: String (YYYY-MM-DD) | null, // Optional, defaults to last 7 days
  - endDate: String (YYYY-MM-DD) | null // Optional, defaults to today
Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range (defaults to last 7 days).
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    date: String | null,
    startDate: String,
    endDate: String
  },
  summary: {
    totalICUBeds: Number,
    totalOccupied: Number,
    averageOccupied: Number,
    maxOccupied: Number,
    minOccupied: Number,
    averageOccupancyPercentage: String
  },
  data: Array<{
    date: String (YYYY-MM-DD),
    totalICUBeds: Number,
    occupiedICUBeds: Number,
    availableICUBeds: Number,
    occupancyPercentage: String
  }>,
  chartData: {
    labels: Array<String>,
    dates: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number,
      borderDash?: Array<Number>,
      tension: Number
    }>
  }
} */
router.get('/icu-occupancy-trend', reportsController.getICUOccupancyTrend);

/* GET /api/reports/doctor-wise-patient-statistics
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - weekDate: String (YYYY-MM-DD) | null, // Optional, for weekly report (uses the week containing this date)
  - startDate: String (YYYY-MM-DD) | null, // Optional, filter by date range start
  - endDate: String (YYYY-MM-DD) | null // Optional, filter by date range end
Note: Priority: If 'date' is provided, it will be used for daily report. If 'weekDate' is provided, it will be used for weekly report. Otherwise, use startDate/endDate range.
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    reportType: String, // "daily" | "weekly" | "custom"
    date: String | null,
    weekDate: String | null,
    startDate: String | null,
    endDate: String | null,
    weekStartDate?: String, // Present if reportType is "weekly"
    weekEndDate?: String // Present if reportType is "weekly"
  },
  summary: {
    totalDoctors: Number,
    totalOPDPatients: Number,
    totalIPDPatients: Number,
    totalPatients: Number
  },
  data: Array<{
    doctorId: Number,
    doctorName: String,
    doctorEmail: String | null,
    doctorPhone: String | null,
    doctorQualification: String | null,
    specialty: String, // DepartmentName
    departmentId: String (UUID) | null,
    opdPatientCount: Number,
    ipdPatientCount: Number,
    totalPatientCount: Number
  }>,
  tableData: Array<{
    doctor: String,
    specialty: String,
    opdPatients: Number,
    ipdPatients: Number,
    total: Number
  }>,
  chartData: {
    labels: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number
    }>
  }
} */
router.get('/doctor-wise-patient-statistics', reportsController.getDoctorWisePatientStatistics);

/* GET /api/reports/opd-statistics
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - startDate: String (YYYY-MM-DD) | null, // Optional, filter by date range start
  - endDate: String (YYYY-MM-DD) | null // Optional, filter by date range end
Note: If 'date' is provided, it will be used for daily report. Otherwise, use startDate/endDate range.
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    reportType: String, // "daily" | "custom"
    date: String | null,
    startDate: String | null,
    endDate: String | null
  },
  statistics: {
    totalOPDPatients: Number,
    totalAppointments: Number,
    avgWaitTimeMinutes: Number | null,
    avgWaitTimeFormatted: String | null, // e.g., "2h 30m" or "-15m"
    peakHours: Array<{
      hour: Number, // 0-23
      hourLabel: String, // "09:00 - 10:00"
      appointmentCount: Number
    }>
  },
  hourDistribution: Array<{
    hour: Number,
    hourLabel: String,
    appointmentCount: Number
  }>,
  chartData: {
    labels: Array<String>,
    data: Array<Number>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: String,
      borderColor: String,
      borderWidth: Number
    }>
  }
} */
router.get('/opd-statistics', reportsController.getOPDStatistics);

/* GET /api/reports/ipd-statistics
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, for daily report
  - startDate: String (YYYY-MM-DD) | null, // Optional, filter by RoomAllocationDate
  - endDate: String (YYYY-MM-DD) | null // Optional, filter by RoomAllocationDate
Note: If 'date' is provided, it will be used for daily report. Otherwise, use startDate/endDate range.
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    reportType: String, // "daily" | "custom"
    date: String | null,
    startDate: String | null,
    endDate: String | null
  },
  statistics: {
    totalAdmissions: Number,
    regularWard: {
      count: Number,
      percentage: Number
    },
    specialRooms: {
      count: Number,
      percentage: Number
    },
    avgStayDurationDays: Number | null,
    avgStayDurationFormatted: String | null // e.g., "5 days 12h 30m"
  },
  chartData: {
    labels: Array<String>,
    data: Array<Number>,
    percentages: Array<String>,
    datasets: Array<{
      label: String,
      data: Array<Number>,
      backgroundColor: Array<String>,
      borderColor: Array<String>,
      borderWidth: Number
    }>
  }
} */
router.get('/ipd-statistics', reportsController.getIPDStatistics);

/* GET /api/reports/ipd-summary
Query Parameters:
  - status: String, // "Active" | "Inactive", defaults to "Active"
  - date: String (YYYY-MM-DD) | null, // Optional, defaults to today for discharged count
Note: Discharged Today uses the provided date or today's date. Critical Patients and Bed Occupancy are current status.
Response: {
  success: Boolean,
  message: String,
  filters: {
    status: String,
    date: String (YYYY-MM-DD)
  },
  summary: {
    dischargedToday: {
      count: Number,
      date: String (YYYY-MM-DD)
    },
    criticalPatients: {
      count: Number
    },
    bedOccupancy: {
      totalBeds: Number,
      occupiedBeds: Number,
      availableBeds: Number,
      occupancyPercentage: Number
    }
  },
  chartData: {
    bedOccupancy: {
      labels: Array<String>,
      data: Array<Number>,
      datasets: Array<{
        label: String,
        data: Array<Number>,
        backgroundColor: Array<String>,
        borderColor: Array<String>,
        borderWidth: Number
      }>
    }
  }
} */
router.get('/ipd-summary', reportsController.getIPDSummary);

module.exports = router;

