const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];
const allowedVitalsStatus = ['Stable', 'Critical', 'Improving'];

const mapEmergencyAdmissionVitalsRow = (row) => ({
  EmergencyAdmissionVitalsId: row.EmergencyAdmissionVitalsId || row.emergencyadmissionvitalsid,
  EmergencyAdmissionId: row.EmergencyAdmissionId || row.emergencyadmissionid,
  NurseId: row.NurseId || row.nurseid,
  RecordedDateTime: row.RecordedDateTime || row.recordeddatetime,
  HeartRate: row.HeartRate || row.heartrate,
  BloodPressure: row.BloodPressure || row.bloodpressure,
  Temperature: row.Temperature || row.temperature,
  O2Saturation: row.O2Saturation || row.o2saturation,
  RespiratoryRate: row.RespiratoryRate || row.respiratoryrate,
  PulseRate: row.PulseRate || row.pulserate,
  VitalsStatus: row.VitalsStatus || row.vitalsstatus,
  VitalsRemarks: row.VitalsRemarks || row.vitalsremarks,
  VitalsCreatedBy: row.VitalsCreatedBy || row.vitalscreatedby,
  VitalsCreatedAt: row.VitalsCreatedAt || row.vitalscreatedat,
  Status: row.Status || row.status,
});

exports.getAllEmergencyAdmissionVitals = async (req, res) => {
  try {
    const { status, emergencyAdmissionId, nurseId, vitalsStatus } = req.query;
    let query = 'SELECT * FROM "EmergencyAdmissionVitals"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (emergencyAdmissionId) {
      const emergencyAdmissionIdInt = parseInt(emergencyAdmissionId, 10);
      if (!isNaN(emergencyAdmissionIdInt)) {
        conditions.push(`"EmergencyAdmissionId" = $${params.length + 1}`);
        params.push(emergencyAdmissionIdInt);
      }
    }
    if (nurseId) {
      const nurseIdInt = parseInt(nurseId, 10);
      if (!isNaN(nurseIdInt)) {
        conditions.push(`"NurseId" = $${params.length + 1}`);
        params.push(nurseIdInt);
      }
    }
    if (vitalsStatus) {
      conditions.push(`"VitalsStatus" = $${params.length + 1}`);
      params.push(vitalsStatus);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "RecordedDateTime" DESC, "VitalsCreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapEmergencyAdmissionVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admission vitals',
      error: error.message,
    });
  }
};

