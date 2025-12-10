const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];

const mapICUNurseVisitVitalsRow = (row) => ({
  ICUNurseVisitVitalsId: row.ICUNurseVisitVitalsId || row.icunursevisitvitalsid,
  ICUNurseVisitsId: row.ICUNurseVisitsId || row.icunursevisitsid,
  PatientId: row.PatientId || row.patientid,
  RecordedDateTime: row.RecordedDateTime || row.recordeddatetime,
  HeartRate: row.HeartRate || row.heartrate,
  BloodPressure: row.BloodPressure || row.bloodpressure,
  Temperature: row.Temperature ? parseFloat(row.Temperature) : row.temperature ? parseFloat(row.temperature) : null,
  O2Saturation: row.O2Saturation ? parseFloat(row.O2Saturation) : row.o2saturation ? parseFloat(row.o2saturation) : null,
  RespiratoryRate: row.RespiratoryRate || row.respiratoryrate,
  PulseRate: row.PulseRate || row.pulserate,
  VitalsStatus: row.VitalsStatus || row.vitalsstatus,
  VitalsRemarks: row.VitalsRemarks || row.vitalsremarks,
  VitalsCreatedBy: row.VitalsCreatedBy || row.vitalscreatedby,
  VitalsCreatedAt: row.VitalsCreatedAt || row.vitalscreatedat,
  Status: row.Status || row.status,
});

