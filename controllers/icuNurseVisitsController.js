const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];

const mapICUNurseVisitsRow = (row) => ({
  ICUNurseVisitsId: row.ICUNurseVisitsId || row.icunursevisitsid,
  ICUAdmissionId: row.ICUAdmissionId || row.icuadmissionid,
  PatientId: row.PatientId || row.patientid,
  NurseId: row.NurseId || row.nurseid,
  NurseVisitedDateTime: row.NurseVisitedDateTime || row.nursevisiteddatetime,
  NurseVisitsDetails: row.NurseVisitsDetails || row.nursevisitsdetails || null,
  PatientCondition: row.PatientCondition || row.patientcondition || null,
  Status: row.Status || row.status,
  VisitCreatedBy: row.VisitCreatedBy || row.visitcreatedby || null,
  VisitCreatedAt: row.VisitCreatedAt || row.visitcreatedat,
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  NurseName: row.NurseName || row.nursename || null,
  ICUNo: row.ICUNo || row.icuno || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
});

exports.getAllICUNurseVisits = async (req, res) => {
  try {
    const { status, patientId, nurseId, icuAdmissionId, fromDate, toDate } = req.query;
    let query = `
      SELECT 
        inv.*,
        p."PatientName", p."PatientNo",
        n."UserName" AS "NurseName",
        icu."ICUNo",
        u."UserName" AS "CreatedByName"
      FROM "ICUNurseVisits" inv
      LEFT JOIN "PatientRegistration" p ON inv."PatientId" = p."PatientId"
      LEFT JOIN "Users" n ON inv."NurseId" = n."UserId"
      LEFT JOIN "PatientICUAdmission" pica ON inv."ICUAdmissionId" = pica."PatientICUAdmissionId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "Users" u ON inv."VisitCreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`inv."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (patientId) {
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`inv."PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
      }
    }
    if (nurseId) {
      const nurseIdInt = parseInt(nurseId, 10);
      if (!isNaN(nurseIdInt)) {
        conditions.push(`inv."NurseId" = $${params.length + 1}`);
        params.push(nurseIdInt);
      }
    }
    if (icuAdmissionId) {
      conditions.push(`inv."ICUAdmissionId" = $${params.length + 1}::uuid`);
      params.push(icuAdmissionId);
    }
    if (fromDate) {
      conditions.push(`inv."NurseVisitedDateTime" >= $${params.length + 1}::timestamp`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`inv."NurseVisitedDateTime" <= $${params.length + 1}::timestamp`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY inv."NurseVisitedDateTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapICUNurseVisitsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU nurse visits',
      error: error.message,
    });
  }
};

exports.getICUNurseVisitsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        inv.*,
        p."PatientName", p."PatientNo",
        n."UserName" AS "NurseName",
        icu."ICUNo",
        u."UserName" AS "CreatedByName"
      FROM "ICUNurseVisits" inv
      LEFT JOIN "PatientRegistration" p ON inv."PatientId" = p."PatientId"
      LEFT JOIN "Users" n ON inv."NurseId" = n."UserId"
      LEFT JOIN "PatientICUAdmission" pica ON inv."ICUAdmissionId" = pica."PatientICUAdmissionId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "Users" u ON inv."VisitCreatedBy" = u."UserId"
      WHERE inv."ICUNurseVisitsId" = $1::uuid
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU nurse visit not found' });
    }

    res.status(200).json({ success: true, data: mapICUNurseVisitsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU nurse visit',
      error: error.message,
    });
  }
};

const validateICUNurseVisitsPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && !body.ICUAdmissionId) {
    errors.push('ICUAdmissionId is required');
  }
  if (body.ICUAdmissionId && typeof body.ICUAdmissionId !== 'string') {
    errors.push('ICUAdmissionId must be a valid UUID');
  }

  if (requireAll && body.PatientId === undefined) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null) {
    const patientIdInt = parseInt(body.PatientId, 10);
    if (isNaN(patientIdInt)) {
      errors.push('PatientId must be a valid integer');
    }
  }

  if (requireAll && body.NurseId === undefined) {
    errors.push('NurseId is required');
  }
  if (body.NurseId !== undefined && body.NurseId !== null) {
    const nurseIdInt = parseInt(body.NurseId, 10);
    if (isNaN(nurseIdInt)) {
      errors.push('NurseId must be a valid integer');
    }
  }

  if (requireAll && !body.NurseVisitedDateTime) {
    errors.push('NurseVisitedDateTime is required');
  }
  if (body.NurseVisitedDateTime && !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/.test(body.NurseVisitedDateTime)) {
    errors.push('NurseVisitedDateTime must be in ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)');
  }

  if (body.NurseVisitsDetails !== undefined && body.NurseVisitsDetails !== null && typeof body.NurseVisitsDetails !== 'string') {
    errors.push('NurseVisitsDetails must be a string');
  }

  if (body.PatientCondition !== undefined && body.PatientCondition !== null && typeof body.PatientCondition !== 'string') {
    errors.push('PatientCondition must be a string');
  }

  if (body.VisitCreatedBy !== undefined && body.VisitCreatedBy !== null) {
    const createdByInt = parseInt(body.VisitCreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('VisitCreatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  return errors;
};

exports.createICUNurseVisits = async (req, res) => {
  try {
    const errors = validateICUNurseVisitsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUAdmissionId,
      PatientId,
      NurseId,
      NurseVisitedDateTime,
      NurseVisitsDetails,
      PatientCondition,
      VisitCreatedBy,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for ICUNurseVisitsId
    const icuNurseVisitsId = randomUUID();

    if (!icuNurseVisitsId || typeof icuNurseVisitsId !== 'string') {
      throw new Error('Failed to generate ICUNurseVisitsId');
    }

    // Validate foreign key existence
    const icuAdmissionExists = await db.query('SELECT "PatientICUAdmissionId" FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid', [ICUAdmissionId]);
    if (icuAdmissionExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'ICUAdmissionId does not exist' });
    }

    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [parseInt(PatientId, 10)]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }

    const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(NurseId, 10)]);
    if (nurseExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'NurseId does not exist' });
    }

    let createdByValue = null;
    if (VisitCreatedBy !== undefined && VisitCreatedBy !== null && VisitCreatedBy !== '') {
      const createdByInt = parseInt(VisitCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'VisitCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'VisitCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    }

    const insertQuery = `
      INSERT INTO "ICUNurseVisits"
        ("ICUNurseVisitsId", "ICUAdmissionId", "PatientId", "NurseId", "NurseVisitedDateTime",
         "NurseVisitsDetails", "PatientCondition", "Status", "VisitCreatedBy")
      VALUES ($1::uuid, $2::uuid, $3, $4, $5::timestamp, $6, $7, $8, $9)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      icuNurseVisitsId,
      ICUAdmissionId,
      parseInt(PatientId, 10),
      parseInt(NurseId, 10),
      NurseVisitedDateTime,
      NurseVisitsDetails || null,
      PatientCondition || null,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'ICU nurse visit created successfully',
      data: mapICUNurseVisitsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure all referenced IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating ICU nurse visit',
      error: error.message,
    });
  }
};

