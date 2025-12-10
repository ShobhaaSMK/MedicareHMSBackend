const db = require('../db');
const { randomUUID } = require('crypto');

const allowedICUPatientStatus = ['Serious', 'Available', 'Critical', 'Stable'];
const allowedICUAdmissionStatus = ['Occupied', 'Discharged'];
const allowedStatus = ['Active', 'Inactive'];
const allowedYesNo = ['Yes', 'No'];

const mapPatientICUAdmissionRow = (row) => ({
  PatientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid,
  PatientId: row.PatientId || row.patientid,
  PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
  EmergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
  ICUId: row.ICUId || row.icuid,
  ICUPatientStatus: row.ICUPatientStatus || row.icupatientstatus,
  ICUAdmissionStatus: row.ICUAdmissionStatus || row.icuadmissionstatus || 'Occupied',
  ICUAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate,
  ICUAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate,
  NumberOfDays: row.NumberOfDays || row.numberofdays,
  Diagnosis: row.Diagnosis || row.diagnosis,
  TreatementDetails: row.TreatementDetails || row.treatementdetails,
  PatientCondition: row.PatientCondition || row.patientcondition,
  ICUAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby,
  ICUAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat,
  Status: row.Status || row.status,
  OnVentilator: row.OnVentilator || row.onventilator || 'No',
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  ICUNo: row.ICUNo || row.icuno || null,
  AppointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
  BedNo: row.BedNo || row.bedno || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
});

exports.getAllPatientICUAdmissions = async (req, res) => {
  try {
    const { status, icuPatientStatus, patientId, icuId, patientAppointmentId } = req.query;
    let query = `
      SELECT 
        pica.*,
        p."PatientName", p."PatientNo",
        icu."ICUBedNo" AS "ICUNo",
        pa."TokenNo" AS "AppointmentTokenNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientICUAdmission" pica
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`pica."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (icuPatientStatus) {
      conditions.push(`pica."ICUPatientStatus" = $${params.length + 1}`);
      params.push(icuPatientStatus);
    }
    if (patientId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(patientId)) {
        conditions.push(`pica."PatientId" = $${params.length + 1}::uuid`);
        params.push(patientId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid patientId. Must be a valid UUID.',
        });
      }
    }
    if (icuId) {
      const icuIdInt = parseInt(icuId, 10);
      if (!isNaN(icuIdInt)) {
        conditions.push(`pica."ICUId" = $${params.length + 1}`);
        params.push(icuIdInt);
      }
    }
    if (patientAppointmentId) {
      const appointmentIdInt = parseInt(patientAppointmentId, 10);
      if (!isNaN(appointmentIdInt)) {
        conditions.push(`pica."PatientAppointmentId" = $${params.length + 1}`);
        params.push(appointmentIdInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY pica."ICUAllocationFromDate" DESC, pica."ICUAllocationCreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientICUAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient ICU admissions',
      error: error.message,
    });
  }
};

exports.getPatientICUAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        pica.*,
        p."PatientName", p."PatientNo",
        icu."ICUBedNo" AS "ICUNo",
        pa."TokenNo" AS "AppointmentTokenNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientICUAdmission" pica
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      WHERE pica."PatientICUAdmissionId" = $1::uuid
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient ICU admission not found' });
    }
    res.status(200).json({ success: true, data: mapPatientICUAdmissionRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient ICU admission',
      error: error.message,
    });
  }
};

const validatePatientICUAdmissionPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && body.PatientId === undefined) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.PatientId)) {
      errors.push('PatientId must be a valid UUID');
    }
  }


  if (body.PatientAppointmentId !== undefined && body.PatientAppointmentId !== null) {
    const appointmentIdInt = parseInt(body.PatientAppointmentId, 10);
    if (isNaN(appointmentIdInt)) {
      errors.push('PatientAppointmentId must be a valid integer');
    }
  }

  if (body.EmergencyBedSlotId !== undefined && body.EmergencyBedSlotId !== null) {
    const emergencyBedSlotIdInt = parseInt(body.EmergencyBedSlotId, 10);
    if (isNaN(emergencyBedSlotIdInt)) {
      errors.push('EmergencyBedSlotId must be a valid integer');
    }
  }

  if (body.RoomAdmissionId !== undefined && body.RoomAdmissionId !== null) {
    const roomAdmissionIdInt = parseInt(body.RoomAdmissionId, 10);
    if (isNaN(roomAdmissionIdInt)) {
      errors.push('RoomAdmissionId must be a valid integer');
    }
  }

  if (requireAll && body.ICUId === undefined) {
    errors.push('ICUId is required');
  }
  if (body.ICUId !== undefined && body.ICUId !== null) {
    const icuIdInt = parseInt(body.ICUId, 10);
    if (isNaN(icuIdInt)) {
      errors.push('ICUId must be a valid integer');
    }
  }

  if (body.ICUPatientStatus && !allowedICUPatientStatus.includes(body.ICUPatientStatus)) {
    errors.push('ICUPatientStatus must be Serious, Available, Critical, or Stable');
  }

  if (body.ICUAdmissionStatus && !allowedICUAdmissionStatus.includes(body.ICUAdmissionStatus)) {
    errors.push('ICUAdmissionStatus must be Occupied or Discharged');
  }

  if (body.ICUAllocationFromDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.ICUAllocationFromDate)) {
    errors.push('ICUAllocationFromDate must be in YYYY-MM-DD format');
  }

  if (body.ICUAllocationToDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.ICUAllocationToDate)) {
    errors.push('ICUAllocationToDate must be in YYYY-MM-DD format');
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

  if (body.PatientCondition !== undefined && body.PatientCondition !== null && typeof body.PatientCondition !== 'string') {
    errors.push('PatientCondition must be a string');
  }

  if (body.ICUAllocationCreatedBy !== undefined && body.ICUAllocationCreatedBy !== null) {
    const createdByInt = parseInt(body.ICUAllocationCreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('ICUAllocationCreatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.OnVentilator !== undefined && body.OnVentilator !== null && !allowedYesNo.includes(body.OnVentilator)) {
    errors.push('OnVentilator must be Yes or No');
  }

  return errors;
};

exports.createPatientICUAdmission = async (req, res) => {
  try {
    const errors = validatePatientICUAdmissionPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientId,
      PatientAppointmentId,
      EmergencyBedSlotId,
      RoomAdmissionId,
      ICUId,
      ICUPatientStatus,
      ICUAdmissionStatus = 'Occupied',
      ICUAllocationFromDate,
      ICUAllocationToDate,
      NumberOfDays,
      Diagnosis,
      TreatementDetails,
      PatientCondition,
      ICUAllocationCreatedBy,
      Status = 'Active',
      OnVentilator = 'No',
    } = req.body;

    // Generate random UUID for PatientICUAdmissionId
    const patientICUAdmissionId = randomUUID();

    if (!patientICUAdmissionId || typeof patientICUAdmissionId !== 'string') {
      throw new Error('Failed to generate PatientICUAdmissionId');
    }

    // Validate foreign key existence
    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }


    if (PatientAppointmentId !== undefined && PatientAppointmentId !== null) {
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [parseInt(PatientAppointmentId, 10)]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientAppointmentId does not exist' });
      }
    }

    if (EmergencyBedSlotId !== undefined && EmergencyBedSlotId !== null) {
      const emergencyBedSlotExists = await db.query('SELECT "EmergencyBedSlotId" FROM "EmergencyBedSlot" WHERE "EmergencyBedSlotId" = $1', [parseInt(EmergencyBedSlotId, 10)]);
      if (emergencyBedSlotExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyBedSlotId does not exist' });
      }
    }

    if (RoomAdmissionId !== undefined && RoomAdmissionId !== null) {
      const roomAdmissionExists = await db.query('SELECT "RoomAdmissionId" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1', [parseInt(RoomAdmissionId, 10)]);
      if (roomAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'RoomAdmissionId does not exist' });
      }
    }

    const icuExists = await db.query('SELECT "ICUId" FROM "ICU" WHERE "ICUId" = $1', [parseInt(ICUId, 10)]);
    if (icuExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'ICUId does not exist' });
    }

    let createdByValue = null;
    if (ICUAllocationCreatedBy !== undefined && ICUAllocationCreatedBy !== null && ICUAllocationCreatedBy !== '') {
      const createdByInt = parseInt(ICUAllocationCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'ICUAllocationCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUAllocationCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    }

    // Check if ICU bed is already occupied for the given date range
    // Only check if ICUAdmissionStatus is 'Occupied' and ICUAllocationFromDate is provided
    if (ICUAdmissionStatus === 'Occupied' && ICUAllocationFromDate) {
      // Build the overlap check query
      // An overlap occurs when date ranges intersect:
      // - New admission's date range overlaps with existing occupied admission's date range
      // - Handle NULL ICUAllocationToDate (treat as ongoing/indefinite)
      let overlapCheckQuery = `
        SELECT COUNT(*) AS overlap_count
        FROM "PatientICUAdmission"
        WHERE "ICUId" = $1
        AND "ICUAdmissionStatus" = 'Occupied'
        AND "Status" = 'Active'
        AND "ICUAllocationFromDate" IS NOT NULL
        AND (
      `;

      const overlapParams = [parseInt(ICUId, 10)];
      let overlapConditions = [];

      if (ICUAllocationToDate) {
        // Both from and to dates are provided
        // Check for overlap: existing admission overlaps if:
        // - Existing from <= New to AND (Existing to >= New from OR Existing to is NULL)
        overlapConditions.push(`
          (
            ("ICUAllocationToDate" IS NOT NULL 
             AND "ICUAllocationFromDate" <= $${overlapParams.length + 1}::date
             AND "ICUAllocationToDate" >= $${overlapParams.length + 2}::date)
            OR
            ("ICUAllocationToDate" IS NULL 
             AND "ICUAllocationFromDate" <= $${overlapParams.length + 1}::date)
          )
        `);
        overlapParams.push(ICUAllocationToDate);
        overlapParams.push(ICUAllocationFromDate);
      } else {
        // Only from date is provided (to date is NULL - ongoing admission)
        // Check if any existing admission overlaps with this ongoing admission
        // Existing admission overlaps if:
        // - Existing from <= New from AND (Existing to >= New from OR Existing to is NULL)
        overlapConditions.push(`
          (
            ("ICUAllocationToDate" IS NOT NULL 
             AND "ICUAllocationFromDate" <= $${overlapParams.length + 1}::date
             AND "ICUAllocationToDate" >= $${overlapParams.length + 1}::date)
            OR
            ("ICUAllocationToDate" IS NULL 
             AND "ICUAllocationFromDate" <= $${overlapParams.length + 1}::date)
          )
        `);
        overlapParams.push(ICUAllocationFromDate);
      }

      overlapCheckQuery += overlapConditions.join(' OR ');
      overlapCheckQuery += ')';

      const overlapResult = await db.query(overlapCheckQuery, overlapParams);
      const overlapCount = parseInt(overlapResult.rows[0].overlap_count, 10) || 0;

      if (overlapCount > 0) {
        return res.status(400).json({
          success: false,
          message: `ICU bed is already occupied for the specified date range. There are ${overlapCount} existing occupied admission(s) that overlap with the requested dates.`,
          details: {
            ICUId: parseInt(ICUId, 10),
            ICUAllocationFromDate: ICUAllocationFromDate,
            ICUAllocationToDate: ICUAllocationToDate || 'NULL (ongoing)',
            overlappingAdmissions: overlapCount
          }
        });
      }
    }

    const insertQuery = `
      INSERT INTO "PatientICUAdmission"
        ("PatientICUAdmissionId", "PatientId", "PatientAppointmentId", "EmergencyBedSlotId", "RoomAdmissionId", "ICUId",
         "ICUPatientStatus", "ICUAdmissionStatus", "ICUAllocationFromDate", "ICUAllocationToDate", "NumberOfDays",
         "Diagnosis", "TreatementDetails", "PatientCondition", "ICUAllocationCreatedBy", "Status", "OnVentilator")
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      patientICUAdmissionId,
      PatientId, // UUID, not parsed as integer
      PatientAppointmentId ? parseInt(PatientAppointmentId, 10) : null,
      EmergencyBedSlotId ? parseInt(EmergencyBedSlotId, 10) : null,
      RoomAdmissionId ? parseInt(RoomAdmissionId, 10) : null,
      parseInt(ICUId, 10),
      ICUPatientStatus || null,
      ICUAdmissionStatus || 'Occupied',
      ICUAllocationFromDate || null,
      ICUAllocationToDate || null,
      NumberOfDays ? parseInt(NumberOfDays, 10) : null,
      Diagnosis || null,
      TreatementDetails || null,
      PatientCondition || null,
      createdByValue,
      Status,
      OnVentilator || 'No',
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient ICU admission created successfully',
      data: mapPatientICUAdmissionRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId or ICUId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating patient ICU admission',
      error: error.message,
    });
  }
};

exports.updatePatientICUAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validatePatientICUAdmissionPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientId,
      PatientAppointmentId,
      EmergencyBedSlotId,
      ICUId,
      ICUPatientStatus,
      ICUAdmissionStatus,
      ICUAllocationFromDate,
      ICUAllocationToDate,
      NumberOfDays,
      Diagnosis,
      TreatementDetails,
      PatientCondition,
      ICUAllocationCreatedBy,
      Status,
      OnVentilator,
    } = req.body;

    // Validate foreign key existence if provided
    if (PatientId !== undefined && PatientId !== null) {
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [parseInt(PatientId, 10)]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
      }
    }


    if (PatientAppointmentId !== undefined && PatientAppointmentId !== null) {
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [parseInt(PatientAppointmentId, 10)]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientAppointmentId does not exist' });
      }
    }

    if (EmergencyBedSlotId !== undefined && EmergencyBedSlotId !== null) {
      const emergencyBedSlotExists = await db.query('SELECT "EmergencyBedSlotId" FROM "EmergencyBedSlot" WHERE "EmergencyBedSlotId" = $1', [parseInt(EmergencyBedSlotId, 10)]);
      if (emergencyBedSlotExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyBedSlotId does not exist' });
      }
    }

    if (ICUId !== undefined && ICUId !== null) {
      const icuExists = await db.query('SELECT "ICUId" FROM "ICU" WHERE "ICUId" = $1', [parseInt(ICUId, 10)]);
      if (icuExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUId does not exist' });
      }
    }

    let createdByValue = null;
    if (ICUAllocationCreatedBy !== undefined && ICUAllocationCreatedBy !== null && ICUAllocationCreatedBy !== '') {
      const createdByInt = parseInt(ICUAllocationCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'ICUAllocationCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUAllocationCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    } else if (ICUAllocationCreatedBy === null) {
      createdByValue = null;
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null);
    }
    if (PatientAppointmentId !== undefined) {
      updates.push(`"PatientAppointmentId" = $${paramIndex++}`);
      params.push(PatientAppointmentId !== null ? parseInt(PatientAppointmentId, 10) : null);
    }
    if (EmergencyBedSlotId !== undefined) {
      updates.push(`"EmergencyBedSlotId" = $${paramIndex++}`);
      params.push(EmergencyBedSlotId !== null ? parseInt(EmergencyBedSlotId, 10) : null);
    }
    if (ICUId !== undefined) {
      updates.push(`"ICUId" = $${paramIndex++}`);
      params.push(ICUId !== null ? parseInt(ICUId, 10) : null);
    }
    if (ICUPatientStatus !== undefined) {
      updates.push(`"ICUPatientStatus" = $${paramIndex++}`);
      params.push(ICUPatientStatus);
    }
    if (ICUAdmissionStatus !== undefined) {
      updates.push(`"ICUAdmissionStatus" = $${paramIndex++}`);
      params.push(ICUAdmissionStatus);
    }
    if (ICUAllocationFromDate !== undefined) {
      updates.push(`"ICUAllocationFromDate" = $${paramIndex++}`);
      params.push(ICUAllocationFromDate);
    }
    if (ICUAllocationToDate !== undefined) {
      updates.push(`"ICUAllocationToDate" = $${paramIndex++}`);
      params.push(ICUAllocationToDate);
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
    if (ICUAllocationCreatedBy !== undefined) {
      updates.push(`"ICUAllocationCreatedBy" = $${paramIndex++}`);
      params.push(createdByValue);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }
    if (OnVentilator !== undefined) {
      updates.push(`"OnVentilator" = $${paramIndex++}`);
      params.push(OnVentilator || 'No');
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const updateQuery = `
      UPDATE "PatientICUAdmission"
      SET ${updates.join(', ')}
      WHERE "PatientICUAdmissionId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient ICU admission not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient ICU admission updated successfully',
      data: mapPatientICUAdmissionRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId or ICUId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient ICU admission',
      error: error.message,
    });
  }
};

