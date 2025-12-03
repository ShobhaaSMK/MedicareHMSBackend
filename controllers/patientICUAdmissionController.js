const db = require('../db');
const { randomUUID } = require('crypto');

const allowedICUPatientStatus = ['Serious', 'Available', 'Critical', 'Stable'];
const allowedStatus = ['Active', 'Inactive'];

const mapPatientICUAdmissionRow = (row) => ({
  PatientICUAdmissionId: row.PatientICUAdmissionId || row.patienticuadmissionid,
  PatientId: row.PatientId || row.patientid,
  PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
  EmergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
  ICUId: row.ICUId || row.icuid,
  ICUPatientStatus: row.ICUPatientStatus || row.icupatientstatus,
  ICUAllocationFromDate: row.ICUAllocationFromDate || row.icuallocationfromdate,
  ICUAllocationToDate: row.ICUAllocationToDate || row.icuallocationtodate,
  NumberOfDays: row.NumberOfDays || row.numberofdays,
  Diagnosis: row.Diagnosis || row.diagnosis,
  TreatementDetails: row.TreatementDetails || row.treatementdetails,
  PatientCondition: row.PatientCondition || row.patientcondition,
  ICUAllocationCreatedBy: row.ICUAllocationCreatedBy || row.icuallocationcreatedby,
  ICUAllocationCreatedAt: row.ICUAllocationCreatedAt || row.icuallocationcreatedat,
  Status: row.Status || row.status,
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
        icu."ICUNo",
        pa."TokenNo" AS "AppointmentTokenNo",
        rb."BedNo",
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
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`pica."PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
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
        icu."ICUNo",
        pa."TokenNo" AS "AppointmentTokenNo",
        rb."BedNo",
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
    const patientIdInt = parseInt(body.PatientId, 10);
    if (isNaN(patientIdInt)) {
      errors.push('PatientId must be a valid integer');
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
      ICUId,
      ICUPatientStatus,
      ICUAllocationFromDate,
      ICUAllocationToDate,
      NumberOfDays,
      Diagnosis,
      TreatementDetails,
      PatientCondition,
      ICUAllocationCreatedBy,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for PatientICUAdmissionId
    const patientICUAdmissionId = randomUUID();

    if (!patientICUAdmissionId || typeof patientICUAdmissionId !== 'string') {
      throw new Error('Failed to generate PatientICUAdmissionId');
    }

    // Validate foreign key existence
    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [parseInt(PatientId, 10)]);
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

    const insertQuery = `
      INSERT INTO "PatientICUAdmission"
        ("PatientICUAdmissionId", "PatientId", "PatientAppointmentId", "EmergencyBedSlotId", "ICUId",
         "ICUPatientStatus", "ICUAllocationFromDate", "ICUAllocationToDate", "NumberOfDays",
         "Diagnosis", "TreatementDetails", "PatientCondition", "ICUAllocationCreatedBy", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      patientICUAdmissionId,
      parseInt(PatientId, 10),
      PatientAppointmentId ? parseInt(PatientAppointmentId, 10) : null,
      EmergencyBedSlotId ? parseInt(EmergencyBedSlotId, 10) : null,
      parseInt(ICUId, 10),
      ICUPatientStatus || null,
      ICUAllocationFromDate || null,
      ICUAllocationToDate || null,
      NumberOfDays ? parseInt(NumberOfDays, 10) : null,
      Diagnosis || null,
      TreatementDetails || null,
      PatientCondition || null,
      createdByValue,
      Status,
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
      ICUAllocationFromDate,
      ICUAllocationToDate,
      NumberOfDays,
      Diagnosis,
      TreatementDetails,
      PatientCondition,
      ICUAllocationCreatedBy,
      Status,
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

