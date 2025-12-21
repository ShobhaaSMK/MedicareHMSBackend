const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];
const allowedEmergencyStatus = ['Admitted', 'IPD', 'OT', 'ICU', 'Discharged'];
const allowedPatientCondition = ['Critical', 'Stable'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapEmergencyAdmissionRow = (row) => ({
  EmergencyAdmissionId: row.EmergencyAdmissionId || row.emergencyadmissionid,
  DoctorId: row.DoctorId || row.doctorid,
  PatientId: row.PatientId || row.patientid,
  EmergencyBedId: row.EmergencyBedId || row.emergencybedid,
  EmergencyAdmissionDate: row.EmergencyAdmissionDate || row.emergencyadmissiondate,
  EmergencyStatus: row.EmergencyStatus || row.emergencystatus,
  Priority: row.Priority || row.priority || null,
  AllocationFromDate: row.AllocationFromDate || row.allocationfromdate,
  AllocationToDate: row.AllocationToDate || row.allocationtodate,
  NumberOfDays: row.NumberOfDays || row.numberofdays,
  Diagnosis: row.Diagnosis || row.diagnosis,
  TreatementDetails: row.TreatementDetails || row.treatementdetails,
  PatientCondition: row.PatientCondition || row.patientcondition,
  TransferToIPD: row.TransferToIPD || row.transfertoipd,
  TransferToOT: row.TransferToOT || row.transfertoot,
  TransferToICU: row.TransferToICU || row.transfertoicu,
  TransferTo: row.TransferTo || row.transferto,
  TransferDetails: row.TransferDetails || row.transferdetails,
  AdmissionCreatedBy: row.AdmissionCreatedBy || row.admissioncreatedby,
  AdmissionCreatedAt: row.AdmissionCreatedAt || row.admissioncreatedat,
  Status: row.Status || row.status,
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  DoctorName: row.DoctorName || row.doctorname || null,
  EmergencyBedNo: row.EmergencyBedNo || row.emergencybedno || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
  EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate: row.EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate || row.emergencyadmissionid_emergencybedno_emergencyadmissiondate || null,
});

exports.getAllEmergencyAdmissions = async (req, res) => {
  try {
    const { status, emergencyStatus, patientId, doctorId, emergencyBedId } = req.query;
    let query = `
      SELECT 
        ea.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        e."EmergencyBedNo",
        u."UserName" AS "CreatedByName",
        CONCAT(ea."EmergencyAdmissionId", '_', COALESCE(e."EmergencyBedNo", ''), '_', ea."EmergencyAdmissionDate"::text) AS "EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate"
      FROM "EmergencyAdmission" ea
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ea."DoctorId" = d."UserId"
      LEFT JOIN "EmergencyBed" e ON ea."EmergencyBedId" = e."EmergencyBedId"
      LEFT JOIN "Users" u ON ea."AdmissionCreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`ea."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (emergencyStatus) {
      conditions.push(`ea."EmergencyStatus" = $${params.length + 1}`);
      params.push(emergencyStatus);
    }
    if (patientId) {
      if (uuidRegex.test(patientId)) {
        conditions.push(`ea."PatientId" = $${params.length + 1}::uuid`);
        params.push(patientId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid patientId. Must be a valid UUID.',
        });
      }
    }
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (!isNaN(doctorIdInt)) {
        conditions.push(`ea."DoctorId" = $${params.length + 1}`);
        params.push(doctorIdInt);
      }
    }
    if (emergencyBedId) {
      const emergencyBedIdInt = parseInt(emergencyBedId, 10);
      if (!isNaN(emergencyBedIdInt)) {
        conditions.push(`ea."EmergencyBedId" = $${params.length + 1}`);
        params.push(emergencyBedIdInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY ea."EmergencyAdmissionDate" DESC, ea."AdmissionCreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapEmergencyAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admissions',
      error: error.message,
    });
  }
};

exports.getEmergencyAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is an integer
    const emergencyAdmissionId = parseInt(id, 10);
    if (isNaN(emergencyAdmissionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyAdmissionId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      `SELECT 
        ea.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        e."EmergencyBedNo",
        u."UserName" AS "CreatedByName",
        CONCAT(ea."EmergencyAdmissionId", '_', COALESCE(e."EmergencyBedNo", ''), '_', ea."EmergencyAdmissionDate"::text) AS "EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate"
      FROM "EmergencyAdmission" ea
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ea."DoctorId" = d."UserId"
      LEFT JOIN "EmergencyBed" e ON ea."EmergencyBedId" = e."EmergencyBedId"
      LEFT JOIN "Users" u ON ea."AdmissionCreatedBy" = u."UserId"
      WHERE ea."EmergencyAdmissionId" = $1`,
      [emergencyAdmissionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission not found' });
    }
    res.status(200).json({ success: true, data: mapEmergencyAdmissionRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admission',
      error: error.message,
    });
  }
};