/**
 * Get count of total ICU beds and occupied ICU beds for a specific date
 * Query parameter: ?date=YYYY-MM-DD (required)
 * Returns:
 * 1. Total ICU beds count (from ICU table where Status = 'Active')
 * 2. Occupied ICU beds count (from PatientICUAdmission where date is between ICUAllocationFromDate and ICUAllocationToDate, and ICUAdmissionStatus = 'Occupied')
 */
exports.getICUBedsAndOccupiedCountByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required. Please provide date in YYYY-MM-DD format (e.g., ?date=2025-12-03)',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-03)',
      });
    }

    // Query to get both counts
    // For occupied beds: date should be between ICUAllocationFromDate and ICUAllocationToDate
    // If ICUAllocationToDate is NULL, treat as still occupied (date >= ICUAllocationFromDate)
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM "ICU" WHERE "Status" = 'Active') AS total_icu_beds,
        COUNT(DISTINCT pica."ICUId") FILTER (
          WHERE pica."ICUAllocationFromDate" IS NOT NULL
          AND (
            (pica."ICUAllocationToDate" IS NOT NULL 
             AND $1::date >= pica."ICUAllocationFromDate" 
             AND $1::date <= pica."ICUAllocationToDate")
            OR
            (pica."ICUAllocationToDate" IS NULL 
             AND $1::date >= pica."ICUAllocationFromDate")
          )
          AND pica."ICUAdmissionStatus" = 'Occupied'
          AND pica."Status" = 'Active'
        ) AS occupied_icu_beds
      FROM "PatientICUAdmission" pica
    `;

    const { rows } = await db.query(query, [date]);

    const totalICUBeds = parseInt(rows[0].total_icu_beds, 10) || 0;
    const occupiedICUBeds = parseInt(rows[0].occupied_icu_beds, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'ICU beds and occupied count retrieved successfully',
      date: date,
      counts: {
        totalICUBeds: totalICUBeds,
        occupiedICUBeds: occupiedICUBeds,
        availableICUBeds: totalICUBeds - occupiedICUBeds
      },
      data: {
        date: date,
        totalICUBeds: totalICUBeds,
        occupiedICUBeds: occupiedICUBeds,
        availableICUBeds: totalICUBeds - occupiedICUBeds,
        criteria: {
          totalBeds: 'ICU beds with Status = Active',
          occupiedBeds: 'PatientICUAdmission records where date is between ICUAllocationFromDate and ICUAllocationToDate, ICUAdmissionStatus = Occupied, and Status = Active'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU beds and occupied count',
      error: error.message,
    });
  }
};

/**
 * Get ICU Occupancy Data
 * Returns ICU Admissions (Occupied) / ICU Beds Count (Total ICU beds)
 * Returns current occupancy data without requiring a date parameter
 */
exports.getICUOccupancyData = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Query to get both counts
    // For occupied beds: current date should be between ICUAllocationFromDate and ICUAllocationToDate
    // If ICUAllocationToDate is NULL, treat as still occupied (current date >= ICUAllocationFromDate)
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM "ICU" WHERE "Status" = 'Active') AS total_icu_beds,
        COUNT(DISTINCT pica."ICUId") FILTER (
          WHERE pica."ICUAllocationFromDate" IS NOT NULL
          AND (
            (pica."ICUAllocationToDate" IS NOT NULL 
             AND $1::date >= pica."ICUAllocationFromDate" 
             AND $1::date <= pica."ICUAllocationToDate")
            OR
            (pica."ICUAllocationToDate" IS NULL 
             AND $1::date >= pica."ICUAllocationFromDate")
          )
          AND pica."ICUAdmissionStatus" = 'Occupied'
          AND pica."Status" = 'Active'
        ) AS occupied_icu_beds
      FROM "PatientICUAdmission" pica
    `;

    const { rows } = await db.query(query, [today]);

    const totalICUBeds = parseInt(rows[0].total_icu_beds || rows[0].totalicubeds, 10) || 0;
    const occupiedICUBeds = parseInt(rows[0].occupied_icu_beds || rows[0].occupiedicubeds, 10) || 0;
    const availableICUBeds = totalICUBeds - occupiedICUBeds;
    const occupancyRate = totalICUBeds > 0 ? Math.round((occupiedICUBeds / totalICUBeds) * 100) : 0;

    // Format occupancy as "occupied/total"
    const occupancy = totalICUBeds > 0 ? `${occupiedICUBeds}/${totalICUBeds}` : '0/0';

    res.status(200).json({
      success: true,
      message: 'ICU occupancy data retrieved successfully',
      date: today,
      data: {
        occupiedAdmissions: occupiedICUBeds,
        totalICUBeds: totalICUBeds,
        availableICUBeds: availableICUBeds,
        occupancy: occupancy,
        occupancyRate: occupancyRate,
        occupancyPercentage: `${occupancyRate}%`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU occupancy data',
      error: error.message,
    });
  }
};

