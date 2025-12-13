const db = require('../db');

/**
 * Helper function to calculate Monday of the week for a given date
 */
const getWeekStartDate = (date) => {
  const providedDate = new Date(date + 'T00:00:00');
  const dayOfWeek = providedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToMonday = dayOfWeek === 0 ? 6 : (dayOfWeek === 1 ? 0 : dayOfWeek - 1);
  const startDate = new Date(providedDate);
  startDate.setDate(providedDate.getDate() - daysToMonday);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

/**
 * Helper function to get week end date (Sunday) from a week start date (Monday)
 */
const getWeekEndDate = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

/**
 * Get Doctor Performance Comparison - Doctorwise IPD and OPD patients count
 * Returns data formatted for bar graph: Doctor Name vs IPD Patients Count and OPD Patients Count
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - startDate: Filter IPD by RoomAllocationDate and OPD by AppointmentDate (YYYY-MM-DD) - optional
 * - endDate: Filter IPD by RoomAllocationDate and OPD by AppointmentDate (YYYY-MM-DD) - optional
 * Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range.
 */
exports.getDoctorPerformanceComparison = async (req, res) => {
  try {
    const { status = 'Active', date, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    // If 'date' is provided, use it for both startDate and endDate (daily report)
    let queryStartDate = startDate;
    let queryEndDate = endDate;
    
    if (date) {
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      queryStartDate = date;
      queryEndDate = date;
    } else {
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
        });
      }
    }

    // Build IPD query (from RoomAdmission)
    let ipdQuery = `
      SELECT 
        ra."AdmittingDoctorId" AS "DoctorId",
        u."UserName" AS "DoctorName",
        u."EmailId" AS "DoctorEmail",
        u."PhoneNo" AS "DoctorPhone",
        u."DoctorQualification",
        dd."DepartmentName",
        COUNT(DISTINCT ra."PatientId") AS "IPDPatientCount"
      FROM "RoomAdmission" ra
      INNER JOIN "Users" u ON ra."AdmittingDoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE ra."Status" = $1
    `;
    const ipdParams = [status];
    let paramIndex = 2;

    if (queryStartDate) {
      ipdQuery += ` AND DATE(ra."RoomAllocationDate") >= $${paramIndex}::date`;
      ipdParams.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      ipdQuery += ` AND DATE(ra."RoomAllocationDate") <= $${paramIndex}::date`;
      ipdParams.push(queryEndDate);
      paramIndex++;
    }

    ipdQuery += `
      GROUP BY ra."AdmittingDoctorId", u."UserName", u."EmailId", u."PhoneNo", u."DoctorQualification", dd."DepartmentName"
    `;

    // Build OPD query (from PatientAppointment)
    let opdQuery = `
      SELECT 
        pa."DoctorId",
        u."UserName" AS "DoctorName",
        u."EmailId" AS "DoctorEmail",
        u."PhoneNo" AS "DoctorPhone",
        u."DoctorQualification",
        dd."DepartmentName",
        COUNT(DISTINCT pa."PatientId") AS "OPDPatientCount"
      FROM "PatientAppointment" pa
      INNER JOIN "Users" u ON pa."DoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE pa."Status" = $1
    `;
    const opdParams = [status];
    paramIndex = 2;

    if (queryStartDate) {
      opdQuery += ` AND pa."AppointmentDate" >= $${paramIndex}::date`;
      opdParams.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      opdQuery += ` AND pa."AppointmentDate" <= $${paramIndex}::date`;
      opdParams.push(queryEndDate);
      paramIndex++;
    }

    opdQuery += `
      GROUP BY pa."DoctorId", u."UserName", u."EmailId", u."PhoneNo", u."DoctorQualification", dd."DepartmentName"
    `;

    // Execute both queries
    const [ipdResults, opdResults] = await Promise.all([
      db.query(ipdQuery, ipdParams),
      db.query(opdQuery, opdParams)
    ]);

    // Create maps for quick lookup
    const doctorMap = new Map();

    // Process IPD results
    ipdResults.rows.forEach(row => {
      const doctorId = row.DoctorId || row.doctorid;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctorId: doctorId,
          doctorName: row.DoctorName || row.doctorname || 'Unknown',
          doctorEmail: row.DoctorEmail || row.doctoremail || null,
          doctorPhone: row.DoctorPhone || row.doctorphone || null,
          doctorQualification: row.DoctorQualification || row.doctorqualification || null,
          departmentName: row.DepartmentName || row.departmentname || null,
          ipdPatientCount: 0,
          opdPatientCount: 0,
          totalPatientCount: 0
        });
      }
      const doctor = doctorMap.get(doctorId);
      doctor.ipdPatientCount = parseInt(row.IPDPatientCount || row.ipdpatientcount || 0, 10);
      doctor.totalPatientCount = doctor.ipdPatientCount + doctor.opdPatientCount;
    });

    // Process OPD results
    opdResults.rows.forEach(row => {
      const doctorId = row.DoctorId || row.doctorid;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctorId: doctorId,
          doctorName: row.DoctorName || row.doctorname || 'Unknown',
          doctorEmail: row.DoctorEmail || row.doctoremail || null,
          doctorPhone: row.DoctorPhone || row.doctorphone || null,
          doctorQualification: row.DoctorQualification || row.doctorqualification || null,
          departmentName: row.DepartmentName || row.departmentname || null,
          ipdPatientCount: 0,
          opdPatientCount: 0,
          totalPatientCount: 0
        });
      }
      const doctor = doctorMap.get(doctorId);
      doctor.opdPatientCount = parseInt(row.OPDPatientCount || row.opdpatientcount || 0, 10);
      doctor.totalPatientCount = doctor.ipdPatientCount + doctor.opdPatientCount;
    });

    // Convert map to array and sort by total patient count (descending)
    const doctorData = Array.from(doctorMap.values()).sort((a, b) => b.totalPatientCount - a.totalPatientCount);

    // Format data for bar chart
    const chartData = {
      labels: doctorData.map(d => d.doctorName),
      datasets: [
        {
          label: 'IPD Patients',
          data: doctorData.map(d => d.ipdPatientCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'OPD Patients',
          data: doctorData.map(d => d.opdPatientCount),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Calculate totals
    const totalIPD = doctorData.reduce((sum, d) => sum + d.ipdPatientCount, 0);
    const totalOPD = doctorData.reduce((sum, d) => sum + d.opdPatientCount, 0);
    const totalPatients = totalIPD + totalOPD;

    res.status(200).json({
      success: true,
      message: 'Doctor performance comparison retrieved successfully',
      filters: {
        status: status,
        date: date || null,
        startDate: queryStartDate || null,
        endDate: queryEndDate || null
      },
      summary: {
        totalDoctors: doctorData.length,
        totalIPDPatients: totalIPD,
        totalOPDPatients: totalOPD,
        totalPatients: totalPatients
      },
      data: doctorData,
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor performance comparison',
      error: error.message,
    });
  }
};

/**
 * Get OPD Patient Flow - Weekly Trend report
 * Shows OPD patient counts and IPD admissions by day of the week for comparison
 * Query parameter: ?date=YYYY-MM-DD (optional, defaults to current week starting from Monday)
 *                  Use this to select which week to view. The date will determine the week (Monday to Sunday)
 * Returns: Daily OPD patient counts and IPD admission counts for 7 days (Monday to Sunday)
 */
exports.getOPDPatientFlowWeeklyTrend = async (req, res) => {
  try {
    const { date } = req.query;
    
    let startDate;
    if (date) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-03)',
        });
      }
      startDate = getWeekStartDate(date);
    } else {
      // Default to current week starting from Monday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get Monday
      startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
    }

    // Validate the date
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date provided',
      });
    }

    // Calculate end date (7 days from start date - Sunday)
    const endDate = getWeekEndDate(startDate);

    // Format dates for SQL query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Day names array
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Query to get daily OPD patient counts for the week
    const opdQuery = `
      SELECT 
        "AppointmentDate"::date AS appointment_date,
        TO_CHAR("AppointmentDate"::date, 'Day') AS day_name,
        COUNT(DISTINCT "PatientId") AS patient_count
      FROM "PatientAppointment"
      WHERE "AppointmentDate"::date >= $1::date
      AND "AppointmentDate"::date <= $2::date
      AND "Status" = 'Active'
      GROUP BY "AppointmentDate"::date
      ORDER BY "AppointmentDate"::date ASC
    `;

    // Query to get daily IPD admission counts for the week
    const ipdQuery = `
      SELECT 
        DATE("RoomAllocationDate") AS admission_date,
        TO_CHAR(DATE("RoomAllocationDate"), 'Day') AS day_name,
        COUNT(DISTINCT "PatientId") AS admission_count
      FROM "RoomAdmission"
      WHERE DATE("RoomAllocationDate") >= $1::date
      AND DATE("RoomAllocationDate") <= $2::date
      AND "Status" = 'Active'
      GROUP BY DATE("RoomAllocationDate")
      ORDER BY DATE("RoomAllocationDate") ASC
    `;

    // Execute both queries in parallel
    const [opdResults, ipdResults] = await Promise.all([
      db.query(opdQuery, [startDateStr, endDateStr]),
      db.query(ipdQuery, [startDateStr, endDateStr])
    ]);

    // Create maps of date to count
    const opdDateCountMap = new Map();
    opdResults.rows.forEach(row => {
      const dateStr = row.appointment_date.toISOString().split('T')[0];
      opdDateCountMap.set(dateStr, parseInt(row.patient_count, 10) || 0);
    });

    const ipdDateCountMap = new Map();
    ipdResults.rows.forEach(row => {
      const dateStr = row.admission_date.toISOString().split('T')[0];
      ipdDateCountMap.set(dateStr, parseInt(row.admission_count, 10) || 0);
    });

    // Generate data for all 7 days of the week
    const weeklyData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const dayName = dayNames[dayOfWeek];
      
      weeklyData.push({
        date: dateStr,
        day: dayName.trim(),
        dayNumber: dayOfWeek,
        opdPatientCount: opdDateCountMap.get(dateStr) || 0,
        ipdAdmissionCount: ipdDateCountMap.get(dateStr) || 0,
        totalCount: (opdDateCountMap.get(dateStr) || 0) + (ipdDateCountMap.get(dateStr) || 0)
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate totals
    const totalOPD = weeklyData.reduce((sum, day) => sum + day.opdPatientCount, 0);
    const totalIPD = weeklyData.reduce((sum, day) => sum + day.ipdAdmissionCount, 0);
    const totalPatients = totalOPD + totalIPD;

    // Format data for chart (line or bar chart)
    const chartData = {
      labels: weeklyData.map(day => day.day),
      dates: weeklyData.map(day => day.date),
      datasets: [
        {
          label: 'OPD Patients',
          data: weeklyData.map(day => day.opdPatientCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.4 // For line chart smoothness
        },
        {
          label: 'IPD Admissions',
          data: weeklyData.map(day => day.ipdAdmissionCount),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          tension: 0.4 // For line chart smoothness
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'OPD Patient Flow - Weekly Trend retrieved successfully',
      week: {
        startDate: startDateStr,
        endDate: endDateStr
      },
      summary: {
        totalOPDPatients: totalOPD,
        totalIPDAdmissions: totalIPD,
        totalPatients: totalPatients
      },
      data: weeklyData,
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OPD Patient Flow - Weekly Trend',
      error: error.message,
    });
  }
};

/**
 * Get Department-wise IPD Admissions report
 * Returns data formatted for graph: DepartmentName vs Count of IPD Admissions
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - startDate: Filter by RoomAllocationDate (YYYY-MM-DD) - optional
 * - endDate: Filter by RoomAllocationDate (YYYY-MM-DD) - optional
 * Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range.
 */
exports.getDepartmentWiseIPDAdmissions = async (req, res) => {
  try {
    const { status = 'Active', date, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    // If 'date' is provided, use it for both startDate and endDate (daily report)
    let queryStartDate = startDate;
    let queryEndDate = endDate;
    
    if (date) {
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      queryStartDate = date;
      queryEndDate = date;
    } else {
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
        });
      }
    }

    // Build query to get department-wise IPD admission counts
    let query = `
      SELECT 
        COALESCE(dd."DepartmentName", 'Unassigned') AS "DepartmentName",
        dd."DoctorDepartmentId",
        COUNT(DISTINCT ra."PatientId") AS "IPDAdmissionCount",
        COUNT(ra."RoomAdmissionId") AS "TotalAdmissions"
      FROM "RoomAdmission" ra
      INNER JOIN "Users" u ON ra."AdmittingDoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE ra."Status" = $1
    `;
    const params = [status];
    let paramIndex = 2;

    if (queryStartDate) {
      query += ` AND DATE(ra."RoomAllocationDate") >= $${paramIndex}::date`;
      params.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      query += ` AND DATE(ra."RoomAllocationDate") <= $${paramIndex}::date`;
      params.push(queryEndDate);
      paramIndex++;
    }

    query += `
      GROUP BY dd."DepartmentName", dd."DoctorDepartmentId"
      ORDER BY "IPDAdmissionCount" DESC, "DepartmentName" ASC
    `;

    const { rows } = await db.query(query, params);

    // Process results
    const departmentData = rows.map(row => ({
      departmentId: row.DoctorDepartmentId || row.doctordepartmentid || null,
      departmentName: row.DepartmentName || row.departmentname || 'Unassigned',
      ipdAdmissionCount: parseInt(row.IPDAdmissionCount || row.ipdadmissioncount || 0, 10),
      totalAdmissions: parseInt(row.TotalAdmissions || row.totaladmissions || 0, 10)
    }));

    // Calculate total
    const totalAdmissions = departmentData.reduce((sum, dept) => sum + dept.ipdAdmissionCount, 0);

    // Calculate percentages
    const departmentDataWithPercentages = departmentData.map(dept => ({
      ...dept,
      percentage: totalAdmissions > 0 ? ((dept.ipdAdmissionCount / totalAdmissions) * 100).toFixed(2) : '0.00'
    }));

    // Format data for chart (bar chart or pie chart)
    const chartData = {
      labels: departmentDataWithPercentages.map(dept => dept.departmentName),
      values: departmentDataWithPercentages.map(dept => dept.ipdAdmissionCount),
      percentages: departmentDataWithPercentages.map(dept => dept.percentage),
      datasets: [
        {
          label: 'IPD Admissions',
          data: departmentDataWithPercentages.map(dept => dept.ipdAdmissionCount),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(255, 99, 255, 0.6)',
            'rgba(99, 255, 132, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Department-wise IPD Admissions retrieved successfully',
      filters: {
        status: status,
        date: date || null,
        startDate: queryStartDate || null,
        endDate: queryEndDate || null
      },
      summary: {
        totalDepartments: departmentData.length,
        totalIPDAdmissions: totalAdmissions
      },
      data: departmentDataWithPercentages,
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department-wise IPD admissions',
      error: error.message,
    });
  }
};

/**
 * Get Daily Surgery Schedule report
 * Returns data formatted for graph: Date vs Surgery Completed & Surgery Scheduled
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - startDate: Filter by OTAllocationDate (YYYY-MM-DD) - optional, defaults to last 7 days
 * - endDate: Filter by OTAllocationDate (YYYY-MM-DD) - optional, defaults to today
 * Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range (defaults to last 7 days).
 */
exports.getDailySurgerySchedule = async (req, res) => {
  try {
    const { status = 'Active', date, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
      });
    }
    if (endDate && !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
      });
    }

    // Set default date range if not provided (last 7 days)
    let queryStartDate = startDate;
    let queryEndDate = endDate;
    
    if (!startDate || !endDate) {
      const today = new Date();
      const defaultEndDate = endDate || today.toISOString().split('T')[0];
      const defaultStartDate = startDate || (() => {
        const date = new Date(today);
        date.setDate(date.getDate() - 6); // 7 days including today
        return date.toISOString().split('T')[0];
      })();
      queryStartDate = defaultStartDate;
      queryEndDate = defaultEndDate;
    }

    // Build query to get daily surgery counts grouped by date and operation status
    const query = `
      SELECT 
        "OTAllocationDate"::date AS allocation_date,
        COUNT(*) FILTER (WHERE "OperationStatus" = 'Scheduled') AS scheduled_count,
        COUNT(*) FILTER (WHERE "OperationStatus" = 'Completed') AS completed_count,
        COUNT(*) FILTER (WHERE "OperationStatus" = 'In Progress') AS in_progress_count,
        COUNT(*) FILTER (WHERE "OperationStatus" = 'Cancelled') AS cancelled_count,
        COUNT(*) FILTER (WHERE "OperationStatus" = 'Postponed') AS postponed_count,
        COUNT(*) AS total_count
      FROM "PatientOTAllocation"
      WHERE "Status" = $1
      AND "OTAllocationDate"::date >= $2::date
      AND "OTAllocationDate"::date <= $3::date
      GROUP BY "OTAllocationDate"::date
      ORDER BY "OTAllocationDate"::date ASC
    `;

    const { rows } = await db.query(query, [status, queryStartDate, queryEndDate]);

    // Create a map of date to counts
    const dateCountMap = new Map();
    rows.forEach(row => {
      const dateStr = row.allocation_date.toISOString().split('T')[0];
      dateCountMap.set(dateStr, {
        date: dateStr,
        scheduledCount: parseInt(row.scheduled_count || 0, 10),
        completedCount: parseInt(row.completed_count || 0, 10),
        inProgressCount: parseInt(row.in_progress_count || 0, 10),
        cancelledCount: parseInt(row.cancelled_count || 0, 10),
        postponedCount: parseInt(row.postponed_count || 0, 10),
        totalCount: parseInt(row.total_count || 0, 10)
      });
    });

    // Generate data for all dates in the range
    const dailyData = [];
    const start = new Date(queryStartDate + 'T00:00:00');
    const end = new Date(queryEndDate + 'T00:00:00');
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dateInfo = dateCountMap.get(dateStr) || {
        date: dateStr,
        scheduledCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        cancelledCount: 0,
        postponedCount: 0,
        totalCount: 0
      };
      dailyData.push(dateInfo);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate totals
    const totalScheduled = dailyData.reduce((sum, day) => sum + day.scheduledCount, 0);
    const totalCompleted = dailyData.reduce((sum, day) => sum + day.completedCount, 0);
    const totalInProgress = dailyData.reduce((sum, day) => sum + day.inProgressCount, 0);
    const totalCancelled = dailyData.reduce((sum, day) => sum + day.cancelledCount, 0);
    const totalPostponed = dailyData.reduce((sum, day) => sum + day.postponedCount, 0);
    const totalSurgeries = dailyData.reduce((sum, day) => sum + day.totalCount, 0);

    // Format data for chart (bar chart or line chart)
    const chartData = {
      labels: dailyData.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      dates: dailyData.map(day => day.date),
      datasets: [
        {
          label: 'Surgery Scheduled',
          data: dailyData.map(day => day.scheduledCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.4 // For line chart smoothness
        },
        {
          label: 'Surgery Completed',
          data: dailyData.map(day => day.completedCount),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.4 // For line chart smoothness
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Daily Surgery Schedule retrieved successfully',
      filters: {
        status: status,
        date: date || null,
        startDate: queryStartDate,
        endDate: queryEndDate
      },
      summary: {
        totalScheduled: totalScheduled,
        totalCompleted: totalCompleted,
        totalInProgress: totalInProgress,
        totalCancelled: totalCancelled,
        totalPostponed: totalPostponed,
        totalSurgeries: totalSurgeries
      },
      data: dailyData,
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily surgery schedule',
      error: error.message,
    });
  }
};