exports.getEmergencyAdmissionByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format',
      });
    }

    // Join with PatientOTAllocation to check OTAllocationDate
    // Fetch EmergencyAdmission records where the patient has an OT allocation on the specified date
    const query = `
      SELECT DISTINCT 
        ea.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        e."EmergencyBedNo",
        u."UserName" AS "CreatedByName",
        CONCAT(ea."EmergencyAdmissionId", '_', COALESCE(e."EmergencyBedNo", ''), '_', ea."EmergencyAdmissionDate"::text) AS "EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate"
      FROM "EmergencyAdmission" ea
      INNER JOIN "PatientOTAllocation" pota ON ea."PatientId" = pota."PatientId"
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ea."DoctorId" = d."UserId"
      LEFT JOIN "EmergencyBed" e ON ea."EmergencyBedId" = e."EmergencyBedId"
      LEFT JOIN "Users" u ON ea."AdmissionCreatedBy" = u."UserId"
      WHERE pota."OTAllocationDate" = $1::date
      ORDER BY ea."EmergencyAdmissionDate" DESC, ea."AdmissionCreatedAt" DESC
    `;

    const { rows } = await db.query(query, [date]);

    res.status(200).json({
      success: true,
      count: rows.length,
      date: date,
      message: `Emergency admissions with OT allocation on ${date}`,
      data: rows.map(mapEmergencyAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admissions by date',
      error: error.message,
    });
  }
};

exports.getEmergencyAdmissionByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate that status is provided
    if (!status || status.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'EmergencyStatus parameter is required',
      });
    }

    // Fetch EmergencyAdmission records filtered by EmergencyStatus
    const query = `
      SELECT 
        ea.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        e."EmergencyBedNo",
        u."UserName" AS "CreatedByName",
        CONCAT(ea."EmergencyAdmissionId", '_', COALESCE(e."EmergencyBedNo", ''), '_', ea."EmergencyAdmissionDate"::text) AS "EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate"
      FROM "EmergencyAdmission" ea
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ea."DoctorId" = d."UserId"
      LEFT JOIN "EmergencyBed" e ON ea."EmergencyBedId" = e."EmergencyBedId"
      LEFT JOIN "Users" u ON ea."AdmissionCreatedBy" = u."UserId"
      WHERE ea."EmergencyStatus" = $1
      ORDER BY ea."EmergencyAdmissionDate" DESC, ea."AdmissionCreatedAt" DESC
    `;

    const { rows } = await db.query(query, [status.trim()]);

    res.status(200).json({
      success: true,
      count: rows.length,
      emergencyStatus: status,
      message: `Emergency admissions with status: ${status}`,
      data: rows.map(mapEmergencyAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admissions by status',
      error: error.message,
    });
  }
};

exports.getEmergencyAdmissionsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, emergencyStatus } = req.query;

    // Validate patientId format (UUID)
    if (!uuidRegex.test(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patientId. Must be a valid UUID.',
      });
    }

    let query = `
      SELECT 
        ea.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        e."EmergencyBedNo",
        u."UserName" AS "CreatedByName",
        CONCAT(ea."EmergencyAdmissionId", '_', e."EmergencyBedNo", '_', ea."EmergencyAdmissionDate"::text) AS "EmergencyAdmissionId_EmergencyBedNo_EmergencyAdmissionDate"
      FROM "EmergencyAdmission" ea
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ea."DoctorId" = d."UserId"
      LEFT JOIN "EmergencyBed" e ON ea."EmergencyBedId" = e."EmergencyBedId"
      LEFT JOIN "Users" u ON ea."AdmissionCreatedBy" = u."UserId"
      WHERE ea."PatientId" = $1::uuid
    `;
    
    const params = [patientId];
    const conditions = [];

    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowedStatus.join(', ')}`,
        });
      }
      conditions.push(`ea."Status" = $${params.length + 1}`);
      params.push(status);
    }

    if (emergencyStatus) {
      if (!allowedEmergencyStatus.includes(emergencyStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid emergencyStatus. Must be one of: ${allowedEmergencyStatus.join(', ')}`,
        });
      }
      conditions.push(`ea."EmergencyStatus" = $${params.length + 1}`);
      params.push(emergencyStatus);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ea."EmergencyAdmissionDate" DESC LIMIT 1';

    const { rows } = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      patientId: patientId,
      data: rows.map(mapEmergencyAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admissions',
      error: error.message,
    });
  }
};

const validateEmergencyAdmissionPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && body.DoctorId === undefined) {
    errors.push('DoctorId is required');
  }
  if (body.DoctorId !== undefined && body.DoctorId !== null) {
    const doctorIdInt = parseInt(body.DoctorId, 10);
    if (isNaN(doctorIdInt)) {
      errors.push('DoctorId must be a valid integer');
    }
  }

  if (requireAll && body.PatientId === undefined) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null) {
    if (!uuidRegex.test(body.PatientId)) {
      errors.push('PatientId must be a valid UUID');
    }
  }

  if (requireAll && body.EmergencyBedId === undefined) {
    errors.push('EmergencyBedId is required');
  }
  if (body.EmergencyBedId !== undefined && body.EmergencyBedId !== null) {
    const emergencyBedIdInt = parseInt(body.EmergencyBedId, 10);
    if (isNaN(emergencyBedIdInt)) {
      errors.push('EmergencyBedId must be a valid integer');
    }
  }

  if (requireAll && !body.EmergencyAdmissionDate) {
    errors.push('EmergencyAdmissionDate is required');
  }
  if (body.EmergencyAdmissionDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.EmergencyAdmissionDate)) {
    errors.push('EmergencyAdmissionDate must be in YYYY-MM-DD format');
  }

  if (body.EmergencyStatus !== undefined && body.EmergencyStatus !== null) {
    if (typeof body.EmergencyStatus !== 'string') {
      errors.push('EmergencyStatus must be a string');
    } else if (!allowedEmergencyStatus.includes(body.EmergencyStatus)) {
      errors.push('EmergencyStatus must be one of: Admitted, IPD, OT, ICU, Discharged');
    }
  }

  if (body.AllocationFromDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.AllocationFromDate)) {
    errors.push('AllocationFromDate must be in YYYY-MM-DD format');
  }

  if (body.AllocationToDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.AllocationToDate)) {
    errors.push('AllocationToDate must be in YYYY-MM-DD format');
  }

  if (body.NumberOfDays !== undefined && body.NumberOfDays !== null && (isNaN(body.NumberOfDays) || body.NumberOfDays < 0)) {
    errors.push('NumberOfDays must be a non-negative integer');
  }

  if (body.Diagnosis !== undefined && body.Diagnosis !== null && typeof body.Diagnosis !== 'string') {
    errors.push('Diagnosis must be a string');
  }

  if (body.TreatementDetails !== undefined && body.TreatementDetails !== null && typeof body.TreatementDetails !== 'string') {
    errors.push('TreatementDetails must be a string');
  }

  if (body.PatientCondition !== undefined && body.PatientCondition !== null) {
    if (typeof body.PatientCondition !== 'string') {
      errors.push('PatientCondition must be a string');
    } else if (!allowedPatientCondition.includes(body.PatientCondition)) {
      errors.push('PatientCondition must be either Critical or Stable');
    }
  }

  if (body.TransferToIPD !== undefined && body.TransferToIPD !== null && !['Yes', 'No'].includes(body.TransferToIPD)) {
    errors.push('TransferToIPD must be Yes or No');
  }

  if (body.TransferToOT !== undefined && body.TransferToOT !== null && !['Yes', 'No'].includes(body.TransferToOT)) {
    errors.push('TransferToOT must be Yes or No');
  }

  if (body.TransferToICU !== undefined && body.TransferToICU !== null && !['Yes', 'No'].includes(body.TransferToICU)) {
    errors.push('TransferToICU must be Yes or No');
  }

  if (body.TransferTo !== undefined && body.TransferTo !== null && !['IPD', 'ICU', 'OT'].includes(body.TransferTo)) {
    errors.push('TransferTo must be IPD, ICU, or OT');
  }

  if (body.TransferDetails !== undefined && body.TransferDetails !== null && typeof body.TransferDetails !== 'string') {
    errors.push('TransferDetails must be a string');
  }

  if (body.AdmissionCreatedBy !== undefined && body.AdmissionCreatedBy !== null) {
    const admissionCreatedByInt = parseInt(body.AdmissionCreatedBy, 10);
    if (isNaN(admissionCreatedByInt)) {
      errors.push('AdmissionCreatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.Priority !== undefined && body.Priority !== null && typeof body.Priority !== 'string') {
    errors.push('Priority must be a string');
  }

  return errors;
};

exports.createEmergencyAdmission = async (req, res) => {
  try {
    const errors = validateEmergencyAdmissionPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      DoctorId,
      PatientId,
      EmergencyBedId,
      EmergencyAdmissionDate,
      EmergencyStatus,
      Priority,
      AllocationFromDate,
      AllocationToDate,
      NumberOfDays,
      Diagnosis,
      TreatementDetails,
      PatientCondition,
      TransferToIPD,
      TransferToOT,
      TransferToICU,
      TransferTo,
      TransferDetails,
      AdmissionCreatedBy,
      Status = 'Active',
    } = req.body;

    // Check if the bed is already occupied before creating admission
    const emergencyBedIdInt = parseInt(EmergencyBedId, 10);
    
    // DEBUG: Log POST request details
    console.log('\n=== DEBUG: EmergencyAdmission CREATE Request ===');
    console.log('POST /api/emergency-admissions');
    console.log('Request Body:', JSON.stringify({ ...req.body, PatientId: PatientId ? '***' : null }, null, 2));
    console.log('EmergencyBedId:', emergencyBedIdInt);
    console.log('PatientId:', PatientId);
    
    // Check bed status
    const bedCheck = await db.query(`
      SELECT "EmergencyBedId", "EmergencyBedNo", "Status"
      FROM "EmergencyBed"
      WHERE "EmergencyBedId" = $1
    `, [emergencyBedIdInt]);
    
    console.log('Bed Check Result:', JSON.stringify(bedCheck.rows, null, 2));
    
    if (bedCheck.rows.length === 0) {
      console.log('⚠ ERROR: Bed not found');
      return res.status(404).json({
        success: false,
        message: `Emergency bed with ID ${emergencyBedIdInt} not found`,
      });
    }
    
    const currentBedStatus = bedCheck.rows[0].Status || bedCheck.rows[0].status;
    const bedNo = bedCheck.rows[0].EmergencyBedNo || bedCheck.rows[0].emergencybedno;
    console.log('Current Bed Status:', currentBedStatus);
    console.log('Bed Number:', bedNo);
    
    // Check if bed is occupied by status
    if (currentBedStatus === 'Occupied') {
      console.log('⚠ Checking for current admission on this bed...');
      // Get current patient info if available
      const currentAdmission = await db.query(`
        SELECT 
          ea."EmergencyAdmissionId",
          ea."PatientId",
          p."PatientNo",
          p."PatientName",
          ea."EmergencyStatus",
          ea."Status" AS "AdmissionStatus"
        FROM "EmergencyAdmission" ea
        LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
        WHERE ea."EmergencyBedId" = $1
          AND ea."Status" = 'Active'
          AND ea."EmergencyStatus" = 'Admitted'
          AND (ea."TransferTo" IS NULL OR ea."TransferTo" = '')
        ORDER BY ea."AdmissionCreatedAt" DESC
        LIMIT 1
      `, [emergencyBedIdInt]);
      
      console.log('Current Admission Check:', JSON.stringify(currentAdmission.rows, null, 2));
      
      const currentPatientInfo = currentAdmission.rows.length > 0 
        ? `Currently occupied by Patient ${currentAdmission.rows[0].PatientNo || 'Unknown'} (${currentAdmission.rows[0].PatientName || 'Unknown'})`
        : 'Bed status is marked as Occupied';
      
      console.log('⚠ BLOCKED: Bed status is "Occupied"');
      console.log('=== END DEBUG ===\n');
      
      return res.status(400).json({
        success: false,
        message: `Cannot create emergency admission. Emergency bed ${bedNo} (ID: ${emergencyBedIdInt}) is already occupied. ${currentPatientInfo}. Please select a different bed or discharge/transfer the current patient first.`,
        error: 'Bed is occupied',
        debug: {
          bedId: emergencyBedIdInt,
          bedNo: bedNo,
          bedStatus: currentBedStatus,
          currentAdmission: currentAdmission.rows[0] || null
        }
      });
    }
    
    // Check if there's an active admission using this bed
    const occupiedCheck = await db.query(`
      SELECT 
        ea."EmergencyAdmissionId",
        ea."PatientId",
        p."PatientNo",
        p."PatientName",
        ea."EmergencyStatus",
        ea."Status" AS "AdmissionStatus",
        ea."TransferTo"
      FROM "EmergencyAdmission" ea
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      WHERE ea."EmergencyBedId" = $1
        AND ea."Status" = 'Active'
        AND ea."EmergencyStatus" = 'Admitted'
        AND (ea."TransferTo" IS NULL OR ea."TransferTo" = '')
      LIMIT 1
    `, [emergencyBedIdInt]);
    
    console.log('Active Admission Check:', JSON.stringify(occupiedCheck.rows, null, 2));
    
    if (occupiedCheck.rows.length > 0) {
      const currentPatient = occupiedCheck.rows[0];
      console.log('⚠ BLOCKED: Active admission found for this bed');
      console.log('=== END DEBUG ===\n');
      
      return res.status(400).json({
        success: false,
        message: `Cannot create emergency admission. Emergency bed ${bedNo} (ID: ${emergencyBedIdInt}) is already occupied by Patient ${currentPatient.PatientNo || 'Unknown'} (${currentPatient.PatientName || 'Unknown'}). Please select a different bed or discharge/transfer the current patient first.`,
        error: 'Bed is occupied',
        debug: {
          bedId: emergencyBedIdInt,
          bedNo: bedNo,
          currentAdmission: currentPatient
        }
      });
    }

    console.log('✓ Bed is available, proceeding with admission creation...\n');

    // EmergencyAdmissionId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "EmergencyAdmission"
        ("DoctorId", "PatientId", "EmergencyBedId", "EmergencyAdmissionDate",
         "EmergencyStatus", "Priority", "AllocationFromDate", "AllocationToDate", "NumberOfDays", "Diagnosis",
         "TreatementDetails", "PatientCondition", "TransferToIPD", "TransferToOT", "TransferToICU",
         "TransferTo", "TransferDetails", "AdmissionCreatedBy", "Status")
      VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      parseInt(DoctorId, 10),
      PatientId, // UUID, not parsed as integer
      parseInt(EmergencyBedId, 10),
      EmergencyAdmissionDate,
      EmergencyStatus || null,
      Priority || null,
      AllocationFromDate || null,
      AllocationToDate || null,
      NumberOfDays ? parseInt(NumberOfDays, 10) : null,
      Diagnosis || null,
      TreatementDetails || null,
      PatientCondition || null,
      TransferToIPD || 'No',
      TransferToOT || 'No',
      TransferToICU || 'No',
      TransferTo || null,
      TransferDetails || null,
      AdmissionCreatedBy ? parseInt(AdmissionCreatedBy, 10) : null,
      Status,
    ]);

    // Mark the EmergencyBed as 'Occupied' when a patient is admitted
    // Only mark as occupied if EmergencyStatus is 'Admitted' (not if already transferred/discharged)
    const bedStatus = (EmergencyStatus === 'Admitted' && (!TransferTo || TransferTo === '')) 
      ? 'Occupied' 
      : 'Unoccupied';
    
    try {
      // Get patient number for logging
      let patientNo = null;
      if (bedStatus === 'Occupied') {
        const patientQuery = await db.query(
          'SELECT "PatientNo" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid',
          [PatientId]
        );
        if (patientQuery.rows.length > 0) {
          patientNo = patientQuery.rows[0].PatientNo || patientQuery.rows[0].patientno;
        }
      }
      
      await db.query(
        'UPDATE "EmergencyBed" SET "Status" = $1 WHERE "EmergencyBedId" = $2',
        [bedStatus, parseInt(EmergencyBedId, 10)]
      );
      
      if (bedStatus === 'Occupied' && patientNo) {
        console.log(`✓ Marked EmergencyBed ${EmergencyBedId} as ${bedStatus} (Patient: ${patientNo})`);
      } else {
        console.log(`✓ Marked EmergencyBed ${EmergencyBedId} as ${bedStatus}`);
      }
    } catch (bedUpdateError) {
      // Log error but don't fail the admission creation
      console.warn(`⚠ Could not update EmergencyBed status: ${bedUpdateError.message}`);
    }

    console.log('=== END DEBUG ===\n');

    res.status(201).json({
      success: true,
      message: 'Emergency admission created successfully',
      data: mapEmergencyAdmissionRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid DoctorId, PatientId, or EmergencyBedId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating emergency admission',
      error: error.message,
    });
  }
};