/**
 * Get Critical Patients Count
 * Returns count of ICU patients whose ICUPatientStatus is 'Critical'
 * Filters by Status = 'Active' and ICUAdmissionStatus = 'Occupied' to get current critical patients
 */
exports.getCriticalPatientsCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientICUAdmission" pica
      INNER JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      WHERE pica."ICUPatientStatus" = 'Critical'
      AND pica."Status" = 'Active'
      AND pica."ICUAdmissionStatus" = 'Occupied'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count || rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Critical patients count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'PatientICUAdmission joined with ICU',
          conditions: {
            icuPatientStatus: 'Critical',
            status: 'Active',
            icuAdmissionStatus: 'Occupied'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching critical patients count',
      error: error.message,
    });
  }
};

exports.getOnVentilatorPatientsCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientICUAdmission" pica
      INNER JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      WHERE pica."OnVentilator" = 'Yes'
      AND pica."Status" = 'Active'
      AND pica."ICUAdmissionStatus" = 'Occupied'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count || rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'On ventilator patients count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'PatientICUAdmission joined with ICU',
          conditions: {
            onVentilator: 'Yes',
            status: 'Active',
            icuAdmissionStatus: 'Occupied'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching on ventilator patients count',
      error: error.message,
    });
  }
};

exports.getAvailableICUBeds = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Query to get count of available ICU beds
    // Available = ICU beds that are Active AND not currently occupied
    // A bed is occupied if there's an active PatientICUAdmission where:
    // - ICUAdmissionStatus = 'Occupied'
    // - Status = 'Active'
    // - Current date is between ICUAllocationFromDate and ICUAllocationToDate (or ICUAllocationToDate is NULL)
    const query = `
      SELECT COUNT(*) AS count
      FROM "ICU" icu
      WHERE icu."Status" = 'Active'
      AND icu."ICUId" NOT IN (
        SELECT DISTINCT pica."ICUId"
        FROM "PatientICUAdmission" pica
        WHERE pica."Status" = 'Active'
        AND pica."ICUAdmissionStatus" = 'Occupied'
        AND pica."ICUAllocationFromDate" IS NOT NULL
        AND (
          (pica."ICUAllocationToDate" IS NOT NULL
           AND $1::date >= pica."ICUAllocationFromDate"
           AND $1::date <= pica."ICUAllocationToDate")
          OR
          (pica."ICUAllocationToDate" IS NULL
           AND $1::date >= pica."ICUAllocationFromDate")
        )
      )
    `;

    const { rows } = await db.query(query, [today]);

    const count = parseInt(rows[0].count || rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Available ICU beds count retrieved successfully',
      date: today,
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'ICU',
          conditions: {
            status: 'Active',
            notOccupied: 'Not in PatientICUAdmission with Occupied status for current date'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available ICU beds count',
      error: error.message,
    });
  }
};

