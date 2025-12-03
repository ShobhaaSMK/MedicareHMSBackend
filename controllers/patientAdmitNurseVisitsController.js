const db = require('../db');
const { randomUUID } = require('crypto');

const allowedPatientStatus = ['Stable', 'NotStable'];
const allowedStatus = ['Active', 'Inactive'];

const mapPatientAdmitNurseVisitsRow = (row) => ({
  PatientAdmitNurseVisitsId: row.PatientAdmitNurseVisitsId || row.patientadmitnursevisitsid,
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid,
  PatientId: row.PatientId || row.patientid,
  VisitDate: row.VisitDate || row.visitdate,
  VisitTime: row.VisitTime || row.visittime,
  PatientStatus: row.PatientStatus || row.patientstatus,
  SupervisionDetails: row.SupervisionDetails || row.supervisiondetails,
  Remarks: row.Remarks || row.remarks,
  Status: row.Status || row.status,
  RoomVisitsCreatedAt: row.RoomVisitsCreatedAt || row.roomvisitscreatedat,
  RoomVisitsCreatedBy: row.RoomVisitsCreatedBy || row.roomvisitscreatedby,
});

exports.getAllPatientAdmitNurseVisits = async (req, res) => {
  try {
    const { status, patientStatus, patientId, roomAdmissionId, visitDate } = req.query;
    let query = 'SELECT * FROM "PatientAdmitNurseVisits"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (patientStatus) {
      conditions.push(`"PatientStatus" = $${params.length + 1}`);
      params.push(patientStatus);
    }
    if (patientId) {
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`"PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
      }
    }
    if (roomAdmissionId) {
      conditions.push(`"RoomAdmissionId" = $${params.length + 1}::uuid`);
      params.push(roomAdmissionId);
    }
    if (visitDate) {
      conditions.push(`"VisitDate" = $${params.length + 1}::date`);
      params.push(visitDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "VisitDate" DESC, "VisitTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientAdmitNurseVisitsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit nurse visits',
      error: error.message,
    });
  }
};

exports.getPatientAdmitNurseVisitsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "PatientAdmitNurseVisits" WHERE "PatientAdmitNurseVisitsId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit nurse visit not found' });
    }
    res.status(200).json({ success: true, data: mapPatientAdmitNurseVisitsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit nurse visit',
      error: error.message,
    });
  }
};

const validatePatientAdmitNurseVisitsPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && !body.RoomAdmissionId) {
    errors.push('RoomAdmissionId is required');
  }
  if (body.RoomAdmissionId && typeof body.RoomAdmissionId !== 'string') {
    errors.push('RoomAdmissionId must be a valid UUID');
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

  if (requireAll && !body.VisitDate) {
    errors.push('VisitDate is required');
  }
  if (body.VisitDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.VisitDate)) {
    errors.push('VisitDate must be in YYYY-MM-DD format');
  }

  if (body.VisitTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.VisitTime)) {
    errors.push('VisitTime must be in HH:MM or HH:MM:SS format');
  }

  if (body.PatientStatus && !allowedPatientStatus.includes(body.PatientStatus)) {
    errors.push('PatientStatus must be Stable or NotStable');
  }

  if (body.SupervisionDetails !== undefined && body.SupervisionDetails !== null && typeof body.SupervisionDetails !== 'string') {
    errors.push('SupervisionDetails must be a string');
  }

  if (body.Remarks !== undefined && body.Remarks !== null && typeof body.Remarks !== 'string') {
    errors.push('Remarks must be a string');
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.RoomVisitsCreatedBy && typeof body.RoomVisitsCreatedBy !== 'string') {
    errors.push('RoomVisitsCreatedBy must be a valid UUID');
  }

  return errors;
};

exports.createPatientAdmitNurseVisits = async (req, res) => {
  try {
    const errors = validatePatientAdmitNurseVisitsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomAdmissionId,
      PatientId,
      VisitDate,
      VisitTime,
      PatientStatus,
      SupervisionDetails,
      Remarks,
      RoomVisitsCreatedBy,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for PatientAdmitNurseVisitsId
    const patientAdmitNurseVisitsId = randomUUID();

    if (!patientAdmitNurseVisitsId || typeof patientAdmitNurseVisitsId !== 'string') {
      throw new Error('Failed to generate PatientAdmitNurseVisitsId');
    }

    const insertQuery = `
      INSERT INTO "PatientAdmitNurseVisits"
        ("PatientAdmitNurseVisitsId", "RoomAdmissionId", "PatientId", "VisitDate", "VisitTime",
         "PatientStatus", "SupervisionDetails", "Remarks", "RoomVisitsCreatedBy", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      patientAdmitNurseVisitsId,
      RoomAdmissionId,
      parseInt(PatientId, 10),
      VisitDate,
      VisitTime || null,
      PatientStatus || null,
      SupervisionDetails || null,
      Remarks || null,
      RoomVisitsCreatedBy || null,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient admit nurse visit created successfully',
      data: mapPatientAdmitNurseVisitsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId or PatientId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating patient admit nurse visit',
      error: error.message,
    });
  }
};

exports.updatePatientAdmitNurseVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validatePatientAdmitNurseVisitsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomAdmissionId,
      PatientId,
      VisitDate,
      VisitTime,
      PatientStatus,
      SupervisionDetails,
      Remarks,
      RoomVisitsCreatedBy,
      Status,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (RoomAdmissionId !== undefined) {
      updates.push(`"RoomAdmissionId" = $${paramIndex++}::uuid`);
      params.push(RoomAdmissionId);
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null);
    }
    if (VisitDate !== undefined) {
      updates.push(`"VisitDate" = $${paramIndex++}`);
      params.push(VisitDate);
    }
    if (VisitTime !== undefined) {
      updates.push(`"VisitTime" = $${paramIndex++}`);
      params.push(VisitTime);
    }
    if (PatientStatus !== undefined) {
      updates.push(`"PatientStatus" = $${paramIndex++}`);
      params.push(PatientStatus);
    }
    if (SupervisionDetails !== undefined) {
      updates.push(`"SupervisionDetails" = $${paramIndex++}`);
      params.push(SupervisionDetails);
    }
    if (Remarks !== undefined) {
      updates.push(`"Remarks" = $${paramIndex++}`);
      params.push(Remarks);
    }
    if (RoomVisitsCreatedBy !== undefined) {
      updates.push(`"RoomVisitsCreatedBy" = $${paramIndex++}::uuid`);
      params.push(RoomVisitsCreatedBy);
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
      UPDATE "PatientAdmitNurseVisits"
      SET ${updates.join(', ')}
      WHERE "PatientAdmitNurseVisitsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit nurse visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient admit nurse visit updated successfully',
      data: mapPatientAdmitNurseVisitsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId or PatientId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient admit nurse visit',
      error: error.message,
    });
  }
};

exports.deletePatientAdmitNurseVisits = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "PatientAdmitNurseVisits" WHERE "PatientAdmitNurseVisitsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit nurse visit not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient admit nurse visit deleted successfully',
      data: mapPatientAdmitNurseVisitsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient admit nurse visit',
      error: error.message,
    });
  }
};

