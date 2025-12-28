const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];

const mapICUDoctorVisitsRow = (row) => ({
  ICUDoctorVisitsId: row.ICUDoctorVisitsId || row.icudoctorvisitsid,
  ICUAdmissionId: row.ICUAdmissionId || row.icuadmissionid,
  PatientId: row.PatientId || row.patientid,
  DoctorId: row.DoctorId || row.doctorid,
  DoctorVisitedDateTime: row.DoctorVisitedDateTime || row.doctorvisiteddatetime,
  VisitsDetails: row.VisitsDetails || row.visitsdetails || null,
  PatientCondition: row.PatientCondition || row.patientcondition || null,
  Status: row.Status || row.status,
  VisitCreatedBy: row.VisitCreatedBy || row.visitcreatedby || null,
  VisitCreatedAt: row.VisitCreatedAt || row.visitcreatedat,
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  DoctorName: row.DoctorName || row.doctorname || null,
  ICUNo: row.ICUNo || row.icuno || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
});

exports.getAllICUDoctorVisits = async (req, res) => {
  try {
    const { status, patientId, doctorId, icuAdmissionId, fromDate, toDate } = req.query;
    let query = `
      SELECT 
        idv.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        icu."ICUBedNo" AS "ICUNo",
        u."UserName" AS "CreatedByName"
      FROM "ICUDoctorVisits" idv
      LEFT JOIN "PatientRegistration" p ON idv."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON idv."DoctorId" = d."UserId"
      LEFT JOIN "PatientICUAdmission" pica ON idv."ICUAdmissionId" = pica."PatientICUAdmissionId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "Users" u ON idv."VisitCreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`idv."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (patientId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(patientId)) {
        conditions.push(`idv."PatientId" = $${params.length + 1}::uuid`);
        params.push(patientId);
      }
    }
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (!isNaN(doctorIdInt)) {
        conditions.push(`idv."DoctorId" = $${params.length + 1}`);
        params.push(doctorIdInt);
      }
    }
    if (icuAdmissionId) {
      conditions.push(`idv."ICUAdmissionId" = $${params.length + 1}::uuid`);
      params.push(icuAdmissionId);
    }
    if (fromDate) {
      conditions.push(`idv."DoctorVisitedDateTime" >= $${params.length + 1}::timestamp`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`idv."DoctorVisitedDateTime" <= $${params.length + 1}::timestamp`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY idv."DoctorVisitedDateTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapICUDoctorVisitsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU doctor visits',
      error: error.message,
    });
  }
};

exports.getICUDoctorVisitsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        idv.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        icu."ICUBedNo" AS "ICUNo",
        u."UserName" AS "CreatedByName"
      FROM "ICUDoctorVisits" idv
      LEFT JOIN "PatientRegistration" p ON idv."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON idv."DoctorId" = d."UserId"
      LEFT JOIN "PatientICUAdmission" pica ON idv."ICUAdmissionId" = pica."PatientICUAdmissionId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "Users" u ON idv."VisitCreatedBy" = u."UserId"
      WHERE idv."ICUDoctorVisitsId" = $1::uuid
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU doctor visit not found' });
    }

    res.status(200).json({ success: true, data: mapICUDoctorVisitsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU doctor visit',
      error: error.message,
    });
  }
};

exports.getICUDoctorVisitsByICUAdmissionId = async (req, res) => {
  try {
    const { icuAdmissionId } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(icuAdmissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUAdmissionId. Must be a valid UUID.',
      });
    }

    const { rows } = await db.query(
      `
      SELECT 
        idv.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        icu."ICUBedNo" AS "ICUNo",
        u."UserName" AS "CreatedByName",
        TO_CHAR(idv."DoctorVisitedDateTime", 'DD-MM-YYYY HH24:MI') AS "DoctorVisitedDateTime"
      FROM "ICUDoctorVisits" idv
      LEFT JOIN "PatientRegistration" p ON idv."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON idv."DoctorId" = d."UserId"
      LEFT JOIN "PatientICUAdmission" pica ON idv."ICUAdmissionId" = pica."PatientICUAdmissionId"
      LEFT JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      LEFT JOIN "Users" u ON idv."VisitCreatedBy" = u."UserId"
      WHERE idv."ICUAdmissionId" = $1::uuid
      ORDER BY idv."DoctorVisitedDateTime" DESC
      `,
      [icuAdmissionId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      icuAdmissionId: icuAdmissionId,
      data: rows.map(mapICUDoctorVisitsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU doctor visits by ICU admission ID',
      error: error.message,
    });
  }
};