exports.getICUAdmissionsforICUMgmt = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Query to get all ICU beds with their current admission details (if any)
    // This shows all active ICU beds and their current patient admission status
    const query = `
      SELECT 
        icu."ICUId",
        icu."ICUBedNo",
        icu."ICUType",
        icu."ICURoomNameNo",
        icu."ICUDescription",
        icu."IsVentilatorAttached",
        icu."ICUStartTimeofDay",
        icu."ICUEndTimeofDay",
        icu."Status" AS "ICUStatus",
        icu."CreatedBy" AS "ICUCreatedBy",
        icu."CreatedAt" AS "ICUCreatedAt",
        pica."PatientICUAdmissionId",
        pica."PatientId",
        pica."PatientAppointmentId",
        pica."EmergencyBedSlotId",
        pica."RoomAdmissionId",
        pica."ICUPatientStatus",
        pica."ICUAdmissionStatus",
        pica."ICUAllocationFromDate",
        pica."ICUAllocationToDate",
        pica."NumberOfDays",
        pica."Diagnosis",
        pica."TreatementDetails",
        pica."PatientCondition",
        pica."ICUAllocationCreatedBy",
        pica."ICUAllocationCreatedAt",
        pica."Status" AS "AdmissionStatus",
        pica."OnVentilator",
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        p."PhoneNo" AS "PatientPhoneNo",
        pa."TokenNo" AS "AppointmentTokenNo",
        u."UserName" AS "CreatedByName"
      FROM "ICU" icu
      INNER JOIN "PatientICUAdmission" pica ON icu."ICUId" = pica."ICUId"
        AND pica."Status" = 'Active'
        AND pica."ICUAdmissionStatus" = 'Occupied'
        AND pica."ICUAllocationFromDate" IS NOT NULL
        AND (
          (pica."ICUAllocationToDate" IS NOT NULL
           AND $1::date >= pica."ICUAllocationFromDate"
           AND $1::date <= pica."ICUAllocationToDate")
          OR
          (pica."ICUAllocationToDate" IS NULL
           AND $1::date >= pica."ICUAllocationFromDate")
        )
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      WHERE icu."Status" = 'Active'
      ORDER BY icu."ICUBedNo" ASC
    `;

    const { rows } = await db.query(query, [today]);

    const formattedData = rows.map(row => ({
      // ICU Bed Details
      icuId: row.ICUId || row.icuid || null,
      icuBedNo: row.ICUBedNo || row.icubedno || null,
      icuType: row.ICUType || row.icutype || null,
      icuRoomNameNo: row.ICURoomNameNo || row.icuroomnameno || null,
      icuDescription: row.ICUDescription || row.icudescription || null,
      isVentilatorAttached: row.IsVentilatorAttached || row.isventilatorattached || null,
      icuStartTimeofDay: row.ICUStartTimeofDay || row.icustarttimeofday || null,
      icuEndTimeofDay: row.ICUEndTimeofDay || row.icuendtimeofday || null,
      icuStatus: row.ICUStatus || row.icustatus || null,
      icuCreatedBy: row.ICUCreatedBy || row.icucreatedby || null,
      icuCreatedAt: row.ICUCreatedAt || row.icucreatedat || null,
      // Admission Details (null if bed is available)
      patientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid || null,
      patientId: row.PatientId || row.patientid || null,
      patientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
      emergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
      roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
      icuPatientStatus: row.ICUPatientStatus || row.icupatientstatus || null,
      icuAdmissionStatus: row.ICUAdmissionStatus || row.icuadmissionstatus || null,
      icuAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate || null,
      icuAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate || null,
      numberOfDays: row.NumberOfDays || row.numberofdays || null,
      diagnosis: row.Diagnosis || row.diagnosis || null,
      treatementDetails: row.TreatementDetails || row.treatementdetails || null,
      patientCondition: row.PatientCondition || row.patientcondition || null,
      icuAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby || null,
      icuAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat || null,
      admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
      onVentilator: row.OnVentilator || row.onventilator || null,
      // Patient Details (null if bed is available)
      patientName: row.PatientName || row.patientname || null,
      patientNo: row.PatientNo || row.patientno || null,
      patientAge: row.Age || row.age || null,
      patientGender: row.Gender || row.gender || null,
      patientPhoneNo: row.PatientPhoneNo || row.patientphoneno || null,
      appointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
      createdByName: row.CreatedByName || row.createdbyname || null,
      // Computed field
      isOccupied: row.PatientICUAdmissionId ? true : false
    }));

    res.status(200).json({
      success: true,
      message: 'ICU beds with admission details retrieved successfully',
      date: today,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU beds with admission details',
      error: error.message,
    });
  }
};

exports.getICUBedsDetailsMgmt = async (req, res) => {
  try {
    // Query to get all ICU beds with their corresponding admission details from PatientICUAdmission table
    // This shows all active ICU beds and all their admission records
    const query = `
      SELECT 
        -- ICU Bed Details
        icu."ICUId",
        icu."ICUBedNo",
        icu."ICUType",
        icu."ICURoomNameNo",
        icu."ICUDescription",
        icu."IsVentilatorAttached",
        icu."ICUStartTimeofDay",
        icu."ICUEndTimeofDay",
        icu."Status" AS "ICUStatus",
        icu."CreatedBy" AS "ICUCreatedBy",
        icu."CreatedAt" AS "ICUCreatedAt",
        -- PatientICUAdmission Details
        pica."PatientICUAdmissionId",
        pica."PatientId",
        pica."PatientAppointmentId",
        pica."EmergencyBedSlotId",
        pica."RoomAdmissionId",
        pica."ICUPatientStatus",
        pica."ICUAdmissionStatus",
        pica."ICUAllocationFromDate",
        pica."ICUAllocationToDate",
        pica."NumberOfDays",
        pica."Diagnosis",
        pica."TreatementDetails",
        pica."PatientCondition",
        pica."ICUAllocationCreatedBy",
        pica."ICUAllocationCreatedAt",
        pica."Status" AS "AdmissionStatus",
        pica."OnVentilator",
        -- Patient Details
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        p."PhoneNo" AS "PatientPhoneNo",
        -- Appointment Details
        pa."TokenNo" AS "AppointmentTokenNo",
        pa."AppointmentDate",
        pa."AppointmentTime",
        -- Created By User Details
        u."UserName" AS "CreatedByName"
      FROM "ICU" icu
      LEFT JOIN "PatientICUAdmission" pica ON icu."ICUId" = pica."ICUId"
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      WHERE icu."Status" = 'Active'
      ORDER BY icu."ICUBedNo" ASC, pica."ICUAllocationFromDate" DESC NULLS LAST
    `;

    const { rows } = await db.query(query);

    // Group by ICU bed and organize admissions
    const bedsMap = new Map();

    rows.forEach(row => {
      const icuId = row.ICUId || row.icuid;
      
      if (!bedsMap.has(icuId)) {
        bedsMap.set(icuId, {
          // ICU Bed Details
          icuId: icuId,
          icuBedNo: row.ICUBedNo || row.icubedno || null,
          icuType: row.ICUType || row.icutype || null,
          icuRoomNameNo: row.ICURoomNameNo || row.icuroomnameno || null,
          icuDescription: row.ICUDescription || row.icudescription || null,
          isVentilatorAttached: row.IsVentilatorAttached || row.isventilatorattached || null,
          icuStartTimeofDay: row.ICUStartTimeofDay || row.icustarttimeofday || null,
          icuEndTimeofDay: row.ICUEndTimeofDay || row.icuendtimeofday || null,
          icuStatus: row.ICUStatus || row.icustatus || null,
          icuCreatedBy: row.ICUCreatedBy || row.icucreatedby || null,
          icuCreatedAt: row.ICUCreatedAt || row.icucreatedat || null,
          admissions: []
        });
      }

      // Add admission details if exists
      if (row.PatientICUAdmissionId || row.patienticuadmissionid) {
        const bed = bedsMap.get(icuId);
        bed.admissions.push({
          patientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid || null,
          patientId: row.PatientId || row.patientid || null,
          patientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
          emergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
          roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
          icuPatientStatus: row.ICUPatientStatus || row.icupatientstatus || null,
          icuAdmissionStatus: row.ICUAdmissionStatus || row.icuadmissionstatus || null,
          icuAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate || null,
          icuAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate || null,
          numberOfDays: row.NumberOfDays || row.numberofdays || null,
          diagnosis: row.Diagnosis || row.diagnosis || null,
          treatementDetails: row.TreatementDetails || row.treatementdetails || null,
          patientCondition: row.PatientCondition || row.patientcondition || null,
          icuAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby || null,
          icuAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat || null,
          admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
          onVentilator: row.OnVentilator || row.onventilator || null,
          // Patient Details
          patientName: row.PatientName || row.patientname || null,
          patientNo: row.PatientNo || row.patientno || null,
          patientAge: row.Age || row.age || null,
          patientGender: row.Gender || row.gender || null,
          patientPhoneNo: row.PatientPhoneNo || row.patientphoneno || null,
          // Appointment Details
          appointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
          appointmentDate: row.AppointmentDate || row.appointmentdate || null,
          appointmentTime: row.AppointmentTime || row.appointmenttime || null,
          // Created By
          createdByName: row.CreatedByName || row.createdbyname || null
        });
      }
    });

    // Convert map to array
    const formattedData = Array.from(bedsMap.values());

    res.status(200).json({
      success: true,
      message: 'ICU beds with admission details retrieved successfully',
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU beds with admission details',
      error: error.message,
    });
  }
};

