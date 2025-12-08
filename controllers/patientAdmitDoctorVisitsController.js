const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];

const mapPatientAdmitDoctorVisitsRow = (row) => ({
  PatientAdmitDoctorVisitsId: row.PatientAdmitDoctorVisitsId || row.patientadmitdoctorvisitsid,
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
  PatientId: row.PatientId || row.patientid,
  DoctorId: row.DoctorId || row.doctorid,
  DoctorVisitedDateTime: row.DoctorVisitedDateTime || row.doctorvisiteddatetime,
  VisitsRemarks: row.VisitsRemarks || row.visitsremarks,
  PatientCondition: row.PatientCondition || row.patientcondition,
  Status: row.Status || row.status,
  VisitCreatedBy: row.VisitCreatedBy || row.visitcreatedby,
  VisitCreatedAt: row.VisitCreatedAt || row.visitcreatedat,
});

exports.getAllPatientAdmitDoctorVisits = async (req, res) => {
  try {
    const { status, patientId, doctorId, roomAdmissionId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM "PatientAdmitDoctorVisits"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (patientId) {
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`"PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
      }
    }
    if (doctorId) {
      conditions.push(`"DoctorId" = $${params.length + 1}::uuid`);
      params.push(doctorId);
    }
    if (roomAdmissionId) {
      conditions.push(`"RoomAdmissionId" = $${params.length + 1}::uuid`);
      params.push(roomAdmissionId);
    }
    if (fromDate) {
      conditions.push(`"DoctorVisitedDateTime" >= $${params.length + 1}::timestamp`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`"DoctorVisitedDateTime" <= $${params.length + 1}::timestamp`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "DoctorVisitedDateTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientAdmitDoctorVisitsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit doctor visits',
      error: error.message,
    });
  }
};

exports.getPatientAdmitDoctorVisitsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "PatientAdmitDoctorVisits" WHERE "PatientAdmitDoctorVisitsId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit doctor visit not found' });
    }
    res.status(200).json({ success: true, data: mapPatientAdmitDoctorVisitsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit doctor visit',
      error: error.message,
    });
  }
};

/**
 * Get Patient Admit Doctor Visits by RoomAdmissionId
 * Returns all doctor visits for a specific room admission
 * Path parameter: roomAdmissionId (required)
 */
exports.getPatientAdmitDoctorVisitsByRoomAdmissionId = async (req, res) => {
  try {
    const { id } = req.params;
    const roomAdmissionId = parseInt(id, 10);
    
    if (isNaN(roomAdmissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId. Must be an integer.'
      });
    }
    
    const query = `
      SELECT * 
      FROM "PatientAdmitDoctorVisits" 
      WHERE "RoomAdmissionId" = $1
      ORDER BY "DoctorVisitedDateTime" DESC
    `;
    
    const { rows } = await db.query(query, [roomAdmissionId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No doctor visits found for RoomAdmissionId ${roomAdmissionId}`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Doctor visits retrieved successfully for RoomAdmissionId ${roomAdmissionId}`,
      count: rows.length,
      roomAdmissionId: roomAdmissionId,
      data: rows.map(mapPatientAdmitDoctorVisitsRow)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit doctor visits by RoomAdmissionId',
      error: error.message,
    });
  }
};

const validatePatientAdmitDoctorVisitsPayload = (body, requireAll = true) => {
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

  if (requireAll && !body.DoctorId) {
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

  if (body.VisitsRemarks !== undefined && body.VisitsRemarks !== null && typeof body.VisitsRemarks !== 'string') {
    errors.push('VisitsRemarks must be a string');
  }

  if (body.PatientCondition !== undefined && body.PatientCondition !== null && typeof body.PatientCondition !== 'string') {
    errors.push('PatientCondition must be a string');
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.VisitCreatedBy && typeof body.VisitCreatedBy !== 'string') {
    errors.push('VisitCreatedBy must be a valid UUID');
  }

  return errors;
};

exports.createPatientAdmitDoctorVisits = async (req, res) => {
  try {
    const errors = validatePatientAdmitDoctorVisitsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomAdmissionId,
      PatientId,
      DoctorId,
      DoctorVisitedDateTime,
      VisitsRemarks,
      PatientCondition,
      VisitCreatedBy,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for PatientAdmitDoctorVisitsId
    const patientAdmitDoctorVisitsId = randomUUID();

    if (!patientAdmitDoctorVisitsId || typeof patientAdmitDoctorVisitsId !== 'string') {
      throw new Error('Failed to generate PatientAdmitDoctorVisitsId');
    }

    // Validate foreign key existence
    if (RoomAdmissionId !== undefined && RoomAdmissionId !== null) {
      const roomAdmissionExists = await db.query('SELECT "RoomAdmissionId" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1', [parseInt(RoomAdmissionId, 10)]);
      if (roomAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'RoomAdmissionId does not exist' });
      }
    }

    const insertQuery = `
      INSERT INTO "PatientAdmitDoctorVisits"
        ("PatientAdmitDoctorVisitsId", "RoomAdmissionId", "PatientId", "DoctorId",
         "DoctorVisitedDateTime", "VisitsRemarks", "PatientCondition", "VisitCreatedBy", "Status")
      VALUES ($1::uuid, $2, $3::uuid, $4, $5::timestamp, $6, $7, $8, $9)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      patientAdmitDoctorVisitsId,
      RoomAdmissionId ? parseInt(RoomAdmissionId, 10) : null,
      PatientId, // UUID
      parseInt(DoctorId, 10),
      DoctorVisitedDateTime,
      VisitsRemarks || null,
      PatientCondition || null,
      VisitCreatedBy ? parseInt(VisitCreatedBy, 10) : null,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient admit doctor visit created successfully',
      data: mapPatientAdmitDoctorVisitsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId, PatientId, or DoctorId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating patient admit doctor visit',
      error: error.message,
    });
  }
};

exports.updatePatientAdmitDoctorVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validatePatientAdmitDoctorVisitsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomAdmissionId,
      PatientId,
      DoctorId,
      DoctorVisitedDateTime,
      VisitsRemarks,
      PatientCondition,
      VisitCreatedBy,
      Status,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (RoomAdmissionId !== undefined) {
      if (RoomAdmissionId !== null) {
        const roomAdmissionIdInt = parseInt(RoomAdmissionId, 10);
        if (isNaN(roomAdmissionIdInt)) {
          return res.status(400).json({ success: false, message: 'RoomAdmissionId must be a valid integer' });
        }
        // Validate RoomAdmission exists
        const roomAdmissionExists = await db.query('SELECT "RoomAdmissionId" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1', [roomAdmissionIdInt]);
        if (roomAdmissionExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'RoomAdmissionId does not exist' });
        }
        updates.push(`"RoomAdmissionId" = $${paramIndex++}`);
        params.push(roomAdmissionIdInt);
      } else {
        updates.push(`"RoomAdmissionId" = $${paramIndex++}`);
        params.push(null);
      }
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null);
    }
    if (DoctorId !== undefined) {
      updates.push(`"DoctorId" = $${paramIndex++}::uuid`);
      params.push(DoctorId);
    }
    if (DoctorVisitedDateTime !== undefined) {
      updates.push(`"DoctorVisitedDateTime" = $${paramIndex++}::timestamp`);
      params.push(DoctorVisitedDateTime);
    }
    if (VisitsRemarks !== undefined) {
      updates.push(`"VisitsRemarks" = $${paramIndex++}`);
      params.push(VisitsRemarks);
    }
    if (PatientCondition !== undefined) {
      updates.push(`"PatientCondition" = $${paramIndex++}`);
      params.push(PatientCondition);
    }
    if (VisitCreatedBy !== undefined) {
      updates.push(`"VisitCreatedBy" = $${paramIndex++}::uuid`);
      params.push(VisitCreatedBy);
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
      UPDATE "PatientAdmitDoctorVisits"
      SET ${updates.join(', ')}
      WHERE "PatientAdmitDoctorVisitsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit doctor visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient admit doctor visit updated successfully',
      data: mapPatientAdmitDoctorVisitsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId, PatientId, or DoctorId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient admit doctor visit',
      error: error.message,
    });
  }
};

exports.deletePatientAdmitDoctorVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "PatientAdmitDoctorVisits" WHERE "PatientAdmitDoctorVisitsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit doctor visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient admit doctor visit deleted successfully',
      data: mapPatientAdmitDoctorVisitsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient admit doctor visit',
      error: error.message,
    });
  }
};