exports.getEmergencyAdmissionVitalsById = async (req, res) => {
  try {
    const { id } = req.params;
    const vitalsId = parseInt(id, 10);
    if (isNaN(vitalsId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyAdmissionVitalsId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "EmergencyAdmissionVitals" WHERE "EmergencyAdmissionVitalsId" = $1',
      [vitalsId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission vitals not found' });
    }
    res.status(200).json({ success: true, data: mapEmergencyAdmissionVitalsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admission vitals',
      error: error.message,
    });
  }
};

exports.getEmergencyAdmissionVitalsByEmergencyAdmissionId = async (req, res) => {
  try {
    const { emergencyAdmissionId } = req.params;
    const emergencyAdmissionIdInt = parseInt(emergencyAdmissionId, 10);
    if (isNaN(emergencyAdmissionIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyAdmissionId. Must be an integer.',
      });
    }

    const query = `
      SELECT * FROM "EmergencyAdmissionVitals"
      WHERE "EmergencyAdmissionId" = $1
      ORDER BY "RecordedDateTime" DESC, "VitalsCreatedAt" DESC
    `;

    const { rows } = await db.query(query, [emergencyAdmissionIdInt]);

    res.status(200).json({
      success: true,
      count: rows.length,
      emergencyAdmissionId: emergencyAdmissionIdInt,
      data: rows.map(mapEmergencyAdmissionVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency admission vitals by emergency admission ID',
      error: error.message,
    });
  }
};

const validateEmergencyAdmissionVitalsPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && body.EmergencyAdmissionId === undefined) {
    errors.push('EmergencyAdmissionId is required');
  }
  if (body.EmergencyAdmissionId !== undefined && body.EmergencyAdmissionId !== null) {
    const emergencyAdmissionIdInt = parseInt(body.EmergencyAdmissionId, 10);
    if (isNaN(emergencyAdmissionIdInt)) {
      errors.push('EmergencyAdmissionId must be a valid integer');
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

  if (requireAll && !body.RecordedDateTime) {
    errors.push('RecordedDateTime is required');
  }
  if (body.RecordedDateTime && !/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/.test(body.RecordedDateTime)) {
    errors.push('RecordedDateTime must be in YYYY-MM-DD HH:MM:SS format');
  }

  if (body.HeartRate !== undefined && body.HeartRate !== null && (isNaN(body.HeartRate) || body.HeartRate < 0)) {
    errors.push('HeartRate must be a non-negative integer');
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
    errors.push('RespiratoryRate must be a non-negative integer');
  }

  if (body.PulseRate !== undefined && body.PulseRate !== null && (isNaN(body.PulseRate) || body.PulseRate < 0)) {
    errors.push('PulseRate must be a non-negative integer');
  }

  if (body.VitalsStatus !== undefined && body.VitalsStatus !== null) {
    if (typeof body.VitalsStatus !== 'string') {
      errors.push('VitalsStatus must be a string');
    } else if (!allowedVitalsStatus.includes(body.VitalsStatus)) {
      errors.push('VitalsStatus must be one of: Stable, Critical, Improving');
    }
  }

  if (body.VitalsRemarks !== undefined && body.VitalsRemarks !== null && typeof body.VitalsRemarks !== 'string') {
    errors.push('VitalsRemarks must be a string');
  }

  if (body.VitalsCreatedBy !== undefined && body.VitalsCreatedBy !== null) {
    const vitalsCreatedByInt = parseInt(body.VitalsCreatedBy, 10);
    if (isNaN(vitalsCreatedByInt)) {
      errors.push('VitalsCreatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  return errors;
};

exports.createEmergencyAdmissionVitals = async (req, res) => {
  try {
    const errors = validateEmergencyAdmissionVitalsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      EmergencyAdmissionId,
      NurseId,
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

    const insertQuery = `
      INSERT INTO "EmergencyAdmissionVitals"
        ("EmergencyAdmissionId", "NurseId", "RecordedDateTime", "HeartRate", "BloodPressure",
         "Temperature", "O2Saturation", "RespiratoryRate", "PulseRate", "VitalsStatus",
         "VitalsRemarks", "VitalsCreatedBy", "Status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      parseInt(EmergencyAdmissionId, 10),
      parseInt(NurseId, 10),
      RecordedDateTime,
      HeartRate ? parseInt(HeartRate, 10) : null,
      BloodPressure || null,
      Temperature ? parseFloat(Temperature) : null,
      O2Saturation ? parseFloat(O2Saturation) : null,
      RespiratoryRate ? parseInt(RespiratoryRate, 10) : null,
      PulseRate ? parseInt(PulseRate, 10) : null,
      VitalsStatus || null,
      VitalsRemarks || null,
      VitalsCreatedBy ? parseInt(VitalsCreatedBy, 10) : null,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Emergency admission vitals created successfully',
      data: mapEmergencyAdmissionVitalsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyAdmissionId or NurseId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating emergency admission vitals',
      error: error.message,
    });
  }
};

exports.updateEmergencyAdmissionVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateEmergencyAdmissionVitalsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      EmergencyAdmissionId,
      NurseId,
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

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (EmergencyAdmissionId !== undefined) {
      updates.push(`"EmergencyAdmissionId" = $${paramIndex++}`);
      params.push(EmergencyAdmissionId !== null ? parseInt(EmergencyAdmissionId, 10) : null);
    }
    if (NurseId !== undefined) {
      updates.push(`"NurseId" = $${paramIndex++}`);
      params.push(NurseId !== null ? parseInt(NurseId, 10) : null);
    }
    if (RecordedDateTime !== undefined) {
      updates.push(`"RecordedDateTime" = $${paramIndex++}`);
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
      params.push(VitalsCreatedBy !== null ? parseInt(VitalsCreatedBy, 10) : null);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const vitalsId = parseInt(id, 10);
    if (isNaN(vitalsId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyAdmissionVitalsId. Must be an integer.' 
      });
    }
    
    params.push(vitalsId);
    const updateQuery = `
      UPDATE "EmergencyAdmissionVitals"
      SET ${updates.join(', ')}
      WHERE "EmergencyAdmissionVitalsId" = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency admission vitals updated successfully',
      data: mapEmergencyAdmissionVitalsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyAdmissionId or NurseId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating emergency admission vitals',
      error: error.message,
    });
  }
};

exports.deleteEmergencyAdmissionVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const vitalsId = parseInt(id, 10);
    if (isNaN(vitalsId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyAdmissionVitalsId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "EmergencyAdmissionVitals" WHERE "EmergencyAdmissionVitalsId" = $1 RETURNING *',
      [vitalsId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency admission vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency admission vitals deleted successfully',
      data: mapEmergencyAdmissionVitalsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting emergency admission vitals',
      error: error.message,
    });
  }
};