exports.getICUBedsDetailsMgmtByICUId = async (req, res) => {
  try {
    const { id } = req.params;
    const icuId = parseInt(id, 10);
    
    if (isNaN(icuId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ICUId. Must be an integer. Received: ${id} (type: ${typeof id})`
      });
    }

    // Query to get ICU bed details with all admission records for the specific ICUId
    const query = `
      SELECT 
        -- ICU Bed Details
        icu."ICUId",
        icu."ICUBedNo",
        icu."ICUType",
        icu."ICURoomNameNo",
        icu."ICUDescription",
        icu."IsVentilatorAttached",
        icu."ICUStartTimeofDay",
        icu."ICUEndTimeofDay",
        icu."Status" AS "ICUStatus",
        icu."CreatedBy" AS "ICUCreatedBy",
        icu."CreatedAt" AS "ICUCreatedAt",
        -- PatientICUAdmission Details
        pica."PatientICUAdmissionId",
        pica."PatientId",
        pica."PatientAppointmentId",
        pica."EmergencyBedSlotId",
        pica."RoomAdmissionId",
        pica."ICUPatientStatus",
        pica."ICUAdmissionStatus",
        pica."ICUAllocationFromDate",
        pica."ICUAllocationToDate",
        pica."NumberOfDays",
        pica."Diagnosis",
        pica."TreatementDetails",
        pica."PatientCondition",
        pica."ICUAllocationCreatedBy",
        pica."ICUAllocationCreatedAt",
        pica."Status" AS "AdmissionStatus",
        pica."OnVentilator",
        -- Patient Details
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        p."PhoneNo" AS "PatientPhoneNo",
        -- Appointment Details
        pa."TokenNo" AS "AppointmentTokenNo",
        pa."AppointmentDate",
        pa."AppointmentTime",
        -- Created By User Details
        u."UserName" AS "CreatedByName"
      FROM "ICU" icu
      LEFT JOIN "PatientICUAdmission" pica ON icu."ICUId" = pica."ICUId"
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      WHERE icu."ICUId" = $1
      ORDER BY pica."ICUAllocationFromDate" DESC NULLS LAST
    `;

    const { rows } = await db.query(query, [icuId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ICU bed with ID ${icuId} not found`
      });
    }

    // Get ICU bed details from first row
    const firstRow = rows[0];
    const icuBedDetails = {
      icuId: firstRow.ICUId || firstRow.icuid || null,
      icuBedNo: firstRow.ICUBedNo || firstRow.icubedno || null,
      icuType: firstRow.ICUType || firstRow.icutype || null,
      icuRoomNameNo: firstRow.ICURoomNameNo || firstRow.icuroomnameno || null,
      icuDescription: firstRow.ICUDescription || firstRow.icudescription || null,
      isVentilatorAttached: firstRow.IsVentilatorAttached || firstRow.isventilatorattached || null,
      icuStartTimeofDay: firstRow.ICUStartTimeofDay || firstRow.icustarttimeofday || null,
      icuEndTimeofDay: firstRow.ICUEndTimeofDay || firstRow.icuendtimeofday || null,
      icuStatus: firstRow.ICUStatus || firstRow.icustatus || null,
      icuCreatedBy: firstRow.ICUCreatedBy || firstRow.icucreatedby || null,
      icuCreatedAt: firstRow.ICUCreatedAt || firstRow.icucreatedat || null
    };

    // Collect all admission records
    const admissions = [];
    rows.forEach(row => {
      if (row.PatientICUAdmissionId || row.patienticuadmissionid) {
        admissions.push({
          patientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid || null,
          patientId: row.PatientId || row.patientid || null,
          patientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
          emergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
          roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
          icuPatientStatus: row.ICUPatientStatus || row.icupatientstatus || null,
          icuAdmissionStatus: row.ICUAdmissionStatus || row.icuadmissionstatus || null,
          icuAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate || null,
          icuAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate || null,
          numberOfDays: row.NumberOfDays || row.numberofdays || null,
          diagnosis: row.Diagnosis || row.diagnosis || null,
          treatementDetails: row.TreatementDetails || row.treatementdetails || null,
          patientCondition: row.PatientCondition || row.patientcondition || null,
          icuAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby || null,
          icuAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat || null,
          admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
          onVentilator: row.OnVentilator || row.onventilator || null,
          // Patient Details
          patientName: row.PatientName || row.patientname || null,
          patientNo: row.PatientNo || row.patientno || null,
          patientAge: row.Age || row.age || null,
          patientGender: row.Gender || row.gender || null,
          patientPhoneNo: row.PatientPhoneNo || row.patientphoneno || null,
          // Appointment Details
          appointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
          appointmentDate: row.AppointmentDate || row.appointmentdate || null,
          appointmentTime: row.AppointmentTime || row.appointmenttime || null,
          // Created By
          createdByName: row.CreatedByName || row.createdbyname || null
        });
      }
    });

    const formattedData = {
      ...icuBedDetails,
      admissions: admissions,
      admissionCount: admissions.length
    };
console.log('formattedDataformattedDataformattedDataformattedData',formattedData);
    res.status(200).json({
      success: true,
      message: 'ICU bed details with admission records retrieved successfully',
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU bed details with admission records',
      error: error.message,
    });
  }
};