exports.updateICUNurseVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateICUNurseVisitsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUAdmissionId,
      PatientId,
      NurseId,
      NurseVisitedDateTime,
      NurseVisitsDetails,
      PatientCondition,
      VisitCreatedBy,
      Status,
    } = req.body;

    // Validate foreign key existence if provided
    if (ICUAdmissionId !== undefined && ICUAdmissionId !== null) {
      const icuAdmissionExists = await db.query('SELECT "PatientICUAdmissionId" FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid', [ICUAdmissionId]);
      if (icuAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUAdmissionId does not exist' });
      }
    }

    if (PatientId !== undefined && PatientId !== null) {
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [parseInt(PatientId, 10)]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
      }
    }

    if (NurseId !== undefined && NurseId !== null) {
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(NurseId, 10)]);
      if (nurseExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'NurseId does not exist' });
      }
    }

    let createdByValue = null;
    if (VisitCreatedBy !== undefined && VisitCreatedBy !== null && VisitCreatedBy !== '') {
      const createdByInt = parseInt(VisitCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'VisitCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'VisitCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    } else if (VisitCreatedBy === null) {
      createdByValue = null;
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (ICUAdmissionId !== undefined) {
      updates.push(`"ICUAdmissionId" = $${paramIndex++}::uuid`);
      params.push(ICUAdmissionId);
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null);
    }
    if (NurseId !== undefined) {
      updates.push(`"NurseId" = $${paramIndex++}`);
      params.push(NurseId !== null ? parseInt(NurseId, 10) : null);
    }
    if (NurseVisitedDateTime !== undefined) {
      updates.push(`"NurseVisitedDateTime" = $${paramIndex++}::timestamp`);
      params.push(NurseVisitedDateTime);
    }
    if (NurseVisitsDetails !== undefined) {
      updates.push(`"NurseVisitsDetails" = $${paramIndex++}`);
      params.push(NurseVisitsDetails);
    }
    if (PatientCondition !== undefined) {
      updates.push(`"PatientCondition" = $${paramIndex++}`);
      params.push(PatientCondition);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }
    if (VisitCreatedBy !== undefined) {
      updates.push(`"VisitCreatedBy" = $${paramIndex++}`);
      params.push(createdByValue);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const updateQuery = `
      UPDATE "ICUNurseVisits"
      SET ${updates.join(', ')}
      WHERE "ICUNurseVisitsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU nurse visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU nurse visit updated successfully',
      data: mapICUNurseVisitsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure all referenced IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating ICU nurse visit',
      error: error.message,
    });
  }
};

exports.deleteICUNurseVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "ICUNurseVisits" WHERE "ICUNurseVisitsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU nurse visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU nurse visit deleted successfully',
      data: mapICUNurseVisitsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ICU nurse visit',
      error: error.message,
    });
  }
};