/**
 * Get ICU Occupancy Trend report
 * Returns data formatted for graph: Date vs Total ICUBeds & Occupied ICUBeds
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - startDate: Filter by date range start (YYYY-MM-DD) - optional, defaults to last 7 days
 * - endDate: Filter by date range end (YYYY-MM-DD) - optional, defaults to today
 * Note: If 'date' is provided, it will be used. Otherwise, use startDate/endDate range (defaults to last 7 days).
 */
exports.getICUOccupancyTrend = async (req, res) => {
  try {
    const { status = 'Active', date, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
      });
    }
    if (endDate && !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
      });
    }

    // Set default date range if not provided (last 7 days)
    let queryStartDate = startDate;
    let queryEndDate = endDate;
    
    if (!startDate || !endDate) {
      const today = new Date();
      const defaultEndDate = endDate || today.toISOString().split('T')[0];
      const defaultStartDate = startDate || (() => {
        const date = new Date(today);
        date.setDate(date.getDate() - 6); // 7 days including today
        return date.toISOString().split('T')[0];
      })();
      queryStartDate = defaultStartDate;
      queryEndDate = defaultEndDate;
    }

    // Get total ICU beds count (this is constant for the date range)
    const totalICUBedsQuery = `
      SELECT COUNT(*) AS total_icu_beds
      FROM "ICU"
      WHERE "Status" = $1
    `;
    const totalBedsResult = await db.query(totalICUBedsQuery, [status]);
    const totalICUBeds = parseInt(totalBedsResult.rows[0].total_icu_beds, 10) || 0;

    // Build query to get occupied ICU beds count for each date in the range
    // For each date, count distinct ICUId where:
    // - date is between ICUAllocationFromDate and ICUAllocationToDate (or ICUAllocationToDate is NULL and date >= ICUAllocationFromDate)
    // - ICUAdmissionStatus = 'Occupied'
    // - Status = 'Active'
    const query = `
      WITH date_series AS (
        SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS date
      )
      SELECT 
        ds.date,
        COUNT(DISTINCT pica."ICUId") FILTER (
          WHERE pica."ICUAllocationFromDate" IS NOT NULL
          AND (
            (pica."ICUAllocationToDate" IS NOT NULL 
             AND ds.date >= pica."ICUAllocationFromDate" 
             AND ds.date <= pica."ICUAllocationToDate")
            OR
            (pica."ICUAllocationToDate" IS NULL 
             AND ds.date >= pica."ICUAllocationFromDate")
          )
          AND pica."ICUAdmissionStatus" = 'Occupied'
          AND pica."Status" = $1
        ) AS occupied_icu_beds
      FROM date_series ds
      LEFT JOIN "PatientICUAdmission" pica ON (
        pica."ICUAllocationFromDate" IS NOT NULL
        AND (
          (pica."ICUAllocationToDate" IS NOT NULL 
           AND ds.date >= pica."ICUAllocationFromDate" 
           AND ds.date <= pica."ICUAllocationToDate")
          OR
          (pica."ICUAllocationToDate" IS NULL 
           AND ds.date >= pica."ICUAllocationFromDate")
        )
        AND pica."ICUAdmissionStatus" = 'Occupied'
        AND pica."Status" = $1
      )
      GROUP BY ds.date
      ORDER BY ds.date ASC
    `;

    const { rows } = await db.query(query, [status, queryStartDate, queryEndDate]);

    // Process results
    const dailyData = rows.map(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      return {
        date: dateStr,
        totalICUBeds: totalICUBeds,
        occupiedICUBeds: parseInt(row.occupied_icu_beds || 0, 10),
        availableICUBeds: totalICUBeds - parseInt(row.occupied_icu_beds || 0, 10),
        occupancyPercentage: totalICUBeds > 0 
          ? ((parseInt(row.occupied_icu_beds || 0, 10) / totalICUBeds) * 100).toFixed(2)
          : '0.00'
      };
    });

    // Calculate totals and averages
    const totalOccupied = dailyData.reduce((sum, day) => sum + day.occupiedICUBeds, 0);
    const avgOccupied = dailyData.length > 0 ? (totalOccupied / dailyData.length).toFixed(2) : '0.00';
    const maxOccupied = Math.max(...dailyData.map(day => day.occupiedICUBeds), 0);
    const minOccupied = Math.min(...dailyData.map(day => day.occupiedICUBeds), 0);

    // Format data for chart (line chart or bar chart)
    const chartData = {
      labels: dailyData.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      dates: dailyData.map(day => day.date),
      datasets: [
        {
          label: 'Total ICU Beds',
          data: dailyData.map(day => day.totalICUBeds),
          backgroundColor: 'rgba(199, 199, 199, 0.6)',
          borderColor: 'rgba(199, 199, 199, 1)',
          borderWidth: 2,
          borderDash: [5, 5], // Dashed line for total beds
          tension: 0.4
        },
        {
          label: 'Occupied ICU Beds',
          data: dailyData.map(day => day.occupiedICUBeds),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'ICU Occupancy Trend retrieved successfully',
      filters: {
        status: status,
        date: date || null,
        startDate: queryStartDate,
        endDate: queryEndDate
      },
      summary: {
        totalICUBeds: totalICUBeds,
        totalOccupied: totalOccupied,
        averageOccupied: parseFloat(avgOccupied),
        maxOccupied: maxOccupied,
        minOccupied: minOccupied,
        averageOccupancyPercentage: totalICUBeds > 0 
          ? ((parseFloat(avgOccupied) / totalICUBeds) * 100).toFixed(2)
          : '0.00'
      },
      data: dailyData,
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU occupancy trend',
      error: error.message,
    });
  }
};