exports.getICUBedsDetailsMgmtByICUBedId = async (req, res) => {
  try {
    const { icuBedId } = req.params;
    
    if (!icuBedId || typeof icuBedId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUBedId. Must be a valid string (ICUBedNo).'
      });
    }

    // Query to get ICU bed details with all admission records for the specific ICUBedNo
    const query = `
      SELECT 
        -- ICU Bed Details
        icu."ICUId",
        icu."ICUBedNo",
        icu."ICUType",
        icu."ICURoomNameNo",
        icu."ICUDescription",
        icu."IsVentilatorAttached",
        icu."ICUStartTimeofDay",
        icu."ICUEndTimeofDay",
        icu."Status" AS "ICUStatus",
        icu."CreatedBy" AS "ICUCreatedBy",
        icu."CreatedAt" AS "ICUCreatedAt",
        -- PatientICUAdmission Details
        pica."PatientICUAdmissionId",
        pica."PatientId",
        pica."PatientAppointmentId",
        pica."EmergencyBedSlotId",
        pica."RoomAdmissionId",
        pica."ICUPatientStatus",
        pica."ICUAdmissionStatus",
        pica."ICUAllocationFromDate",
        pica."ICUAllocationToDate",
        pica."NumberOfDays",
        pica."Diagnosis",
        pica."TreatementDetails",
        pica."PatientCondition",
        pica."ICUAllocationCreatedBy",
        pica."ICUAllocationCreatedAt",
        pica."Status" AS "AdmissionStatus",
        pica."OnVentilator",
        -- Patient Details
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        p."PhoneNo" AS "PatientPhoneNo",
        -- Appointment Details
        pa."TokenNo" AS "AppointmentTokenNo",
        pa."AppointmentDate",
        pa."AppointmentTime",
        -- Created By User Details
        u."UserName" AS "CreatedByName"
      FROM "ICU" icu
      LEFT JOIN "PatientICUAdmission" pica ON icu."ICUId" = pica."ICUId"
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      WHERE icu."ICUBedNo" = $1
      ORDER BY pica."ICUAllocationFromDate" DESC NULLS LAST
    `;

    const { rows } = await db.query(query, [icuBedId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ICU bed with bed number "${icuBedId}" not found`
      });
    }

    // Get ICU bed details from first row
    const firstRow = rows[0];
    const icuBedDetails = {
      icuId: firstRow.ICUId || firstRow.icuid || null,
      icuBedNo: firstRow.ICUBedNo || firstRow.icubedno || null,
      icuType: firstRow.ICUType || firstRow.icutype || null,
      icuRoomNameNo: firstRow.ICURoomNameNo || firstRow.icuroomnameno || null,
      icuDescription: firstRow.ICUDescription || firstRow.icudescription || null,
      isVentilatorAttached: firstRow.IsVentilatorAttached || firstRow.isventilatorattached || null,
      icuStartTimeofDay: firstRow.ICUStartTimeofDay || firstRow.icustarttimeofday || null,
      icuEndTimeofDay: firstRow.ICUEndTimeofDay || firstRow.icuendtimeofday || null,
      icuStatus: firstRow.ICUStatus || firstRow.icustatus || null,
      icuCreatedBy: firstRow.ICUCreatedBy || firstRow.icucreatedby || null,
      icuCreatedAt: firstRow.ICUCreatedAt || firstRow.icucreatedat || null
    };

    // Collect all admission records
    const admissions = [];
    rows.forEach(row => {
      if (row.PatientICUAdmissionId || row.patienticuadmissionid) {
        admissions.push({
          patientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid || null,
          patientId: row.PatientId || row.patientid || null,
          patientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
          emergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
          roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
          icuPatientStatus: row.ICUPatientStatus || row.icupatientstatus || null,
          icuAdmissionStatus: row.ICUAdmissionStatus || row.icuadmissionstatus || null,
          icuAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate || null,
          icuAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate || null,
          numberOfDays: row.NumberOfDays || row.numberofdays || null,
          diagnosis: row.Diagnosis || row.diagnosis || null,
          treatementDetails: row.TreatementDetails || row.treatementdetails || null,
          patientCondition: row.PatientCondition || row.patientcondition || null,
          icuAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby || null,
          icuAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat || null,
          admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
          onVentilator: row.OnVentilator || row.onventilator || null,
          // Patient Details
          patientName: row.PatientName || row.patientname || null,
          patientNo: row.PatientNo || row.patientno || null,
          patientAge: row.Age || row.age || null,
          patientGender: row.Gender || row.gender || null,
          patientPhoneNo: row.PatientPhoneNo || row.patientphoneno || null,
          // Appointment Details
          appointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
          appointmentDate: row.AppointmentDate || row.appointmentdate || null,
          appointmentTime: row.AppointmentTime || row.appointmenttime || null,
          // Created By
          createdByName: row.CreatedByName || row.createdbyname || null
        });
      }
    });

    const formattedData = {
      ...icuBedDetails,
      admissions: admissions,
      admissionCount: admissions.length
    };

    res.status(200).json({
      success: true,
      message: 'ICU bed details with admission records retrieved successfully',
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU bed details with admission records',
      error: error.message,
    });
  }
};

exports.getICUAdmissionsforICUMgmtByPatientICUAdmissionId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientICUAdmissionId. Must be a valid UUID.'
      });
    }

    // Query to get comprehensive ICU, PatientICUAdmission, and Patient details
    const query = `
      SELECT 
        -- ICU Bed Details
        icu."ICUId",
        icu."ICUBedNo",
        icu."ICUType",
        icu."ICURoomNameNo",
        icu."ICUDescription",
        icu."IsVentilatorAttached",
        icu."ICUStartTimeofDay",
        icu."ICUEndTimeofDay",
        icu."Status" AS "ICUStatus",
        icu."CreatedBy" AS "ICUCreatedBy",
        icu."CreatedAt" AS "ICUCreatedAt",
        -- PatientICUAdmission Details
        pica."PatientICUAdmissionId",
        pica."PatientId",
        pica."PatientAppointmentId",
        pica."EmergencyBedSlotId",
        pica."RoomAdmissionId",
        pica."ICUId" AS "AdmissionICUId",
        pica."ICUPatientStatus",
        pica."ICUAdmissionStatus",
        pica."ICUAllocationFromDate",
        pica."ICUAllocationToDate",
        pica."NumberOfDays",
        pica."Diagnosis",
        pica."TreatementDetails",
        pica."PatientCondition",
        pica."ICUAllocationCreatedBy",
        pica."ICUAllocationCreatedAt",
        pica."Status" AS "AdmissionStatus",
        pica."OnVentilator",
        -- Patient Details
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        p."PhoneNo" AS "PatientPhoneNo",
        p."EmailId" AS "PatientEmailId",
        p."Address" AS "PatientAddress",
        p."DateOfBirth" AS "PatientDateOfBirth",
        p."BloodGroup" AS "PatientBloodGroup",
        p."EmergencyContactName" AS "PatientEmergencyContactName",
        p."EmergencyContactPhone" AS "PatientEmergencyContactPhone",
        p."Status" AS "PatientStatus",
        -- Appointment Details (if exists)
        pa."TokenNo" AS "AppointmentTokenNo",
        pa."AppointmentDate" AS "AppointmentDate",
        pa."AppointmentTime" AS "AppointmentTime",
        pa."AppointmentStatus" AS "AppointmentStatus",
        -- Created By User Details
        u."UserName" AS "CreatedByName",
        u."EmailId" AS "CreatedByEmail",
        u."PhoneNo" AS "CreatedByPhone"
      FROM "PatientICUAdmission" pica
      INNER JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      INNER JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      WHERE pica."PatientICUAdmissionId" = $1::uuid
    `;

    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient ICU admission with ID ${id} not found`
      });
    }

    const row = rows[0];

    // Format the response with organized sections
    const formattedData = {
      // ICU Bed Details
      icu: {
        icuId: row.ICUId || row.icuid || null,
        icuBedNo: row.ICUBedNo || row.icubedno || null,
        icuType: row.ICUType || row.icutype || null,
        icuRoomNameNo: row.ICURoomNameNo || row.icuroomnameno || null,
        icuDescription: row.ICUDescription || row.icudescription || null,
        isVentilatorAttached: row.IsVentilatorAttached || row.isventilatorattached || null,
        icuStartTimeofDay: row.ICUStartTimeofDay || row.icustarttimeofday || null,
        icuEndTimeofDay: row.ICUEndTimeofDay || row.icuendtimeofday || null,
        icuStatus: row.ICUStatus || row.icustatus || null,
        icuCreatedBy: row.ICUCreatedBy || row.icucreatedby || null,
        icuCreatedAt: row.ICUCreatedAt || row.icucreatedat || null
      },
      // PatientICUAdmission Details
      admission: {
        patientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid || null,
        patientId: row.PatientId || row.patientid || null,
        patientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
        emergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
        roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
        icuId: row.AdmissionICUId || row.admissionicuid || null,
        icuPatientStatus: row.ICUPatientStatus || row.icupatientstatus || null,
        icuAdmissionStatus: row.ICUAdmissionStatus || row.icuadmissionstatus || null,
        icuAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate || null,
        icuAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate || null,
        numberOfDays: row.NumberOfDays || row.numberofdays || null,
        diagnosis: row.Diagnosis || row.diagnosis || null,
        treatementDetails: row.TreatementDetails || row.treatementdetails || null,
        patientCondition: row.PatientCondition || row.patientcondition || null,
        icuAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby || null,
        icuAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat || null,
        admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
        onVentilator: row.OnVentilator || row.onventilator || null
      },
      // Patient Details
      patient: {
        patientId: row.PatientId || row.patientid || null,
        patientName: row.PatientName || row.patientname || null,
        patientNo: row.PatientNo || row.patientno || null,
        age: row.Age || row.age || null,
        gender: row.Gender || row.gender || null,
        phoneNo: row.PatientPhoneNo || row.patientphoneno || null,
        emailId: row.PatientEmailId || row.patientemailid || null,
        address: row.PatientAddress || row.patientaddress || null,
        dateOfBirth: row.PatientDateOfBirth || row.patientdateofbirth || null,
        bloodGroup: row.PatientBloodGroup || row.patientbloodgroup || null,
        emergencyContactName: row.PatientEmergencyContactName || row.patientemergencycontactname || null,
        emergencyContactPhone: row.PatientEmergencyContactPhone || row.patientemergencycontactphone || null,
        patientStatus: row.PatientStatus || row.patientstatus || null
      },
      // Appointment Details (if exists)
      appointment: row.PatientAppointmentId ? {
        patientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
        tokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
        appointmentDate: row.AppointmentDate || row.appointmentdate || null,
        appointmentTime: row.AppointmentTime || row.appointmenttime || null,
        appointmentStatus: row.AppointmentStatus || row.appointmentstatus || null
      } : null,
      // Created By User Details
      createdBy: row.ICUAllocationCreatedBy ? {
        userId: row.ICUAllocationCreatedBy || row.icuallocationcreatedby || null,
        userName: row.CreatedByName || row.createdbyname || null,
        emailId: row.CreatedByEmail || row.createdbyemail || null,
        phoneNo: row.CreatedByPhone || row.createdbyphone || null
      } : null
    };

    res.status(200).json({
      success: true,
      message: 'ICU admission details retrieved successfully',
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU admission details',
      error: error.message,
    });
  }
};

exports.deletePatientICUAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient ICU admission not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient ICU admission deleted successfully',
      data: mapPatientICUAdmissionRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient ICU admission',
      error: error.message,
    });
  }
};

