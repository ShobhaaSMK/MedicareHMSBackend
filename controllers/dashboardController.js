const db = require('../db');

// Helper function to map department row data
const mapDepartmentRow = (row) => ({
  DoctorDepartmentId: row.DoctorDepartmentId || row.doctordepartmentid,
  DepartmentName: row.DepartmentName || row.departmentname,
  DepartmentCategory: row.DepartmentCategory || row.departmentcategory,
  SpecialisationDetails: row.SpecialisationDetails || row.specialisationdetails,
  NoOfDoctors: row.NoOfDoctors || row.noofdoctors || 0,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
  CreatedBy: row.CreatedBy || row.createdby,
});

/**
 * Get ICU Occupied patients count
 * Fetches count from PatientICUAdmission table joined with ICU table
 * where ICUAdmissionStatus = 'Occupied' and Status = 'Active'
 */
exports.getICUOccupiedPatientsCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientICUAdmission" pica
      INNER JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      WHERE pica."ICUAdmissionStatus" = 'Occupied'
      AND pica."Status" = 'Active'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'ICU occupied patients count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'PatientICUAdmission joined with ICU',
          conditions: {
            icuAdmissionStatus: 'Occupied',
            status: 'Active'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU occupied patients count',
      error: error.message,
    });
  }
};

/**
 * Get Total ICU Count
 * Fetches count of active ICU records from ICU table where Status = 'Active'
 */
exports.getTotalICUCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "ICU"
      WHERE "Status" = 'Active'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Total ICU count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'ICU',
          conditions: {
            status: 'Active'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching total ICU count',
      error: error.message,
    });
  }
};

/**
 * Get count of all active patients
 * Fetches count from PatientRegistration table where Status = 'Active'
 */
exports.getActivePatientsCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientRegistration"
      WHERE "Status" = 'Active'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Active patients count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'PatientRegistration',
          conditions: {
            status: 'Active'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active patients count',
      error: error.message,
    });
  }
};

/**
 * Get doctor-wise patient appointment counts
 * Returns counts grouped by doctor with Waiting, Consulting, Completed, and Today appointment counts
 * Includes Doctor name, DepartmentName, DoctorType, and Status
 */
exports.getDoctorWiseAppointmentCounts = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const query = `
      SELECT 
        u."UserId" AS "DoctorId",
        u."UserName" AS "Doctor",
        dd."DepartmentName",
        u."DoctorType",
        COUNT(*) FILTER (
          WHERE pa."AppointmentStatus" = 'Waiting' 
          AND pa."Status" = 'Active'
        ) AS "Waiting",
        COUNT(*) FILTER (
          WHERE pa."AppointmentStatus" = 'Consulting' 
          AND pa."Status" = 'Active'
        ) AS "Consulting",
        COUNT(*) FILTER (
          WHERE pa."AppointmentStatus" = 'Completed' 
          AND pa."Status" = 'Active'
        ) AS "Completed",
        COUNT(*) FILTER (
          WHERE pa."AppointmentDate" = $1::date 
          AND pa."Status" = 'Active'
        ) AS "Today",
        u."Status"
      FROM "PatientAppointment" pa
      INNER JOIN "Users" u ON pa."DoctorId" = u."UserId"
      INNER JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE pa."Status" = 'Active'
      GROUP BY 
        u."UserId",
        u."UserName",
        dd."DepartmentName",
        u."DoctorType",
        u."Status"
      ORDER BY u."UserName" ASC
    `;

    const { rows } = await db.query(query, [today]);

    const mappedData = rows.map(row => ({
      Doctor: row.Doctor || row.doctor || null,
      DepartmentName: row.DepartmentName || row.departmentname || null,
      DoctorType: row.DoctorType || row.doctortype || null,
      Waiting: parseInt(row.Waiting || row.waiting, 10) || 0,
      Consulting: parseInt(row.Consulting || row.consulting, 10) || 0,
      Completed: parseInt(row.Completed || row.completed, 10) || 0,
      Today: parseInt(row.Today || row.today, 10) || 0,
      Status: row.Status || row.status || null
    }));

    res.status(200).json({
      success: true,
      message: 'Doctor-wise appointment counts retrieved successfully',
      date: today,
      count: mappedData.length,
      data: mappedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor-wise appointment counts',
      error: error.message,
    });
  }
};

/**
 * Get IPD Room Distribution data - RoomTypeWise count from active RoomAdmission records
 * Returns RoomType wise distribution data as array with name, value, and color
 */
exports.getIPDRoomDistribution = async (req, res) => {
  try {
    const query = `
      SELECT 
        rb."RoomType",
        COUNT(*) AS count
      FROM "RoomAdmission" ra
      INNER JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      WHERE ra."Status" = 'Active'
        AND ra."AdmissionStatus" != 'Discharged'
      GROUP BY rb."RoomType"
      ORDER BY 
        CASE rb."RoomType"
          WHEN 'Special' THEN 1
          WHEN 'Special Shared' THEN 2
          WHEN 'Regular' THEN 3
          ELSE 4
        END
    `;

    const { rows } = await db.query(query);

    // Color mapping for room types
    const roomTypeColors = {
      'Special': '#8b5cf6',
      'Special Shared': '#3b82f6',
      'Regular': '#10b981'
    };

    // Format data as array with name, value, and color
    const data = rows.map(row => {
      const roomType = row.RoomType || row.roomtype;
      const count = parseInt(row.count, 10) || 0;
      return {
        name: roomType,
        value: count,
        color: roomTypeColors[roomType] || '#6b7280' // Default gray color if room type not in mapping
      };
    });

    res.status(200).json({
      success: true,
      message: 'IPD Room Distribution data retrieved successfully',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching IPD Room Distribution data',
      error: error.message,
    });
  }
};

