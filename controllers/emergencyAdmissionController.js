const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];
const allowedEmergencyStatus = ['Admitted', 'IPD', 'OT', 'ICU', 'Discharged'];
const allowedPatientCondition = ['Critical', 'Stable'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapEmergencyAdmissionRow = (row) => ({
  EmergencyAdmissionId: row.EmergencyAdmissionId || row.emergencyadmissionid,
  DoctorId: row.DoctorId || row.doctorid,
  PatientId: row.PatientId || row.patientid,
  EmergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid,
  EmergencyAdmissionDate: row.EmergencyAdmissionDate || row.emergencyadmissiondate,
  EmergencyStatus: row.EmergencyStatus || row.emergencystatus,
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
  EBedSlotNo: row.EBedSlotNo || row.ebedslotno || null,
  EmergencyBedNo: row.EmergencyBedNo || row.emergencybedno || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
  EmergencyAdmissionId_EmergencyAdmissionDate: row.EmergencyAdmissionId_EmergencyAdmissionDate || row.emergencyadmissionid_emergencyadmissiondate || null,
  EmergencyBedId_emergency_BedSlotId_AllocationFromDate: row.EmergencyBedId_emergency_BedSlotId_AllocationFromDate || row.emergencybedid_emergency_bedslotid_allocationfromdate || null,
});

exports.getAllEmergencyAdmissions = async (req, res) => {
  try {
    const { status, emergencyStatus, patientId, doctorId, emergencyBedSlotId } = req.query;
    let query = 'SELECT * FROM "EmergencyAdmission"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (emergencyStatus) {
      conditions.push(`"EmergencyStatus" = $${params.length + 1}`);
      params.push(emergencyStatus);
    }
    if (patientId) {
      if (uuidRegex.test(patientId)) {
        conditions.push(`"PatientId" = $${params.length + 1}::uuid`);
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
        conditions.push(`"DoctorId" = $${params.length + 1}`);
        params.push(doctorIdInt);
      }
    }
    if (emergencyBedSlotId) {
      const emergencyBedSlotIdInt = parseInt(emergencyBedSlotId, 10);
      if (!isNaN(emergencyBedSlotIdInt)) {
        conditions.push(`"EmergencyBedSlotId" = $${params.length + 1}`);
        params.push(emergencyBedSlotIdInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "EmergencyAdmissionDate" DESC, "AdmissionCreatedAt" DESC';

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
      'SELECT * FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1',
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
      SELECT DISTINCT ea.*
      FROM "EmergencyAdmission" ea
      INNER JOIN "PatientOTAllocation" pota ON ea."PatientId" = pota."PatientId"
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
      SELECT * FROM "EmergencyAdmission"
      WHERE "EmergencyStatus" = $1
      ORDER BY "EmergencyAdmissionDate" DESC, "AdmissionCreatedAt" DESC
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
        ebs."EBedSlotNo",
        e."EmergencyBedNo",
        u."UserName" AS "CreatedByName",
        CONCAT(ebs."EBedSlotNo", '_', ea."EmergencyAdmissionDate"::text) AS "EmergencyAdmissionId_EmergencyAdmissionDate",
        CONCAT(COALESCE(e."EmergencyBedId"::text, ''), '_', COALESCE(ea."EmergencyBedSlotId"::text, ''), '_', COALESCE(ea."AllocationFromDate"::text, '')) AS "EmergencyBedId_emergency_BedSlotId_AllocationFromDate"
      FROM "EmergencyAdmission" ea
      LEFT JOIN "PatientRegistration" p ON ea."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ea."DoctorId" = d."UserId"
      LEFT JOIN "EmergencyBedSlot" ebs ON ea."EmergencyBedSlotId" = ebs."EmergencyBedSlotId"
      LEFT JOIN "EmergencyBed" e ON ebs."EmergencyBedId" = e."EmergencyBedId"
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

  if (requireAll && body.EmergencyBedSlotId === undefined) {
    errors.push('EmergencyBedSlotId is required');
  }
  if (body.EmergencyBedSlotId !== undefined && body.EmergencyBedSlotId !== null) {
    const emergencyBedSlotIdInt = parseInt(body.EmergencyBedSlotId, 10);
    if (isNaN(emergencyBedSlotIdInt)) {
      errors.push('EmergencyBedSlotId must be a valid integer');
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
      EmergencyBedSlotId,
      EmergencyAdmissionDate,
      EmergencyStatus,
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

    // EmergencyAdmissionId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "EmergencyAdmission"
        ("DoctorId", "PatientId", "EmergencyBedSlotId", "EmergencyAdmissionDate",
         "EmergencyStatus", "AllocationFromDate", "AllocationToDate", "NumberOfDays", "Diagnosis",
         "TreatementDetails", "PatientCondition", "TransferToIPD", "TransferToOT", "TransferToICU",
         "TransferTo", "TransferDetails", "AdmissionCreatedBy", "Status")
      VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      parseInt(DoctorId, 10),
      PatientId, // UUID, not parsed as integer
      parseInt(EmergencyBedSlotId, 10),
      EmergencyAdmissionDate,
      EmergencyStatus || null,
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
        message: 'Invalid DoctorId, PatientId, or EmergencyBedSlotId. Please ensure they exist.',
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
      EmergencyBedSlotId,
      EmergencyAdmissionDate,
      EmergencyStatus,
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
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null);
    }
    if (EmergencyBedSlotId !== undefined) {
      updates.push(`"EmergencyBedSlotId" = $${paramIndex++}`);
      params.push(EmergencyBedSlotId !== null ? parseInt(EmergencyBedSlotId, 10) : null);
    }
    if (EmergencyAdmissionDate !== undefined) {
      updates.push(`"EmergencyAdmissionDate" = $${paramIndex++}`);
      params.push(EmergencyAdmissionDate);
    }
    if (EmergencyStatus !== undefined) {
      updates.push(`"EmergencyStatus" = $${paramIndex++}`);
      params.push(EmergencyStatus);
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

    res.status(200).json({
      success: true,
      message: 'Emergency admission updated successfully',
      data: mapEmergencyAdmissionRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid DoctorId, PatientId, or EmergencyBedSlotId. Please ensure they exist.',
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