exports.updateEmergencyAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateEmergencyAdmissionPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      DoctorId,
      PatientId,
      EmergencyBedId,
      EmergencyAdmissionDate,
      EmergencyStatus,
      Priority,
      AllocationFromDate,
      AllocationToDate,
      NumberOfDays,
      Diagnosis,
      TreatementDetails,
      PatientCondition,
      TransferToIPD,
      TransferToOT,
      TransferToICU,
      TransferTo,
      TransferDetails,
      AdmissionCreatedBy,
      Status,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (DoctorId !== undefined) {
      updates.push(`"DoctorId" = $${paramIndex++}`);
      params.push(DoctorId !== null ? parseInt(DoctorId, 10) : null);
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}::uuid`);
      params.push(PatientId !== null ? PatientId : null);
    }
    if (EmergencyBedId !== undefined) {
      updates.push(`"EmergencyBedId" = $${paramIndex++}`);
      params.push(EmergencyBedId !== null ? parseInt(EmergencyBedId, 10) : null);
    }
    if (EmergencyAdmissionDate !== undefined) {
      updates.push(`"EmergencyAdmissionDate" = $${paramIndex++}`);
      params.push(EmergencyAdmissionDate);
    }
    if (EmergencyStatus !== undefined) {
      updates.push(`"EmergencyStatus" = $${paramIndex++}`);
      params.push(EmergencyStatus);
    }
    if (Priority !== undefined) {
      updates.push(`"Priority" = $${paramIndex++}`);
      params.push(Priority);
    }
    if (AllocationFromDate !== undefined) {
      updates.push(`"AllocationFromDate" = $${paramIndex++}`);
      params.push(AllocationFromDate);
    }
    if (AllocationToDate !== undefined) {
      updates.push(`"AllocationToDate" = $${paramIndex++}`);
      params.push(AllocationToDate);
    }
    if (NumberOfDays !== undefined) {
      updates.push(`"NumberOfDays" = $${paramIndex++}`);
      params.push(NumberOfDays !== null ? parseInt(NumberOfDays, 10) : null);
    }
    if (Diagnosis !== undefined) {
      updates.push(`"Diagnosis" = $${paramIndex++}`);
      params.push(Diagnosis);
    }
    if (TreatementDetails !== undefined) {
      updates.push(`"TreatementDetails" = $${paramIndex++}`);
      params.push(TreatementDetails);
    }
    if (PatientCondition !== undefined) {
      updates.push(`"PatientCondition" = $${paramIndex++}`);
      params.push(PatientCondition);
    }
    if (TransferToIPD !== undefined) {
      updates.push(`"TransferToIPD" = $${paramIndex++}`);
      params.push(TransferToIPD);
    }
    if (TransferToOT !== undefined) {
      updates.push(`"TransferToOT" = $${paramIndex++}`);
      params.push(TransferToOT);
    }
    if (TransferToICU !== undefined) {
      updates.push(`"TransferToICU" = $${paramIndex++}`);
      params.push(TransferToICU);
    }
    if (TransferTo !== undefined) {
      updates.push(`"TransferTo" = $${paramIndex++}`);
      params.push(TransferTo);
    }
    if (TransferDetails !== undefined) {
      updates.push(`"TransferDetails" = $${paramIndex++}`);
      params.push(TransferDetails);
    }
    if (AdmissionCreatedBy !== undefined) {
      updates.push(`"AdmissionCreatedBy" = $${paramIndex++}`);
      params.push(AdmissionCreatedBy !== null ? parseInt(AdmissionCreatedBy, 10) : null);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Validate that id is an integer
    const emergencyAdmissionId = parseInt(id, 10);
    if (isNaN(emergencyAdmissionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyAdmissionId. Must be an integer.' 
      });
    }
    
    // Get the current EmergencyBedId before updating (in case it's not being updated in this request)
    const currentAdmissionQuery = await db.query(
      'SELECT "EmergencyBedId", "EmergencyStatus", "TransferTo" FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1',
      [emergencyAdmissionId]
    );
    
    if (currentAdmissionQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission not found' });
    }
    
    const currentBedId = currentAdmissionQuery.rows[0].EmergencyBedId || currentAdmissionQuery.rows[0].emergencybedid;
    const previousBedId = currentBedId ? parseInt(currentBedId, 10) : null;
    
    // Determine which EmergencyBedId to use (updated value or current value)
    const bedIdToUpdate = EmergencyBedId !== undefined 
      ? (EmergencyBedId !== null ? parseInt(EmergencyBedId, 10) : null)
      : previousBedId;
    
    // Check if bed is being changed
    const bedChanged = EmergencyBedId !== undefined && 
                       EmergencyBedId !== null && 
                       previousBedId !== null && 
                       parseInt(EmergencyBedId, 10) !== previousBedId;
    
    // DEBUG: Log PUT request details
    console.log('\n=== DEBUG: EmergencyAdmission UPDATE Request ===');
    console.log('PUT /api/emergency-admissions/' + emergencyAdmissionId);
    console.log('Request Body:', JSON.stringify({ ...req.body, PatientId: PatientId ? '***' : null }, null, 2));
    console.log('Previous BedId:', previousBedId);
    console.log('New BedId:', EmergencyBedId !== undefined ? (EmergencyBedId !== null ? parseInt(EmergencyBedId, 10) : null) : 'Not changed');
    console.log('Bed Changed:', bedChanged);
    
    // If bed is being changed, check if the new bed is available
    if (bedChanged && EmergencyBedId !== null) {
      const newBedId = parseInt(EmergencyBedId, 10);
      
      // Check new bed status
      const newBedCheck = await db.query(`
        SELECT "EmergencyBedId", "EmergencyBedNo", "Status"
        FROM "EmergencyBed"
        WHERE "EmergencyBedId" = $1
      `, [newBedId]);
      
      console.log('New Bed Check Result:', JSON.stringify(newBedCheck.rows, null, 2));
      
      if (newBedCheck.rows.length === 0) {
        console.log('⚠ ERROR: New bed not found');
        console.log('=== END DEBUG ===\n');
        return res.status(404).json({
          success: false,
          message: `Emergency bed with ID ${newBedId} not found`,
        });
      }
      
      const newBedStatus = newBedCheck.rows[0].Status || newBedCheck.rows[0].status;
      const newBedNo = newBedCheck.rows[0].EmergencyBedNo || newBedCheck.rows[0].emergencybedno;
      console.log('New Bed Status:', newBedStatus);
      console.log('New Bed Number:', newBedNo);
      
      // Check if new bed is occupied by status
      if (newBedStatus === 'Occupied') {
        console.log('⚠ Checking for current admission on new bed...');
        // Get current patient info if available
        const currentAdmissionOnNewBed = await db.query(`
          SELECT 
            ea."EmergencyAdmissionId",
            ea."PatientId",
            p."PatientNo",
            p."PatientName",
            ea."EmergencyStatus",
            ea."Status" AS "AdmissionStatus"
          FROM "EmergencyAdmission" ea
          LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
          WHERE ea."EmergencyBedId" = $1
            AND ea."Status" = 'Active'
            AND ea."EmergencyStatus" = 'Admitted'
            AND (ea."TransferTo" IS NULL OR ea."TransferTo" = '')
            AND ea."EmergencyAdmissionId" != $2
          ORDER BY ea."AdmissionCreatedAt" DESC
          LIMIT 1
        `, [newBedId, emergencyAdmissionId]);
        
        console.log('Current Admission on New Bed:', JSON.stringify(currentAdmissionOnNewBed.rows, null, 2));
        
        const currentPatientInfo = currentAdmissionOnNewBed.rows.length > 0 
          ? `Currently occupied by Patient ${currentAdmissionOnNewBed.rows[0].PatientNo || 'Unknown'} (${currentAdmissionOnNewBed.rows[0].PatientName || 'Unknown'})`
          : 'Bed status is marked as Occupied';
        
        console.log('⚠ BLOCKED: New bed status is "Occupied"');
        console.log('=== END DEBUG ===\n');
        
        return res.status(400).json({
          success: false,
          message: `Cannot update emergency admission. The new emergency bed ${newBedNo} (ID: ${newBedId}) is already occupied. ${currentPatientInfo}. Please select a different bed or discharge/transfer the current patient first.`,
          error: 'Bed is occupied',
          debug: {
            bedId: newBedId,
            bedNo: newBedNo,
            bedStatus: newBedStatus,
            currentAdmission: currentAdmissionOnNewBed.rows[0] || null
          }
        });
      }
      
      // Check if there's an active admission using the new bed (excluding current admission)
      const occupiedCheckOnNewBed = await db.query(`
        SELECT 
          ea."EmergencyAdmissionId",
          ea."PatientId",
          p."PatientNo",
          p."PatientName",
          ea."EmergencyStatus",
          ea."Status" AS "AdmissionStatus",
          ea."TransferTo"
        FROM "EmergencyAdmission" ea
        LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
        WHERE ea."EmergencyBedId" = $1
          AND ea."Status" = 'Active'
          AND ea."EmergencyStatus" = 'Admitted'
          AND (ea."TransferTo" IS NULL OR ea."TransferTo" = '')
          AND ea."EmergencyAdmissionId" != $2
        LIMIT 1
      `, [newBedId, emergencyAdmissionId]);
      
      console.log('Active Admission Check on New Bed:', JSON.stringify(occupiedCheckOnNewBed.rows, null, 2));
      
      if (occupiedCheckOnNewBed.rows.length > 0) {
        const currentPatient = occupiedCheckOnNewBed.rows[0];
        console.log('⚠ BLOCKED: Active admission found on new bed');
        console.log('=== END DEBUG ===\n');
        
        return res.status(400).json({
          success: false,
          message: `Cannot update emergency admission. The new emergency bed ${newBedNo} (ID: ${newBedId}) is already occupied by Patient ${currentPatient.PatientNo || 'Unknown'} (${currentPatient.PatientName || 'Unknown'}). Please select a different bed or discharge/transfer the current patient first.`,
          error: 'Bed is occupied',
          debug: {
            bedId: newBedId,
            bedNo: newBedNo,
            currentAdmission: currentPatient
          }
        });
      }
      
      console.log('✓ New bed is available, proceeding with update...');
    }
    
    // Also check if the bed (current or unchanged) is already occupied by another admission
    // This handles the case where bed is not being changed but we're trying to admit a patient to an already occupied bed
    const bedIdToCheck = bedIdToUpdate; // This is the bed we'll be using (new or current)
    const currentEmergencyStatus = currentAdmissionQuery.rows[0].EmergencyStatus || currentAdmissionQuery.rows[0].emergencystatus;
    const finalEmergencyStatusForCheck = EmergencyStatus !== undefined ? EmergencyStatus : currentEmergencyStatus;
    
    // Check if we're setting/keeping status as 'Admitted' - if so, verify bed isn't occupied by another admission
    const willBeAdmitted = finalEmergencyStatusForCheck === 'Admitted';
    
    if (bedIdToCheck !== null && bedIdToCheck !== undefined && willBeAdmitted) {
      console.log('Checking if bed is occupied by another admission (bed not changed or status being set to Admitted)...');
      const occupiedByOtherCheck = await db.query(`
        SELECT 
          ea."EmergencyAdmissionId",
          ea."PatientId",
          p."PatientNo",
          p."PatientName",
          ea."EmergencyStatus",
          ea."Status" AS "AdmissionStatus",
          ea."TransferTo"
        FROM "EmergencyAdmission" ea
        LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
        WHERE ea."EmergencyBedId" = $1
          AND ea."Status" = 'Active'
          AND ea."EmergencyStatus" = 'Admitted'
          AND (ea."TransferTo" IS NULL OR ea."TransferTo" = '')
          AND ea."EmergencyAdmissionId" != $2
        LIMIT 1
      `, [bedIdToCheck, emergencyAdmissionId]);
      
      console.log('Occupied by Other Admission Check:', JSON.stringify(occupiedByOtherCheck.rows, null, 2));
      
      if (occupiedByOtherCheck.rows.length > 0) {
        const otherPatient = occupiedByOtherCheck.rows[0];
        const bedInfo = await db.query(
          'SELECT "EmergencyBedNo" FROM "EmergencyBed" WHERE "EmergencyBedId" = $1',
          [bedIdToCheck]
        );
        const bedNo = bedInfo.rows.length > 0 
          ? (bedInfo.rows[0].EmergencyBedNo || bedInfo.rows[0].emergencybedno)
          : `ID ${bedIdToCheck}`;
        
        console.log('⚠ BLOCKED: Bed is already occupied by another admission');
        console.log('=== END DEBUG ===\n');
        
        return res.status(400).json({
          success: false,
          message: `Cannot update emergency admission. Emergency bed ${bedNo} (ID: ${bedIdToCheck}) is already occupied by Patient ${otherPatient.PatientNo || 'Unknown'} (${otherPatient.PatientName || 'Unknown'}). Please select a different bed or discharge/transfer the current patient first.`,
          error: 'Bed is occupied',
          debug: {
            bedId: bedIdToCheck,
            bedNo: bedNo,
            currentAdmission: otherPatient
          }
        });
      }
    }
    
    params.push(emergencyAdmissionId);
    const updateQuery = `
      UPDATE "EmergencyAdmission"
      SET ${updates.join(', ')}
      WHERE "EmergencyAdmissionId" = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission not found' });
    }

    const updatedAdmission = rows[0];
    
    // Check if we need to mark the EmergencyBed as unoccupied
    // Conditions: EmergencyStatus is "Discharged", "ICU", "IPD", or "OT" (patient has left ER) OR TransferTo is not null
    const finalEmergencyStatus = EmergencyStatus !== undefined ? EmergencyStatus : (updatedAdmission.EmergencyStatus || updatedAdmission.emergencystatus);
    const finalTransferTo = TransferTo !== undefined ? TransferTo : (updatedAdmission.TransferTo || updatedAdmission.transferto);
    
    // Statuses that indicate patient has left the emergency bed
    const transferStatuses = ['Discharged', 'ICU', 'IPD', 'OT'];
    const hasLeftEmergencyBed = transferStatuses.includes(finalEmergencyStatus);
    
    const shouldMarkBedUnoccupied = 
      hasLeftEmergencyBed || 
      (finalTransferTo !== null && finalTransferTo !== undefined && finalTransferTo !== '');
    
    // Handle bed status updates
    try {
      // If bed was changed, mark old bed as Unoccupied
      if (bedChanged && previousBedId !== null) {
        await db.query(
          'UPDATE "EmergencyBed" SET "Status" = $1 WHERE "EmergencyBedId" = $2',
          ['Unoccupied', previousBedId]
        );
        console.log(`✓ Marked previous EmergencyBed ${previousBedId} as Unoccupied (bed changed)`);
      }
      
      // Mark current/updated bed based on patient status
      if (bedIdToUpdate !== null && bedIdToUpdate !== undefined) {
        if (shouldMarkBedUnoccupied) {
          // Patient has left the emergency bed
          await db.query(
            'UPDATE "EmergencyBed" SET "Status" = $1 WHERE "EmergencyBedId" = $2',
            ['Unoccupied', bedIdToUpdate]
          );
          const reason = hasLeftEmergencyBed 
            ? `EmergencyStatus is "${finalEmergencyStatus}"` 
            : `TransferTo is set to "${finalTransferTo}"`;
          console.log(`✓ Marked EmergencyBed ${bedIdToUpdate} as Unoccupied - Reason: ${reason}`);
        } else if (finalEmergencyStatus === 'Admitted' && (!finalTransferTo || finalTransferTo === '')) {
          // Patient is admitted and not transferred - mark bed as Occupied
          // Get patient number for logging
          let patientNo = null;
          const patientId = updatedAdmission.PatientId || updatedAdmission.patientid;
          if (patientId) {
            const patientQuery = await db.query(
              'SELECT "PatientNo" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid',
              [patientId]
            );
            if (patientQuery.rows.length > 0) {
              patientNo = patientQuery.rows[0].PatientNo || patientQuery.rows[0].patientno;
            }
          }
          
          await db.query(
            'UPDATE "EmergencyBed" SET "Status" = $1 WHERE "EmergencyBedId" = $2',
            ['Occupied', bedIdToUpdate]
          );
          
          if (patientNo) {
            console.log(`✓ Marked EmergencyBed ${bedIdToUpdate} as Occupied (Patient: ${patientNo})`);
          } else {
            console.log(`✓ Marked EmergencyBed ${bedIdToUpdate} as Occupied (patient admitted)`);
          }
        }
      }
    } catch (bedUpdateError) {
      // Log error but don't fail the admission update
      console.warn(`⚠ Could not update EmergencyBed status: ${bedUpdateError.message}`);
    }

    console.log('=== END DEBUG ===\n');

    res.status(200).json({
      success: true,
      message: 'Emergency admission updated successfully',
      data: mapEmergencyAdmissionRow(updatedAdmission),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid DoctorId, PatientId, or EmergencyBedId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating emergency admission',
      error: error.message,
    });
  }
};

exports.deleteEmergencyAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is an integer
    const emergencyAdmissionId = parseInt(id, 10);
    if (isNaN(emergencyAdmissionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyAdmissionId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1 RETURNING *',
      [emergencyAdmissionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency admission deleted successfully',
      data: mapEmergencyAdmissionRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting emergency admission',
      error: error.message,
    });
  }
};

