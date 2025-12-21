const db = require('../db');
const bcrypt = require('bcrypt');

const mapUserRow = (row) => ({
  UserId: row.UserId || row.userid,
  RoleId: row.RoleId || row.roleid,
  UserName: row.UserName || row.username,
  PhoneNo: row.PhoneNo || row.phoneno,
  EmailId: row.EmailId || row.emailid,
  DoctorDepartmentId: row.DoctorDepartmentId || row.doctordepartmentid,
  DoctorQualification: row.DoctorQualification || row.doctorqualification,
  DoctorType: row.DoctorType || row.doctortype || null,
  DoctorOPDCharge: row.DoctorOPDCharge !== undefined && row.DoctorOPDCharge !== null ? parseFloat(row.DoctorOPDCharge) : (row.doctoropdcharge !== undefined && row.doctoropdcharge !== null ? parseFloat(row.doctoropdcharge) : null),
  DoctorSurgeryCharge: row.DoctorSurgeryCharge !== undefined && row.DoctorSurgeryCharge !== null ? parseFloat(row.DoctorSurgeryCharge) : (row.doctorsurgerycharge !== undefined && row.doctorsurgerycharge !== null ? parseFloat(row.doctorsurgerycharge) : null),
  OPDConsultation: row.OPDConsultation || row.opdconsultation || null,
  IPDVisit: row.IPDVisit || row.ipdvisit || null,
  OTHandle: row.OTHandle || row.othandle || null,
  ICUVisits: row.ICUVisits || row.icuvisits || null,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
  CreatedAt: row.CreatedAt || row.createdat,
  RoleName: row.RoleName || row.rolename || null,
  DepartmentName: row.DepartmentName || row.departmentname || null,
});