const validateICUDoctorVisitsPayload = (body, requireAll = true) => {
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
    if (typeof body.PatientId !== 'string') {
      errors.push('PatientId must be a valid UUID string');
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(body.PatientId)) {
        errors.push('PatientId must be a valid UUID');
      }
    }
  }

  if (requireAll && body.DoctorId === undefined) {
    errors.push('DoctorId is required');
  }
  if (body.DoctorId !== undefined && body.DoctorId !== null) {
    const doctorIdInt = parseInt(body.DoctorId, 10);
    if (isNaN(doctorIdInt)) {
      errors.push('DoctorId must be a valid integer');
    }
  }

  if (requireAll && !body.DoctorVisitedDateTime) {
    errors.push('DoctorVisitedDateTime is required');
  }
  if (body.DoctorVisitedDateTime && !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/.test(body.DoctorVisitedDateTime)) {
    errors.push('DoctorVisitedDateTime must be in ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)');
  }

  if (body.VisitsDetails !== undefined && body.VisitsDetails !== null && typeof body.VisitsDetails !== 'string') {
    errors.push('VisitsDetails must be a string');
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

exports.createICUDoctorVisits = async (req, res) => {
  try {
    const errors = validateICUDoctorVisitsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUAdmissionId,
      PatientId,
      DoctorId,
      DoctorVisitedDateTime,
      VisitsDetails,
      PatientCondition,
      VisitCreatedBy,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for ICUDoctorVisitsId
    const icuDoctorVisitsId = randomUUID();

    if (!icuDoctorVisitsId || typeof icuDoctorVisitsId !== 'string') {
      throw new Error('Failed to generate ICUDoctorVisitsId');
    }

    // Validate foreign key existence
    const icuAdmissionExists = await db.query('SELECT "PatientICUAdmissionId" FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid', [ICUAdmissionId]);
    if (icuAdmissionExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'ICUAdmissionId does not exist' });
    }

    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }

    const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(DoctorId, 10)]);
    if (doctorExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'DoctorId does not exist' });
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
      INSERT INTO "ICUDoctorVisits"
        ("ICUDoctorVisitsId", "ICUAdmissionId", "PatientId", "DoctorId", "DoctorVisitedDateTime",
         "VisitsDetails", "PatientCondition", "Status", "VisitCreatedBy")
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::timestamp, $6, $7, $8, $9)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      icuDoctorVisitsId,
      ICUAdmissionId,
      PatientId,
      parseInt(DoctorId, 10),
      DoctorVisitedDateTime,
      VisitsDetails || null,
      PatientCondition || null,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'ICU doctor visit created successfully',
      data: mapICUDoctorVisitsRow(rows[0]),
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
      message: 'Error creating ICU doctor visit',
      error: error.message,
    });
  }
};

exports.updateICUDoctorVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateICUDoctorVisitsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUAdmissionId,
      PatientId,
      DoctorId,
      DoctorVisitedDateTime,
      VisitsDetails,
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
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
      }
    }

    if (DoctorId !== undefined && DoctorId !== null) {
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(DoctorId, 10)]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'DoctorId does not exist' });
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
      updates.push(`"PatientId" = $${paramIndex++}::uuid`);
      params.push(PatientId !== null ? PatientId : null);
    }
    if (DoctorId !== undefined) {
      updates.push(`"DoctorId" = $${paramIndex++}`);
      params.push(DoctorId !== null ? parseInt(DoctorId, 10) : null);
    }
    if (DoctorVisitedDateTime !== undefined) {
      updates.push(`"DoctorVisitedDateTime" = $${paramIndex++}::timestamp`);
      params.push(DoctorVisitedDateTime);
    }
    if (VisitsDetails !== undefined) {
      updates.push(`"VisitsDetails" = $${paramIndex++}`);
      params.push(VisitsDetails);
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
      UPDATE "ICUDoctorVisits"
      SET ${updates.join(', ')}
      WHERE "ICUDoctorVisitsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU doctor visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU doctor visit updated successfully',
      data: mapICUDoctorVisitsRow(rows[0]),
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
      message: 'Error updating ICU doctor visit',
      error: error.message,
    });
  }
};

exports.deleteICUDoctorVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "ICUDoctorVisits" WHERE "ICUDoctorVisitsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU doctor visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU doctor visit deleted successfully',
      data: mapICUDoctorVisitsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ICU doctor visit',
      error: error.message,
    });
  }
};