/**
 * Get Today's OPD patients count
 * Returns count of appointments for today where Status = 'Active'
 */
exports.getTodayOPDPatientsCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientAppointment"
      WHERE "AppointmentDate" = $1::date
      AND "Status" = 'Active'
    `;

    const { rows } = await db.query(query, [today]);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Today\'s OPD patients count retrieved successfully',
      date: today,
      count: count,
      data: {
        date: today,
        count: count,
        status: 'Active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s OPD patients count',
      error: error.message,
    });
  }
};

/**
 * Get Active Tokens Count
 * Returns count of appointments where Status = 'Active' and AppointmentStatus = 'Consulting'
 * Optional query parameters:
 * - appointmentDate: Filter by specific date (YYYY-MM-DD)
 * - doctorId: Filter by specific doctor (UserId)
 */
exports.getActiveTokensCount = async (req, res) => {
  try {
    const { appointmentDate, doctorId } = req.query;
    
    // Build WHERE conditions
    const conditions = [
      'pa."Status" = \'Active\'',
      '(pa."AppointmentStatus" = \'Consulting\')'
    ];
    const params = [];
    
    if (appointmentDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-11-30)',
        });
      }
      conditions.push(`pa."AppointmentDate" = $${params.length + 1}`);
      params.push(appointmentDate);
    }
    
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (isNaN(doctorIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid doctorId. Must be a valid integer.',
        });
      }
      conditions.push(`pa."DoctorId" = $${params.length + 1}`);
      params.push(doctorIdInt);
    }
    
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    
    const query = `
      SELECT COUNT(*) AS "ActiveTokensCount"
      FROM "PatientAppointment" pa
      ${whereClause}
    `;
    
    const { rows } = await db.query(query, params);
    
    const count = parseInt(rows[0].ActiveTokensCount, 10) || 0;
    
    res.status(200).json({
      success: true,
      filters: {
        appointmentDate: appointmentDate || null,
        doctorId: doctorId || null,
      },
      count: count,
      message: `Found ${count} active token(s) with status Waiting or Consulting`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active tokens count',
      error: error.message,
    });
  }
};

/**
 * Get Today's IPD admissions count
 * Returns count of room admissions for today where Status = 'Active' and AdmissionStatus != 'Discharged'
 */
exports.getTodayIPDAdmissionsCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
      SELECT COUNT(*) AS count
      FROM "RoomAdmission"
      WHERE DATE("RoomAllocationDate") = $1::date
      AND "Status" = 'Active'
      AND "AdmissionStatus" != 'Discharged'
    `;

    const { rows } = await db.query(query, [today]);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Today\'s IPD admissions count retrieved successfully',
      date: today,
      count: count,
      data: {
        date: today,
        count: count,
        status: 'Active',
        admissionStatus: 'Not Discharged'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s IPD admissions count',
      error: error.message,
    });
  }
};

/**
 * Get Today's OT scheduled count
 * Returns count of OT allocations for today where OperationStatus = 'Scheduled' or 'In Progress'
 */
exports.getTodayOTScheduledCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Compare OTAllocationDate with today's date
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientOTAllocation"
      WHERE "OTAllocationDate"::date = $1::date
      AND ("OperationStatus" = 'Scheduled' OR "OperationStatus" = 'In Progress')
    `;

    const { rows } = await db.query(query, [today]);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Today\'s OT scheduled count retrieved successfully',
      date: today,
      count: count,
      data: {
        date: today,
        count: count,
        operationStatus: ['Scheduled', 'In Progress']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s OT scheduled count',
      error: error.message,
    });
  }
};

/**
 * Get OPD Patient Flow - Weekly Day Name and Counts
 * Returns daily OPD patient counts for the current week (Monday to Sunday) with day names
 * Optional query parameter: ?date=YYYY-MM-DD (to get data for a specific week)
 */
exports.getOPDPatientFlowWeekly = async (req, res) => {
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
      const providedDate = new Date(date + 'T00:00:00');
      // Calculate Monday of the week for the provided date
      const dayOfWeek = providedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      // If Sunday (0), go back 6 days. Otherwise, go back (dayOfWeek - 1) days to get Monday
      const daysToMonday = dayOfWeek === 0 ? 6 : (dayOfWeek === 1 ? 0 : dayOfWeek - 1);
      startDate = new Date(providedDate);
      startDate.setDate(providedDate.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to current week starting from Monday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : (dayOfWeek === 1 ? 0 : dayOfWeek - 1);
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
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Format dates for SQL query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Day names array
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Query to get daily OPD patient counts for the week
    const query = `
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

    const { rows } = await db.query(query, [startDateStr, endDateStr]);

    // Create a map of date to count
    const dateCountMap = new Map();
    rows.forEach(row => {
      const dateStr = row.appointment_date.toISOString().split('T')[0];
      dateCountMap.set(dateStr, parseInt(row.patient_count, 10) || 0);
    });

    // Generate data for all 7 days of the week
    const weeklyData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const dayName = dayNames[dayOfWeek];
      
      weeklyData.push({
        dayName: dayName.trim(),
        count: dateCountMap.get(dateStr) || 0
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      message: 'OPD Patient Flow Weekly data retrieved successfully',
      week: {
        startDate: startDateStr,
        endDate: endDateStr
      },
      data: weeklyData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OPD Patient Flow Weekly data',
      error: error.message,
    });
  }
};

/**
 * Get all doctor departments
 * Optional query parameter: ?status=String (to filter by status)
 * Returns list of all doctor departments with optional status filter
 */
exports.getAllDepartments = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM "DoctorDepartment"';
    const params = [];
    if (status) {
      query += ' WHERE "Status" = $1';
      params.push(status);
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapDepartmentRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor departments',
      error: error.message,
    });
  }
};