exports.getAllUsers = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let query = `
      SELECT u.*, r."RoleName", d."DepartmentName"
      FROM "Users" u
      LEFT JOIN "Roles" r ON u."RoleId" = r."RoleId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
    `;
    if (status) {
      params.push(status);
      query += ' WHERE u."Status" = $1';
    }
    query += ' ORDER BY u."CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapUserRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is an integer
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid UserId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      `
      SELECT u.*, r."RoleName", d."DepartmentName"
      FROM "Users" u
      LEFT JOIN "Roles" r ON u."RoleId" = r."RoleId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
      WHERE u."UserId" = $1
      `,
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: mapUserRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      RoleId,
      UserName,
      Password,
      PhoneNo,
      EmailId,
      DoctorDepartmentId,
      DoctorQualification,
      DoctorType,
      DoctorOPDCharge,
      DoctorSurgeryCharge,
      OPDConsultation,
      IPDVisit,
      OTHandle,
      ICUVisits,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    if (!RoleId) {
      return res.status(400).json({ success: false, message: 'RoleId is required' });
    }
    // Validate RoleId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(RoleId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'RoleId must be a valid UUID.' 
      });
    }
    if (!UserName || !UserName.trim()) {
      return res.status(400).json({ success: false, message: 'UserName is required' });
    }
    if (!Password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Validate DoctorType if provided
    if (DoctorType !== undefined && DoctorType !== null && DoctorType !== '') {
      if (!['INHOUSE', 'VISITING'].includes(DoctorType.toUpperCase())) {
        return res.status(400).json({ 
          success: false, 
          message: 'DoctorType must be either "INHOUSE" or "VISITING".' 
        });
      }
    }

    // Validate Yes/No fields
    const yesNoFields = [
      { name: 'OPDConsultation', value: OPDConsultation },
      { name: 'IPDVisit', value: IPDVisit },
      { name: 'OTHandle', value: OTHandle },
      { name: 'ICUVisits', value: ICUVisits },
    ];

    for (const field of yesNoFields) {
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        const normalizedValue = field.value.toString().trim();
        if (!['Yes', 'No'].includes(normalizedValue)) {
          return res.status(400).json({ 
            success: false, 
            message: `${field.name} must be either "Yes" or "No".` 
          });
        }
      }
    }

    // Validate currency fields
    if (DoctorOPDCharge !== undefined && DoctorOPDCharge !== null && DoctorOPDCharge !== '') {
      const charge = parseFloat(DoctorOPDCharge);
      if (isNaN(charge) || charge < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'DoctorOPDCharge must be a valid positive number.' 
        });
      }
    }

    if (DoctorSurgeryCharge !== undefined && DoctorSurgeryCharge !== null && DoctorSurgeryCharge !== '') {
      const charge = parseFloat(DoctorSurgeryCharge);
      if (isNaN(charge) || charge < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'DoctorSurgeryCharge must be a valid positive number.' 
        });
      }
    }

    // Validate CreatedBy if provided - must be a valid integer
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'CreatedBy must be a valid integer. Leave it empty or null if not needed.' 
        });
      }
      createdByValue = createdByInt;
    }

    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    // UserId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "Users"
        ("RoleId","UserName","Password","PhoneNo","EmailId","DoctorDepartmentId",
         "DoctorQualification","DoctorType","DoctorOPDCharge","DoctorSurgeryCharge",
         "OPDConsultation","IPDVisit","OTHandle","ICUVisits","Status","CreatedBy")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      RoleId,
      UserName.trim(),
      hashedPassword,
      PhoneNo || null,
      EmailId || null,
      DoctorDepartmentId || null,
      DoctorQualification || null,
      DoctorType ? DoctorType.toUpperCase() : null,
      DoctorOPDCharge !== undefined && DoctorOPDCharge !== null && DoctorOPDCharge !== '' ? parseFloat(DoctorOPDCharge) : null,
      DoctorSurgeryCharge !== undefined && DoctorSurgeryCharge !== null && DoctorSurgeryCharge !== '' ? parseFloat(DoctorSurgeryCharge) : null,
      OPDConsultation ? OPDConsultation.toString().trim() : null,
      IPDVisit ? IPDVisit.toString().trim() : null,
      OTHandle ? OTHandle.toString().trim() : null,
      ICUVisits ? ICUVisits.toString().trim() : null,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: mapUserRow(rows[0]),
    });
  } catch (error) {
    // Handle invalid integer format error
    if (error.message && (error.message.includes('invalid input syntax for type integer') || error.message.includes('invalid input syntax for type numeric'))) {
      return res.status(400).json({
        success: false,
        message: 'CreatedBy must be a valid integer. Leave it empty or null if not needed.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      RoleId,
      UserName,
      Password,
      PhoneNo,
      EmailId,
      DoctorDepartmentId,
      DoctorQualification,
      DoctorType,
      DoctorOPDCharge,
      DoctorSurgeryCharge,
      OPDConsultation,
      IPDVisit,
      OTHandle,
      ICUVisits,
      Status,
      CreatedBy,
    } = req.body;

    // Validate CreatedBy if provided - must be a valid integer
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'CreatedBy must be a valid integer. Leave it empty or null if not needed.' 
        });
      }
      createdByValue = createdByInt;
    }

    // Validate RoleId if provided - must be a valid UUID
    let roleIdValue = null;
    if (RoleId !== undefined && RoleId !== null && RoleId !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(RoleId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'RoleId must be a valid UUID.' 
        });
      }
      roleIdValue = RoleId;
    }

    // Validate DoctorType if provided
    if (DoctorType !== undefined && DoctorType !== null && DoctorType !== '') {
      if (!['INHOUSE', 'VISITING'].includes(DoctorType.toUpperCase())) {
        return res.status(400).json({ 
          success: false, 
          message: 'DoctorType must be either "INHOUSE" or "VISITING".' 
        });
      }
    }

    // Validate Yes/No fields
    const yesNoFields = [
      { name: 'OPDConsultation', value: OPDConsultation },
      { name: 'IPDVisit', value: IPDVisit },
      { name: 'OTHandle', value: OTHandle },
      { name: 'ICUVisits', value: ICUVisits },
    ];

    for (const field of yesNoFields) {
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        const normalizedValue = field.value.toString().trim();
        if (!['Yes', 'No'].includes(normalizedValue)) {
          return res.status(400).json({ 
            success: false, 
            message: `${field.name} must be either "Yes" or "No".` 
          });
        }
      }
    }

    // Validate currency fields
    if (DoctorOPDCharge !== undefined && DoctorOPDCharge !== null && DoctorOPDCharge !== '') {
      const charge = parseFloat(DoctorOPDCharge);
      if (isNaN(charge) || charge < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'DoctorOPDCharge must be a valid positive number.' 
        });
      }
    }

    if (DoctorSurgeryCharge !== undefined && DoctorSurgeryCharge !== null && DoctorSurgeryCharge !== '') {
      const charge = parseFloat(DoctorSurgeryCharge);
      if (isNaN(charge) || charge < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'DoctorSurgeryCharge must be a valid positive number.' 
        });
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (Password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(Password, saltRounds);
    }

    // Validate that id is an integer
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid UserId. Must be an integer.' 
      });
    }

    const updateQuery = `
      UPDATE "Users"
      SET
        "RoleId" = COALESCE($1::uuid, "RoleId"),
        "UserName" = COALESCE($2, "UserName"),
        "Password" = COALESCE($3, "Password"),
        "PhoneNo" = COALESCE($4, "PhoneNo"),
        "EmailId" = COALESCE($5, "EmailId"),
        "DoctorDepartmentId" = COALESCE($6, "DoctorDepartmentId"),
        "DoctorQualification" = COALESCE($7, "DoctorQualification"),
        "DoctorType" = COALESCE($8, "DoctorType"),
        "DoctorOPDCharge" = COALESCE($9, "DoctorOPDCharge"),
        "DoctorSurgeryCharge" = COALESCE($10, "DoctorSurgeryCharge"),
        "OPDConsultation" = COALESCE($11, "OPDConsultation"),
        "IPDVisit" = COALESCE($12, "IPDVisit"),
        "OTHandle" = COALESCE($13, "OTHandle"),
        "ICUVisits" = COALESCE($14, "ICUVisits"),
        "Status" = COALESCE($15, "Status"),
        "CreatedBy" = COALESCE($16, "CreatedBy")
      WHERE "UserId" = $17
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, [
      roleIdValue !== null ? roleIdValue : null,
      UserName ? UserName.trim() : null,
      hashedPassword || null,
      PhoneNo || null,
      EmailId || null,
      DoctorDepartmentId || null,
      DoctorQualification || null,
      DoctorType !== undefined && DoctorType !== null && DoctorType !== '' ? DoctorType.toUpperCase() : null,
      DoctorOPDCharge !== undefined && DoctorOPDCharge !== null && DoctorOPDCharge !== '' ? parseFloat(DoctorOPDCharge) : null,
      DoctorSurgeryCharge !== undefined && DoctorSurgeryCharge !== null && DoctorSurgeryCharge !== '' ? parseFloat(DoctorSurgeryCharge) : null,
      OPDConsultation !== undefined && OPDConsultation !== null && OPDConsultation !== '' ? OPDConsultation.toString().trim() : null,
      IPDVisit !== undefined && IPDVisit !== null && IPDVisit !== '' ? IPDVisit.toString().trim() : null,
      OTHandle !== undefined && OTHandle !== null && OTHandle !== '' ? OTHandle.toString().trim() : null,
      ICUVisits !== undefined && ICUVisits !== null && ICUVisits !== '' ? ICUVisits.toString().trim() : null,
      Status || null,
      createdByValue || null,
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: mapUserRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is an integer
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid UserId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "Users" WHERE "UserId" = $1 RETURNING *;',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: mapUserRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

/**
 * Get comprehensive doctor data by UserId (Staff ID)
 * Returns doctor information along with statistics about appointments, patients, lab tests, visits, etc.
 */
exports.getDoctorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is an integer
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid UserId. Must be an integer.' 
      });
    }

    // Get basic doctor information
    const doctorQuery = `
      SELECT u.*, r."RoleName", d."DepartmentName", d."DepartmentCategory", d."SpecialisationDetails"
      FROM "Users" u
      LEFT JOIN "Roles" r ON u."RoleId" = r."RoleId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
      WHERE u."UserId" = $1
    `;
    
    const { rows: doctorRows } = await db.query(doctorQuery, [userId]);
    
    if (doctorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doctor = mapUserRow(doctorRows[0]);

    // Get appointment statistics
    const appointmentStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalAppointments",
        COUNT(*) FILTER (WHERE "AppointmentStatus" = 'Waiting') AS "WaitingAppointments",
        COUNT(*) FILTER (WHERE "AppointmentStatus" = 'Consulting') AS "ConsultingAppointments",
        COUNT(*) FILTER (WHERE "AppointmentStatus" = 'Completed') AS "CompletedAppointments",
        COUNT(DISTINCT "PatientId") AS "UniquePatients",
        COUNT(*) FILTER (WHERE "AppointmentDate" = CURRENT_DATE) AS "TodayAppointments"
      FROM "PatientAppointment"
      WHERE "DoctorId" = $1 AND "Status" = 'Active'
    `;
    const { rows: appointmentStats } = await db.query(appointmentStatsQuery, [userId]);

    // Get lab test statistics
    const labTestStatsQuery = `
      SELECT 
        COUNT(DISTINCT plt."PatientLabTestsId") AS "TotalLabTests",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'Pending') AS "PendingLabTests",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'InProgress') AS "InProgressLabTests",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'Completed') AS "CompletedLabTests"
      FROM "PatientLabTest" plt
      LEFT JOIN "PatientAppointment" pa ON plt."AppointmentId" = pa."PatientAppointmentId"
      WHERE (pa."DoctorId" = $1 OR plt."OrderedByDoctorId" = $1) AND plt."Status" = 'Active'
    `;
    const { rows: labTestStats } = await db.query(labTestStatsQuery, [userId]);

    // Get ICU visit statistics
    const icuVisitStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalICUVisits",
        COUNT(*) FILTER (WHERE "DoctorVisitedDateTime" >= CURRENT_DATE) AS "TodayICUVisits"
      FROM "ICUDoctorVisits"
      WHERE "DoctorId" = $1
    `;
    const { rows: icuVisitStats } = await db.query(icuVisitStatsQuery, [userId]);

    // Get room admission statistics (as admitting doctor)
    const roomAdmissionStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalRoomAdmissions",
        COUNT(*) FILTER (WHERE "AdmissionStatus" = 'Admitted') AS "ActiveAdmissions",
        COUNT(*) FILTER (WHERE "AdmissionStatus" = 'Discharged') AS "DischargedAdmissions"
      FROM "RoomAdmission"
      WHERE "AdmittingDoctorId" = $1 AND "Status" = 'Active'
    `;
    const { rows: roomAdmissionStats } = await db.query(roomAdmissionStatsQuery, [userId]);

    // Get patient admit doctor visits statistics
    const patientAdmitVisitStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalPatientAdmitVisits",
        COUNT(*) FILTER (WHERE "DoctorVisitedDateTime" >= CURRENT_DATE) AS "TodayPatientAdmitVisits"
      FROM "PatientAdmitDoctorVisits"
      WHERE "DoctorId" = $1
    `;
    const { rows: patientAdmitVisitStats } = await db.query(patientAdmitVisitStatsQuery, [userId]);

    // Get OT allocation statistics
    const otStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalOTAllocations",
        COUNT(*) FILTER (WHERE "OperationStatus" = 'Scheduled') AS "ScheduledOT",
        COUNT(*) FILTER (WHERE "OperationStatus" = 'InProgress') AS "InProgressOT",
        COUNT(*) FILTER (WHERE "OperationStatus" = 'Completed') AS "CompletedOT"
      FROM "PatientOTAllocation"
      WHERE ("LeadSurgeonId" = $1 OR "AssistantDoctorId" = $1 OR "AnaesthetistId" = $1) AND "Status" = 'Active'
    `;
    const { rows: otStats } = await db.query(otStatsQuery, [userId]);

    // Get emergency admission statistics
    const emergencyStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalEmergencyAdmissions",
        COUNT(*) FILTER (WHERE "EmergencyStatus" = 'Admitted') AS "ActiveEmergencyAdmissions"
      FROM "EmergencyAdmission"
      WHERE "DoctorId" = $1 AND "Status" = 'Active'
    `;
    const { rows: emergencyStats } = await db.query(emergencyStatsQuery, [userId]);

    // Get ICU admission statistics (as attending doctor)
    const icuAdmissionStatsQuery = `
      SELECT 
        COUNT(*) AS "TotalICUAdmissions",
        COUNT(*) FILTER (WHERE "ICUAdmissionStatus" = 'Occupied') AS "ActiveICUAdmissions"
      FROM "PatientICUAdmission"
      WHERE "AttendingDoctorId" = $1 AND "Status" = 'Active'
    `;
    const { rows: icuAdmissionStats } = await db.query(icuAdmissionStatsQuery, [userId]);

    // Compile all statistics
    const statistics = {
      appointments: {
        total: parseInt(appointmentStats[0]?.TotalAppointments || 0, 10),
        waiting: parseInt(appointmentStats[0]?.WaitingAppointments || 0, 10),
        consulting: parseInt(appointmentStats[0]?.ConsultingAppointments || 0, 10),
        completed: parseInt(appointmentStats[0]?.CompletedAppointments || 0, 10),
        today: parseInt(appointmentStats[0]?.TodayAppointments || 0, 10),
        uniquePatients: parseInt(appointmentStats[0]?.UniquePatients || 0, 10),
      },
      labTests: {
        total: parseInt(labTestStats[0]?.TotalLabTests || 0, 10),
        pending: parseInt(labTestStats[0]?.PendingLabTests || 0, 10),
        inProgress: parseInt(labTestStats[0]?.InProgressLabTests || 0, 10),
        completed: parseInt(labTestStats[0]?.CompletedLabTests || 0, 10),
      },
      icuVisits: {
        total: parseInt(icuVisitStats[0]?.TotalICUVisits || 0, 10),
        today: parseInt(icuVisitStats[0]?.TodayICUVisits || 0, 10),
      },
      roomAdmissions: {
        total: parseInt(roomAdmissionStats[0]?.TotalRoomAdmissions || 0, 10),
        active: parseInt(roomAdmissionStats[0]?.ActiveAdmissions || 0, 10),
        discharged: parseInt(roomAdmissionStats[0]?.DischargedAdmissions || 0, 10),
      },
      patientAdmitVisits: {
        total: parseInt(patientAdmitVisitStats[0]?.TotalPatientAdmitVisits || 0, 10),
        today: parseInt(patientAdmitVisitStats[0]?.TodayPatientAdmitVisits || 0, 10),
      },
      otAllocations: {
        total: parseInt(otStats[0]?.TotalOTAllocations || 0, 10),
        scheduled: parseInt(otStats[0]?.ScheduledOT || 0, 10),
        inProgress: parseInt(otStats[0]?.InProgressOT || 0, 10),
        completed: parseInt(otStats[0]?.CompletedOT || 0, 10),
      },
      emergencyAdmissions: {
        total: parseInt(emergencyStats[0]?.TotalEmergencyAdmissions || 0, 10),
        active: parseInt(emergencyStats[0]?.ActiveEmergencyAdmissions || 0, 10),
      },
      icuAdmissions: {
        total: parseInt(icuAdmissionStats[0]?.TotalICUAdmissions || 0, 10),
        active: parseInt(icuAdmissionStats[0]?.ActiveICUAdmissions || 0, 10),
      },
    };

    res.status(200).json({
      success: true,
      data: {
        doctor,
        statistics,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor details',
      error: error.message,
    });
  }
};

/**
 * Get role-wise user count from Users table
 * Returns count of users per role
 * Optional query parameters:
 * - status: Filter by user status (Active, Inactive)
 */
exports.getRoleWiseUserCount = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        u."RoleId",
        r."RoleName",
        r."RoleDescription",
        COUNT(u."UserId") AS "UserCount",
        COUNT(CASE WHEN u."Status" = 'Active' THEN 1 END) AS "ActiveUserCount",
        COUNT(CASE WHEN u."Status" = 'Inactive' THEN 1 END) AS "InactiveUserCount"
      FROM "Users" u
      INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push(`u."Status" = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY u."RoleId", r."RoleName", r."RoleDescription"
      ORDER BY "UserCount" DESC, r."RoleName" ASC
    `;
    
    const { rows } = await db.query(query, params);
    
    const totalUsers = rows.reduce((sum, row) => sum + parseInt(row.UserCount, 10), 0);
    const totalActiveUsers = rows.reduce((sum, row) => sum + parseInt(row.ActiveUserCount, 10), 0);
    const totalInactiveUsers = rows.reduce((sum, row) => sum + parseInt(row.InactiveUserCount, 10), 0);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      totalUsers: totalUsers,
      totalActiveUsers: totalActiveUsers,
      totalInactiveUsers: totalInactiveUsers,
      filters: {
        status: status || null,
      },
      data: rows.map(row => ({
        RoleId: row.RoleId || row.roleid,
        RoleName: row.RoleName || row.rolename,
        RoleDescription: row.RoleDescription || row.roledescription || null,
        UserCount: parseInt(row.UserCount, 10) || 0,
        ActiveUserCount: parseInt(row.ActiveUserCount, 10) || 0,
        InactiveUserCount: parseInt(row.InactiveUserCount, 10) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching role-wise user count',
      error: error.message,
    });
  }
};