exports.getAllICUNurseVisitVitals = async (req, res) => {
  try {
    const { status, vitalsStatus, patientId, icuNurseVisitsId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM "ICUNurseVisitVitals"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (vitalsStatus) {
      conditions.push(`"VitalsStatus" = $${params.length + 1}`);
      params.push(vitalsStatus);
    }
    if (patientId) {
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`"PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
      }
    }
    if (icuNurseVisitsId) {
      conditions.push(`"ICUNurseVisitsId" = $${params.length + 1}::uuid`);
      params.push(icuNurseVisitsId);
    }
    if (fromDate) {
      conditions.push(`"RecordedDateTime" >= $${params.length + 1}::timestamp`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`"RecordedDateTime" <= $${params.length + 1}::timestamp`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "RecordedDateTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapICUNurseVisitVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU nurse visit vitals',
      error: error.message,
    });
  }
};

exports.getICUNurseVisitVitalsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "ICUNurseVisitVitals" WHERE "ICUNurseVisitVitalsId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU nurse visit vitals not found' });
    }
    res.status(200).json({ success: true, data: mapICUNurseVisitVitalsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU nurse visit vitals',
      error: error.message,
    });
  }
};

exports.getICUNurseVisitVitalsByICUNurseVisitsId = async (req, res) => {
  try {
    const { icuNurseVisitsId } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(icuNurseVisitsId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUNurseVisitsId. Must be a valid UUID.',
      });
    }

    const { rows } = await db.query(
      `
      SELECT * FROM "ICUNurseVisitVitals"
      WHERE "ICUNurseVisitsId" = $1::uuid
      ORDER BY "RecordedDateTime" DESC
      `,
      [icuNurseVisitsId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      icuNurseVisitsId: icuNurseVisitsId,
      data: rows.map(mapICUNurseVisitVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU nurse visit vitals by ICU nurse visits ID',
      error: error.message,
    });
  }
};

const validateICUNurseVisitVitalsPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && !body.ICUNurseVisitsId) {
    errors.push('ICUNurseVisitsId is required');
  }
  if (body.ICUNurseVisitsId && typeof body.ICUNurseVisitsId !== 'string') {
    errors.push('ICUNurseVisitsId must be a valid UUID');
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

  if (requireAll && !body.RecordedDateTime) {
    errors.push('RecordedDateTime is required');
  }
  if (body.RecordedDateTime && !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/.test(body.RecordedDateTime)) {
    errors.push('RecordedDateTime must be in ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)');
  }

  if (body.HeartRate !== undefined && body.HeartRate !== null && (isNaN(body.HeartRate) || body.HeartRate < 0)) {
    errors.push('HeartRate must be a non-negative number');
  }

  if (body.BloodPressure !== undefined && body.BloodPressure !== null && typeof body.BloodPressure !== 'string') {
    errors.push('BloodPressure must be a string');
  }

  if (body.Temperature !== undefined && body.Temperature !== null && (isNaN(body.Temperature) || body.Temperature < 0)) {
    errors.push('Temperature must be a non-negative number');
  }

  if (body.O2Saturation !== undefined && body.O2Saturation !== null && (isNaN(body.O2Saturation) || body.O2Saturation < 0 || body.O2Saturation > 100)) {
    errors.push('O2Saturation must be a number between 0 and 100');
  }

  if (body.RespiratoryRate !== undefined && body.RespiratoryRate !== null && (isNaN(body.RespiratoryRate) || body.RespiratoryRate < 0)) {
    errors.push('RespiratoryRate must be a non-negative number');
  }

  if (body.PulseRate !== undefined && body.PulseRate !== null && (isNaN(body.PulseRate) || body.PulseRate < 0)) {
    errors.push('PulseRate must be a non-negative number');
  }

  if (body.VitalsStatus !== undefined && body.VitalsStatus !== null && typeof body.VitalsStatus !== 'string') {
    errors.push('VitalsStatus must be a string');
  }

  if (body.VitalsRemarks !== undefined && body.VitalsRemarks !== null && typeof body.VitalsRemarks !== 'string') {
    errors.push('VitalsRemarks must be a string');
  }

  if (body.VitalsCreatedBy !== undefined && body.VitalsCreatedBy !== null) {
    const createdByInt = parseInt(body.VitalsCreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('VitalsCreatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  return errors;
};

exports.createICUNurseVisitVitals = async (req, res) => {
  try {
    const errors = validateICUNurseVisitVitalsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUNurseVisitsId,
      PatientId,
      RecordedDateTime,
      HeartRate,
      BloodPressure,
      Temperature,
      O2Saturation,
      RespiratoryRate,
      PulseRate,
      VitalsStatus,
      VitalsRemarks,
      VitalsCreatedBy,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for ICUNurseVisitVitalsId
    const icuNurseVisitVitalsId = randomUUID();

    if (!icuNurseVisitVitalsId || typeof icuNurseVisitVitalsId !== 'string') {
      throw new Error('Failed to generate ICUNurseVisitVitalsId');
    }

    // Validate foreign key existence
    const icuNurseVisitsExists = await db.query('SELECT "ICUNurseVisitsId" FROM "ICUNurseVisits" WHERE "ICUNurseVisitsId" = $1::uuid', [ICUNurseVisitsId]);
    if (icuNurseVisitsExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'ICUNurseVisitsId does not exist' });
    }

    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [parseInt(PatientId, 10)]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }

    let createdByValue = null;
    if (VitalsCreatedBy !== undefined && VitalsCreatedBy !== null && VitalsCreatedBy !== '') {
      const createdByInt = parseInt(VitalsCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'VitalsCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'VitalsCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    }

    const insertQuery = `
      INSERT INTO "ICUNurseVisitVitals"
        ("ICUNurseVisitVitalsId", "ICUNurseVisitsId", "PatientId", "RecordedDateTime",
         "HeartRate", "BloodPressure", "Temperature", "O2Saturation", "RespiratoryRate",
         "PulseRate", "VitalsStatus", "VitalsRemarks", "VitalsCreatedBy", "Status")
      VALUES ($1::uuid, $2::uuid, $3, $4::timestamp, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      icuNurseVisitVitalsId,
      ICUNurseVisitsId,
      parseInt(PatientId, 10),
      RecordedDateTime,
      HeartRate ? parseInt(HeartRate, 10) : null,
      BloodPressure || null,
      Temperature ? parseFloat(Temperature) : null,
      O2Saturation ? parseFloat(O2Saturation) : null,
      RespiratoryRate ? parseInt(RespiratoryRate, 10) : null,
      PulseRate ? parseInt(PulseRate, 10) : null,
      VitalsStatus || null,
      VitalsRemarks || null,
      createdByValue,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'ICU nurse visit vitals created successfully',
      data: mapICUNurseVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUNurseVisitsId or PatientId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating ICU nurse visit vitals',
      error: error.message,
    });
  }
};

exports.updateICUNurseVisitVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateICUNurseVisitVitalsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUNurseVisitsId,
      PatientId,
      RecordedDateTime,
      HeartRate,
      BloodPressure,
      Temperature,
      O2Saturation,
      RespiratoryRate,
      PulseRate,
      VitalsStatus,
      VitalsRemarks,
      VitalsCreatedBy,
      Status,
    } = req.body;

    // Validate foreign key existence if provided
    if (ICUNurseVisitsId !== undefined && ICUNurseVisitsId !== null) {
      const icuNurseVisitsExists = await db.query('SELECT "ICUNurseVisitsId" FROM "ICUNurseVisits" WHERE "ICUNurseVisitsId" = $1::uuid', [ICUNurseVisitsId]);
      if (icuNurseVisitsExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUNurseVisitsId does not exist' });
      }
    }

    if (PatientId !== undefined && PatientId !== null) {
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [parseInt(PatientId, 10)]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
      }
    }

    let createdByValue = null;
    if (VitalsCreatedBy !== undefined && VitalsCreatedBy !== null && VitalsCreatedBy !== '') {
      const createdByInt = parseInt(VitalsCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'VitalsCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'VitalsCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    } else if (VitalsCreatedBy === null) {
      createdByValue = null;
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (ICUNurseVisitsId !== undefined) {
      updates.push(`"ICUNurseVisitsId" = $${paramIndex++}::uuid`);
      params.push(ICUNurseVisitsId);
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null);
    }
    if (RecordedDateTime !== undefined) {
      updates.push(`"RecordedDateTime" = $${paramIndex++}::timestamp`);
      params.push(RecordedDateTime);
    }
    if (HeartRate !== undefined) {
      updates.push(`"HeartRate" = $${paramIndex++}`);
      params.push(HeartRate !== null ? parseInt(HeartRate, 10) : null);
    }
    if (BloodPressure !== undefined) {
      updates.push(`"BloodPressure" = $${paramIndex++}`);
      params.push(BloodPressure);
    }
    if (Temperature !== undefined) {
      updates.push(`"Temperature" = $${paramIndex++}`);
      params.push(Temperature !== null ? parseFloat(Temperature) : null);
    }
    if (O2Saturation !== undefined) {
      updates.push(`"O2Saturation" = $${paramIndex++}`);
      params.push(O2Saturation !== null ? parseFloat(O2Saturation) : null);
    }
    if (RespiratoryRate !== undefined) {
      updates.push(`"RespiratoryRate" = $${paramIndex++}`);
      params.push(RespiratoryRate !== null ? parseInt(RespiratoryRate, 10) : null);
    }
    if (PulseRate !== undefined) {
      updates.push(`"PulseRate" = $${paramIndex++}`);
      params.push(PulseRate !== null ? parseInt(PulseRate, 10) : null);
    }
    if (VitalsStatus !== undefined) {
      updates.push(`"VitalsStatus" = $${paramIndex++}`);
      params.push(VitalsStatus);
    }
    if (VitalsRemarks !== undefined) {
      updates.push(`"VitalsRemarks" = $${paramIndex++}`);
      params.push(VitalsRemarks);
    }
    if (VitalsCreatedBy !== undefined) {
      updates.push(`"VitalsCreatedBy" = $${paramIndex++}`);
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
      UPDATE "ICUNurseVisitVitals"
      SET ${updates.join(', ')}
      WHERE "ICUNurseVisitVitalsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU nurse visit vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU nurse visit vitals updated successfully',
      data: mapICUNurseVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUNurseVisitsId or PatientId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating ICU nurse visit vitals',
      error: error.message,
    });
  }
};

exports.deleteICUNurseVisitVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "ICUNurseVisitVitals" WHERE "ICUNurseVisitVitalsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU nurse visit vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU nurse visit vitals deleted successfully',
      data: mapICUNurseVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ICU nurse visit vitals',
      error: error.message,
    });
  }
};