/**
 * Get Doctor-wise Patient Statistics report
 * Returns data with: Doctor, Specialty (DepartmentName), OPD Patients, IPD Patients, Total
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - weekDate: Filter for a specific week (YYYY-MM-DD) - optional, for weekly report (uses the week containing this date)
 * - startDate: Filter by date range start (YYYY-MM-DD) - optional
 * - endDate: Filter by date range end (YYYY-MM-DD) - optional
 * Note: Priority: If 'date' is provided, it will be used for daily report. If 'weekDate' is provided, it will be used for weekly report. Otherwise, use startDate/endDate range.
 */
exports.getDoctorWisePatientStatistics = async (req, res) => {
  try {
    const { status = 'Active', date, weekDate, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    let queryStartDate = null;
    let queryEndDate = null;
    let reportType = 'custom'; // 'daily', 'weekly', or 'custom'
    
    // Determine report type and date range
    if (date) {
      // Daily report
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      queryStartDate = date;
      queryEndDate = date;
      reportType = 'daily';
    } else if (weekDate) {
      // Weekly report
      if (!dateRegex.test(weekDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid weekDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      const weekStart = getWeekStartDate(weekDate);
      const weekEnd = getWeekEndDate(weekStart);
      queryStartDate = weekStart.toISOString().split('T')[0];
      queryEndDate = weekEnd.toISOString().split('T')[0];
      reportType = 'weekly';
    } else {
      // Custom date range
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
        });
      }
      queryStartDate = startDate;
      queryEndDate = endDate;
    }

    // Build IPD query (from RoomAdmission)
    let ipdQuery = `
      SELECT 
        ra."AdmittingDoctorId" AS "DoctorId",
        u."UserName" AS "DoctorName",
        u."EmailId" AS "DoctorEmail",
        u."PhoneNo" AS "DoctorPhone",
        u."DoctorQualification",
        COALESCE(dd."DepartmentName", 'Unassigned') AS "Specialty",
        dd."DoctorDepartmentId",
        COUNT(DISTINCT ra."PatientId") AS "IPDPatientCount"
      FROM "RoomAdmission" ra
      INNER JOIN "Users" u ON ra."AdmittingDoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE ra."Status" = $1
    `;
    const ipdParams = [status];
    let paramIndex = 2;

    if (queryStartDate) {
      ipdQuery += ` AND DATE(ra."RoomAllocationDate") >= $${paramIndex}::date`;
      ipdParams.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      ipdQuery += ` AND DATE(ra."RoomAllocationDate") <= $${paramIndex}::date`;
      ipdParams.push(queryEndDate);
      paramIndex++;
    }

    ipdQuery += `
      GROUP BY ra."AdmittingDoctorId", u."UserName", u."EmailId", u."PhoneNo", u."DoctorQualification", dd."DepartmentName", dd."DoctorDepartmentId"
    `;
console.log("ipdQueryipdQueryipdQueryipdQuery\n",ipdQuery);
    // Build OPD query (from PatientAppointment)
    let opdQuery = `
      SELECT 
        pa."DoctorId",
        u."UserName" AS "DoctorName",
        u."EmailId" AS "DoctorEmail",
        u."PhoneNo" AS "DoctorPhone",
        u."DoctorQualification",
        COALESCE(dd."DepartmentName", 'Unassigned') AS "Specialty",
        dd."DoctorDepartmentId",
        COUNT(DISTINCT pa."PatientId") AS "OPDPatientCount"
      FROM "PatientAppointment" pa
      INNER JOIN "Users" u ON pa."DoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE pa."Status" = $1
    `;
    const opdParams = [status];
    paramIndex = 2;

    if (queryStartDate) {
      opdQuery += ` AND pa."AppointmentDate" >= $${paramIndex}::date`;
      opdParams.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      opdQuery += ` AND pa."AppointmentDate" <= $${paramIndex}::date`;
      opdParams.push(queryEndDate);
      paramIndex++;
    }

    opdQuery += `
      GROUP BY pa."DoctorId", u."UserName", u."EmailId", u."PhoneNo", u."DoctorQualification", dd."DepartmentName", dd."DoctorDepartmentId"
    `;

    // Execute both queries
    const [ipdResults, opdResults] = await Promise.all([
      db.query(ipdQuery, ipdParams),
      db.query(opdQuery, opdParams)
    ]);

    // Create maps for quick lookup by doctorId
    const doctorMap = new Map();

    // Process IPD results
    ipdResults.rows.forEach(row => {
      const doctorId = row.DoctorId || row.doctorid;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctorId: doctorId,
          doctorName: row.DoctorName || row.doctorname || 'Unknown',
          doctorEmail: row.DoctorEmail || row.doctoremail || null,
          doctorPhone: row.DoctorPhone || row.doctorphone || null,
          doctorQualification: row.DoctorQualification || row.doctorqualification || null,
          specialty: row.Specialty || row.specialty || 'Unassigned',
          departmentId: row.DoctorDepartmentId || row.doctordepartmentid || null,
          opdPatientCount: 0,
          ipdPatientCount: 0,
          totalPatientCount: 0
        });
      }
      const doctor = doctorMap.get(doctorId);
      doctor.ipdPatientCount = parseInt(row.IPDPatientCount || row.ipdpatientcount || 0, 10);
      doctor.totalPatientCount = doctor.ipdPatientCount + doctor.opdPatientCount;
    });

    // Process OPD results
    opdResults.rows.forEach(row => {
      const doctorId = row.DoctorId || row.doctorid;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctorId: doctorId,
          doctorName: row.DoctorName || row.doctorname || 'Unknown',
          doctorEmail: row.DoctorEmail || row.doctoremail || null,
          doctorPhone: row.DoctorPhone || row.doctorphone || null,
          doctorQualification: row.DoctorQualification || row.doctorqualification || null,
          specialty: row.Specialty || row.specialty || 'Unassigned',
          departmentId: row.DoctorDepartmentId || row.doctordepartmentid || null,
          opdPatientCount: 0,
          ipdPatientCount: 0,
          totalPatientCount: 0
        });
      }
      const doctor = doctorMap.get(doctorId);
      doctor.opdPatientCount = parseInt(row.OPDPatientCount || row.opdpatientcount || 0, 10);
      doctor.totalPatientCount = doctor.ipdPatientCount + doctor.opdPatientCount;
    });

    // Convert map to array and sort by total patient count (descending), then by doctor name
    const doctorData = Array.from(doctorMap.values()).sort((a, b) => {
      if (b.totalPatientCount !== a.totalPatientCount) {
        return b.totalPatientCount - a.totalPatientCount;
      }
      return a.doctorName.localeCompare(b.doctorName);
    });

    // Calculate totals
    const totalOPD = doctorData.reduce((sum, d) => sum + d.opdPatientCount, 0);
    const totalIPD = doctorData.reduce((sum, d) => sum + d.ipdPatientCount, 0);
    const totalPatients = totalOPD + totalIPD;

    // Format data for table/chart
    const tableData = doctorData.map(d => ({
      doctor: d.doctorName,
      specialty: d.specialty,
      opdPatients: d.opdPatientCount,
      ipdPatients: d.ipdPatientCount,
      total: d.totalPatientCount
    }));

    // Format data for chart (bar chart)
    const chartData = {
      labels: doctorData.map(d => d.doctorName),
      datasets: [
        {
          label: 'OPD Patients',
          data: doctorData.map(d => d.opdPatientCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'IPD Patients',
          data: doctorData.map(d => d.ipdPatientCount),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    // Prepare response filters
    const filters = {
      status: status,
      reportType: reportType,
      date: date || null,
      weekDate: weekDate || null,
      startDate: queryStartDate || null,
      endDate: queryEndDate || null
    };

    if (reportType === 'weekly' && weekDate) {
      filters.weekStartDate = queryStartDate;
      filters.weekEndDate = queryEndDate;
    }

    res.status(200).json({
      success: true,
      message: 'Doctor-wise Patient Statistics retrieved successfully',
      filters: filters,
      summary: {
        totalDoctors: doctorData.length,
        totalOPDPatients: totalOPD,
        totalIPDPatients: totalIPD,
        totalPatients: totalPatients
      },
      data: doctorData,
      tableData: tableData,
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor-wise patient statistics',
      error: error.message,
    });
  }
};

/**
 * Get OPD Statistics - Total OPD Patients, Average Wait Time, Peak Hours
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - startDate: Filter by date range start (YYYY-MM-DD) - optional
 * - endDate: Filter by date range end (YYYY-MM-DD) - optional
 * Note: If 'date' is provided, it will be used for daily report. Otherwise, use startDate/endDate range.
 */
exports.getOPDStatistics = async (req, res) => {
  try {
    const { status = 'Active', date, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    let queryStartDate = null;
    let queryEndDate = null;
    let reportType = 'custom'; // 'daily' or 'custom'
    
    // Determine date range
    if (date) {
      // Daily report
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      queryStartDate = date;
      queryEndDate = date;
      reportType = 'daily';
    } else {
      // Custom date range
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
        });
      }
      queryStartDate = startDate;
      queryEndDate = endDate;
    }

    // Build query to get OPD statistics
    let query = `
      SELECT 
        COUNT(DISTINCT pa."PatientId") AS "TotalOPDPatients",
        COUNT(pa."PatientAppointmentId") AS "TotalAppointments",
        -- Calculate average wait time in minutes
        -- Wait time = difference between appointment creation time and scheduled appointment time
        -- Using EXTRACT(EPOCH FROM ...) to get difference in seconds, then convert to minutes
        AVG(
          EXTRACT(EPOCH FROM (
            (pa."AppointmentDate" + pa."AppointmentTime")::timestamp - pa."CreatedDate"
          )) / 60
        ) AS "AvgWaitTimeMinutes",
        -- Get hour distribution for peak hours
        EXTRACT(HOUR FROM pa."AppointmentTime") AS "Hour",
        COUNT(*) AS "AppointmentCount"
      FROM "PatientAppointment" pa
      WHERE pa."Status" = $1
    `;
    const params = [status];
    let paramIndex = 2;

    if (queryStartDate) {
      query += ` AND pa."AppointmentDate" >= $${paramIndex}::date`;
      params.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      query += ` AND pa."AppointmentDate" <= $${paramIndex}::date`;
      params.push(queryEndDate);
      paramIndex++;
    }

    query += `
      GROUP BY EXTRACT(HOUR FROM pa."AppointmentTime")
      ORDER BY "AppointmentCount" DESC, "Hour" ASC
    `;

    const { rows } = await db.query(query, params);

    // Calculate total OPD patients and average wait time from aggregated data
    // We need to recalculate these from the grouped data
    let totalOPDPatientsQuery = `
      SELECT 
        COUNT(DISTINCT pa."PatientId") AS "TotalOPDPatients",
        COUNT(pa."PatientAppointmentId") AS "TotalAppointments",
        AVG(
          EXTRACT(EPOCH FROM (
            (pa."AppointmentDate" + pa."AppointmentTime")::timestamp - pa."CreatedDate"
          )) / 60
        ) AS "AvgWaitTimeMinutes"
      FROM "PatientAppointment" pa
      WHERE pa."Status" = $1
    `;
    const totalParams = [status];
    let totalParamIndex = 2;

    if (queryStartDate) {
      totalOPDPatientsQuery += ` AND pa."AppointmentDate" >= $${totalParamIndex}::date`;
      totalParams.push(queryStartDate);
      totalParamIndex++;
    }
    if (queryEndDate) {
      totalOPDPatientsQuery += ` AND pa."AppointmentDate" <= $${totalParamIndex}::date`;
      totalParams.push(queryEndDate);
      totalParamIndex++;
    }

    const totalStatsResult = await db.query(totalOPDPatientsQuery, totalParams);
    const totalStats = totalStatsResult.rows[0];

    // Process hour distribution for peak hours
    const hourDistribution = rows.map(row => ({
      hour: parseInt(row.Hour || row.hour || 0, 10),
      appointmentCount: parseInt(row.AppointmentCount || row.appointmentcount || 0, 10),
      hourLabel: `${String(parseInt(row.Hour || row.hour || 0, 10)).padStart(2, '0')}:00 - ${String(parseInt(row.Hour || row.hour || 0, 10) + 1).padStart(2, '0')}:00`
    }));

    // Find peak hours (top 3 hours with most appointments)
    const peakHours = hourDistribution
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 3)
      .map(h => ({
        hour: h.hour,
        hourLabel: h.hourLabel,
        appointmentCount: h.appointmentCount
      }));

    // Calculate statistics
    const totalOPDPatients = parseInt(totalStats.TotalOPDPatients || totalStats.totalopdpatients || 0, 10);
    const totalAppointments = parseInt(totalStats.TotalAppointments || totalStats.totalappointments || 0, 10);
    const avgWaitTimeMinutes = totalStats.AvgWaitTimeMinutes 
      ? parseFloat(totalStats.AvgWaitTimeMinutes) 
      : null;
    
    // Format average wait time
    let avgWaitTimeFormatted = null;
    if (avgWaitTimeMinutes !== null && !isNaN(avgWaitTimeMinutes)) {
      const hours = Math.floor(Math.abs(avgWaitTimeMinutes) / 60);
      const minutes = Math.floor(Math.abs(avgWaitTimeMinutes) % 60);
      const sign = avgWaitTimeMinutes < 0 ? '-' : '';
      if (hours > 0) {
        avgWaitTimeFormatted = `${sign}${hours}h ${minutes}m`;
      } else {
        avgWaitTimeFormatted = `${sign}${minutes}m`;
      }
    }

    // Prepare response filters
    const filters = {
      status: status,
      reportType: reportType,
      date: date || null,
      startDate: queryStartDate || null,
      endDate: queryEndDate || null
    };

    res.status(200).json({
      success: true,
      message: 'OPD Statistics retrieved successfully',
      filters: filters,
      statistics: {
        totalOPDPatients: totalOPDPatients,
        totalAppointments: totalAppointments,
        avgWaitTimeMinutes: avgWaitTimeMinutes ? Math.round(avgWaitTimeMinutes * 100) / 100 : null,
        avgWaitTimeFormatted: avgWaitTimeFormatted,
        peakHours: peakHours
      },
      hourDistribution: hourDistribution.sort((a, b) => a.hour - b.hour), // Sort by hour for chronological order
      chartData: {
        labels: hourDistribution.sort((a, b) => a.hour - b.hour).map(h => h.hourLabel),
        data: hourDistribution.sort((a, b) => a.hour - b.hour).map(h => h.appointmentCount),
        datasets: [{
          label: 'Appointments per Hour',
          data: hourDistribution.sort((a, b) => a.hour - b.hour).map(h => h.appointmentCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OPD statistics',
      error: error.message,
    });
  }
};

/**
 * Get IPD Statistics - Total Admissions, Regular Ward, Special Rooms, Average Stay Duration
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, for daily report
 * - startDate: Filter by RoomAllocationDate (YYYY-MM-DD) - optional
 * - endDate: Filter by RoomAllocationDate (YYYY-MM-DD) - optional
 * Note: If 'date' is provided, it will be used for daily report. Otherwise, use startDate/endDate range.
 */
exports.getIPDStatistics = async (req, res) => {
  try {
    const { status = 'Active', date, startDate, endDate } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    let queryStartDate = null;
    let queryEndDate = null;
    let reportType = 'custom'; // 'daily' or 'custom'
    
    // Determine date range
    if (date) {
      // Daily report
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      queryStartDate = date;
      queryEndDate = date;
      reportType = 'daily';
    } else {
      // Custom date range
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Please use YYYY-MM-DD format (e.g., 2025-12-31)',
        });
      }
      queryStartDate = startDate;
      queryEndDate = endDate;
    }

    // Build query to get IPD statistics
    let query = `
      SELECT 
        COUNT(DISTINCT ra."RoomAdmissionId") AS "TotalAdmissions",
        COUNT(DISTINCT CASE WHEN rb."RoomType" = 'Regular' THEN ra."RoomAdmissionId" END) AS "RegularWardAdmissions",
        COUNT(DISTINCT CASE WHEN rb."RoomType" IN ('Special', 'Special Shared') THEN ra."RoomAdmissionId" END) AS "SpecialRoomsAdmissions",
        -- Calculate average stay duration in days
        -- For completed admissions: use RoomVacantDate - RoomAllocationDate
        -- For active admissions: use CURRENT_TIMESTAMP - RoomAllocationDate
        AVG(
          EXTRACT(EPOCH FROM (
            COALESCE(ra."RoomVacantDate", CURRENT_TIMESTAMP) - ra."RoomAllocationDate"
          )) / 86400.0
        ) AS "AvgStayDurationDays"
      FROM "RoomAdmission" ra
      INNER JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      WHERE ra."Status" = $1
    `;
    const params = [status];
    let paramIndex = 2;

    if (queryStartDate) {
      query += ` AND DATE(ra."RoomAllocationDate") >= $${paramIndex}::date`;
      params.push(queryStartDate);
      paramIndex++;
    }
    if (queryEndDate) {
      query += ` AND DATE(ra."RoomAllocationDate") <= $${paramIndex}::date`;
      params.push(queryEndDate);
      paramIndex++;
    }

    const { rows } = await db.query(query, params);
    const stats = rows[0];

    // Process results
    const totalAdmissions = parseInt(stats.TotalAdmissions || stats.totaladmissions || 0, 10);
    const regularWardAdmissions = parseInt(stats.RegularWardAdmissions || stats.regularwardadmissions || 0, 10);
    const specialRoomsAdmissions = parseInt(stats.SpecialRoomsAdmissions || stats.specialroomsadmissions || 0, 10);
    const avgStayDurationDays = stats.AvgStayDurationDays 
      ? parseFloat(stats.AvgStayDurationDays) 
      : null;

    // Format average stay duration
    let avgStayDurationFormatted = null;
    if (avgStayDurationDays !== null && !isNaN(avgStayDurationDays)) {
      const days = Math.floor(avgStayDurationDays);
      const hours = Math.floor((avgStayDurationDays - days) * 24);
      const minutes = Math.floor(((avgStayDurationDays - days) * 24 - hours) * 60);
      
      if (days > 0) {
        avgStayDurationFormatted = `${days} day${days !== 1 ? 's' : ''} ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        avgStayDurationFormatted = `${hours}h ${minutes}m`;
      } else {
        avgStayDurationFormatted = `${minutes}m`;
      }
    }

    // Calculate percentages
    const regularWardPercentage = totalAdmissions > 0 
      ? ((regularWardAdmissions / totalAdmissions) * 100).toFixed(2) 
      : '0.00';
    const specialRoomsPercentage = totalAdmissions > 0 
      ? ((specialRoomsAdmissions / totalAdmissions) * 100).toFixed(2) 
      : '0.00';

    // Prepare response filters
    const filters = {
      status: status,
      reportType: reportType,
      date: date || null,
      startDate: queryStartDate || null,
      endDate: queryEndDate || null
    };

    // Format data for chart
    const chartData = {
      labels: ['Regular Ward', 'Special Rooms'],
      data: [regularWardAdmissions, specialRoomsAdmissions],
      percentages: [regularWardPercentage, specialRoomsPercentage],
      datasets: [{
        label: 'Admissions by Room Type',
        data: [regularWardAdmissions, specialRoomsAdmissions],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    };

    res.status(200).json({
      success: true,
      message: 'IPD Statistics retrieved successfully',
      filters: filters,
      statistics: {
        totalAdmissions: totalAdmissions,
        regularWard: {
          count: regularWardAdmissions,
          percentage: parseFloat(regularWardPercentage)
        },
        specialRooms: {
          count: specialRoomsAdmissions,
          percentage: parseFloat(specialRoomsPercentage)
        },
        avgStayDurationDays: avgStayDurationDays ? Math.round(avgStayDurationDays * 100) / 100 : null,
        avgStayDurationFormatted: avgStayDurationFormatted
      },
      chartData: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching IPD statistics',
      error: error.message,
    });
  }
};

/**
 * Get IPD Summary - Discharged Today, Critical Patients, Bed Occupancy
 * Query parameters:
 * - status: Filter by status (Active, Inactive) - defaults to 'Active'
 * - date: Filter for a specific date (YYYY-MM-DD) - optional, defaults to today for discharged count
 * Note: Discharged Today uses the provided date or today's date. Critical Patients and Bed Occupancy are current status.
 */
exports.getIPDSummary = async (req, res) => {
  try {
    const { status = 'Active', date } = req.query;

    // Validate status
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Active" or "Inactive".',
      });
    }

    // Validate date format if provided
    let checkDate = new Date().toISOString().split('T')[0]; // Default to today
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-01)',
        });
      }
      checkDate = date;
    }

    // Query 1: Count Discharged Today
    const dischargedTodayQuery = `
      SELECT COUNT(DISTINCT ra."RoomAdmissionId") AS "DischargedToday"
      FROM "RoomAdmission" ra
      WHERE ra."Status" = $1
        AND ra."AdmissionStatus" = 'Discharged'
        AND DATE(ra."RoomVacantDate") = $2::date
    `;

    // Query 2: Count Critical Patients (patients with latest VitalsStatus = 'Critical')
    const criticalPatientsQuery = `
      WITH LatestVitals AS (
        SELECT DISTINCT ON (pavv."RoomAdmissionId", pavv."PatientId")
          pavv."RoomAdmissionId",
          pavv."PatientId",
          pavv."VitalsStatus",
          pavv."RecordedDateTime"
        FROM "PatientAdmitVisitVitals" pavv
        INNER JOIN "RoomAdmission" ra ON pavv."RoomAdmissionId" = ra."RoomAdmissionId"
        WHERE pavv."Status" = 'Active'
          AND ra."Status" = $1
          AND ra."AdmissionStatus" != 'Discharged'
        ORDER BY pavv."RoomAdmissionId", pavv."PatientId", pavv."RecordedDateTime" DESC
      )
      SELECT COUNT(DISTINCT lv."PatientId") AS "CriticalPatients"
      FROM LatestVitals lv
      WHERE lv."VitalsStatus" = 'Critical'
    `;

    // Query 3: Bed Occupancy (Total beds vs Occupied beds)
    const bedOccupancyQuery = `
      SELECT 
        COUNT(DISTINCT rb."RoomBedsId") AS "TotalBeds",
        COUNT(DISTINCT CASE 
          WHEN ra."Status" = $1 
            AND ra."AdmissionStatus" != 'Discharged'
            AND ra."RoomVacantDate" IS NULL
          THEN ra."RoomBedsId" 
        END) AS "OccupiedBeds"
      FROM "RoomBeds" rb
      LEFT JOIN "RoomAdmission" ra ON rb."RoomBedsId" = ra."RoomBedsId"
      WHERE rb."Status" = 'Active'
    `;

    // Execute all queries in parallel
    const [dischargedResult, criticalResult, occupancyResult] = await Promise.all([
      db.query(dischargedTodayQuery, [status, checkDate]),
      db.query(criticalPatientsQuery, [status]),
      db.query(bedOccupancyQuery, [status])
    ]);

    // Process results
    const dischargedToday = parseInt(
      dischargedResult.rows[0].DischargedToday || 
      dischargedResult.rows[0].dischargedtoday || 0, 
      10
    );

    const criticalPatients = parseInt(
      criticalResult.rows[0].CriticalPatients || 
      criticalResult.rows[0].criticalpatients || 0, 
      10
    );

    const totalBeds = parseInt(
      occupancyResult.rows[0].TotalBeds || 
      occupancyResult.rows[0].totalbeds || 0, 
      10
    );

    const occupiedBeds = parseInt(
      occupancyResult.rows[0].OccupiedBeds || 
      occupancyResult.rows[0].occupiedbeds || 0, 
      10
    );

    const availableBeds = totalBeds - occupiedBeds;
    const bedOccupancyPercentage = totalBeds > 0 
      ? ((occupiedBeds / totalBeds) * 100).toFixed(2) 
      : '0.00';

    // Prepare response
    const filters = {
      status: status,
      date: checkDate
    };

    res.status(200).json({
      success: true,
      message: 'IPD Summary retrieved successfully',
      filters: filters,
      summary: {
        dischargedToday: {
          count: dischargedToday,
          date: checkDate
        },
        criticalPatients: {
          count: criticalPatients
        },
        bedOccupancy: {
          totalBeds: totalBeds,
          occupiedBeds: occupiedBeds,
          availableBeds: availableBeds,
          occupancyPercentage: parseFloat(bedOccupancyPercentage)
        }
      },
      chartData: {
        bedOccupancy: {
          labels: ['Occupied', 'Available'],
          data: [occupiedBeds, availableBeds],
          datasets: [{
            label: 'Bed Occupancy',
            data: [occupiedBeds, availableBeds],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(75, 192, 192, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
          }]
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching IPD summary',
      error: error.message,
    });
  }
};

