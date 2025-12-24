const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];
const allowedPatientCondition = ['Stable', 'Notstable'];
const allowedDailyOrHourlyVitals = ['Daily', 'Hourly', 'Daily Vitals', 'Hourly Vitals'];

const mapICUVisitVitalsRow = (row) => ({
  ICUVisitVitalsId: row.ICUVisitVitalsId || row.icuvisitvitalsid,
  ICUAdmissionId: row.ICUAdmissionId || row.icuadmissionid,
  PatientId: row.PatientId || row.patientid,
  NurseId: row.NurseId || row.nurseid,
  NurseVisitsDetails: row.NurseVisitsDetails || row.nursevisitsdetails,
  PatientCondition: row.PatientCondition || row.patientcondition,
  DailyOrHourlyVitals: row.DailyOrHourlyVitals || row.dailyorhourlyvitals,
  RecordedDateTime: row.RecordedDateTime || row.recordeddatetime,
  HeartRate: row.HeartRate !== undefined && row.HeartRate !== null ? parseInt(row.HeartRate, 10) 
    : (row.heartrate !== undefined && row.heartrate !== null ? parseInt(row.heartrate, 10) : null),
  BloodPressure: row.BloodPressure || row.bloodpressure,
  Temperature: row.Temperature !== undefined && row.Temperature !== null ? parseInt(row.Temperature, 10)
    : (row.temperature !== undefined && row.temperature !== null ? parseInt(row.temperature, 10) : null),
  O2Saturation: row.O2Saturation !== undefined && row.O2Saturation !== null ? parseInt(row.O2Saturation, 10)
    : (row.o2saturation !== undefined && row.o2saturation !== null ? parseInt(row.o2saturation, 10) : null),
  RespiratoryRate: row.RespiratoryRate !== undefined && row.RespiratoryRate !== null ? parseInt(row.RespiratoryRate, 10)
    : (row.respiratoryrate !== undefined && row.respiratoryrate !== null ? parseInt(row.respiratoryrate, 10) : null),
  PulseRate: row.PulseRate !== undefined && row.PulseRate !== null ? parseInt(row.PulseRate, 10)
    : (row.pulserate !== undefined && row.pulserate !== null ? parseInt(row.pulserate, 10) : null),
  VitalsStatus: row.VitalsStatus || row.vitalsstatus,
  VitalsRemarks: row.VitalsRemarks || row.vitalsremarks,
  VitalsCreatedBy: row.VitalsCreatedBy || row.vitalscreatedby,
  VitalsCreatedAt: row.VitalsCreatedAt || row.vitalscreatedat,
  Status: row.Status || row.status,
  NurseName: row.NurseName || row.nursename || null,
});

exports.getAllICUVisitVitals = async (req, res) => {
  try {
    // #region agent log
    console.log('=== GET ALL ICU VISIT VITALS API CALL ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Query Params:', JSON.stringify(req.query, null, 2));
    // #endregion

    const { status, vitalsStatus, patientId, icuAdmissionId, nurseId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM "ICUVisitVitals"';
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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(patientId)) {
        conditions.push(`"PatientId" = $${params.length + 1}::uuid`);
        params.push(patientId);
      }
    }
    if (icuAdmissionId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(icuAdmissionId)) {
        conditions.push(`"ICUAdmissionId" = $${params.length + 1}::uuid`);
        params.push(icuAdmissionId);
      }
    }
    if (nurseId) {
      const nurseIdInt = parseInt(nurseId, 10);
      if (!isNaN(nurseIdInt)) {
        conditions.push(`"NurseId" = $${params.length + 1}`);
        params.push(nurseIdInt);
      }
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

    console.log('Final Query:', query);
    console.log('Query Params:', params);
    const { rows } = await db.query(query, params);
    console.log('✓ Query successful, rows returned:', rows.length);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapICUVisitVitalsRow),
    });
    console.log('✓ Response sent successfully (200)');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU visit vitals',
      error: error.message,
    });
  }
};

exports.getICUVisitVitalsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "ICUVisitVitals" WHERE "ICUVisitVitalsId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU visit vitals not found' });
    }
    res.status(200).json({ success: true, data: mapICUVisitVitalsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU visit vitals',
      error: error.message,
    });
  }
};

exports.getICUVisitVitalsByICUAdmissionId = async (req, res) => {
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
      SELECT * FROM "ICUVisitVitals"
      WHERE "ICUAdmissionId" = $1::uuid
      ORDER BY "RecordedDateTime" DESC
      `,
      [icuAdmissionId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      icuAdmissionId: icuAdmissionId,
      data: rows.map(mapICUVisitVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU visit vitals by ICU admission ID',
      error: error.message,
    });
  }
};

exports.getLatestICUVisitVitalsByICUAdmissionId = async (req, res) => {
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
        ivv.*,
        u."UserName" AS "NurseName"
      FROM "ICUVisitVitals" ivv
      LEFT JOIN "Users" u ON ivv."NurseId" = u."UserId"
      WHERE ivv."ICUAdmissionId" = $1::uuid
      ORDER BY ivv."RecordedDateTime" DESC
      LIMIT 1
      `,
      [icuAdmissionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ICU visit vitals found for the given ICU admission ID',
        icuAdmissionId: icuAdmissionId,
      });
    }

    res.status(200).json({
      success: true,
      icuAdmissionId: icuAdmissionId,
      data: mapICUVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching latest ICU visit vitals by ICU admission ID',
      error: error.message,
    });
  }
};

const validateICUVisitVitalsPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && !body.ICUAdmissionId) {
    errors.push('ICUAdmissionId is required');
  }
  if (body.ICUAdmissionId && typeof body.ICUAdmissionId !== 'string') {
    errors.push('ICUAdmissionId must be a valid UUID');
  }

  if (requireAll && !body.PatientId) {
    errors.push('PatientId is required');
  }
  if (body.PatientId && typeof body.PatientId !== 'string') {
    errors.push('PatientId must be a valid UUID');
  }

  if (body.NurseId !== undefined && body.NurseId !== null) {
    const nurseIdInt = parseInt(body.NurseId, 10);
    if (isNaN(nurseIdInt)) {
      errors.push('NurseId must be a valid integer');
    }
  }

  if (body.NurseVisitsDetails !== undefined && body.NurseVisitsDetails !== null && typeof body.NurseVisitsDetails !== 'string') {
    errors.push('NurseVisitsDetails must be a string');
  }

  if (body.PatientCondition !== undefined && body.PatientCondition !== null) {
    if (typeof body.PatientCondition !== 'string') {
      errors.push('PatientCondition must be a string');
    } else if (!allowedPatientCondition.includes(body.PatientCondition)) {
      errors.push('PatientCondition must be Stable or Notstable');
    }
  }

  if (body.DailyOrHourlyVitals !== undefined && body.DailyOrHourlyVitals !== null) {
    if (typeof body.DailyOrHourlyVitals !== 'string') {
      errors.push('DailyOrHourlyVitals must be a string');
    } else if (!allowedDailyOrHourlyVitals.includes(body.DailyOrHourlyVitals)) {
      errors.push('DailyOrHourlyVitals must be Daily or Hourly');
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

  if (body.O2Saturation !== undefined && body.O2Saturation !== null && (isNaN(body.O2Saturation) || body.O2Saturation < 0)) {
    errors.push('O2Saturation must be a non-negative number');
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

exports.createICUVisitVitals = async (req, res) => {
  try {
    // #region agent log
    console.log('=== CREATE ICU VISIT VITALS API CALL ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.originalUrl);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    // #endregion

    const errors = validateICUVisitVitalsPayload(req.body, true);
    
    // #region agent log
    console.log('Validation Errors:', errors.length > 0 ? errors : 'None');
    // #endregion

    if (errors.length > 0) {
      console.log('✗ Validation failed, returning 400');
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUAdmissionId,
      PatientId,
      NurseId,
      NurseVisitsDetails,
      PatientCondition,
      DailyOrHourlyVitals,
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

    // Generate random UUID for ICUVisitVitalsId
    const icuVisitVitalsId = randomUUID();
    console.log('Generated ICUVisitVitalsId:', icuVisitVitalsId);

    if (!icuVisitVitalsId || typeof icuVisitVitalsId !== 'string') {
      throw new Error('Failed to generate ICUVisitVitalsId');
    }

    // Validate foreign key existence
    console.log('Validating ICUAdmissionId:', ICUAdmissionId);
    const icuAdmissionExists = await db.query('SELECT "PatientICUAdmissionId" FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid', [ICUAdmissionId]);
    console.log('ICUAdmission exists:', icuAdmissionExists.rows.length > 0);
    if (icuAdmissionExists.rows.length === 0) {
      console.log('✗ ICUAdmissionId does not exist');
      return res.status(400).json({ success: false, message: 'ICUAdmissionId does not exist' });
    }

    console.log('Validating PatientId:', PatientId);
    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
    console.log('Patient exists:', patientExists.rows.length > 0);
    if (patientExists.rows.length === 0) {
      console.log('✗ PatientId does not exist');
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }

    // Validate foreign key existence for NurseId if provided
    let nurseIdValue = null;
    console.log('NurseId provided:', NurseId !== undefined && NurseId !== null && NurseId !== '');
    if (NurseId !== undefined && NurseId !== null && NurseId !== '') {
      const nurseIdInt = parseInt(NurseId, 10);
      console.log('Parsed NurseId:', nurseIdInt);
      if (isNaN(nurseIdInt)) {
        console.log('✗ NurseId is not a valid integer');
        return res.status(400).json({ success: false, message: 'NurseId must be a valid integer.' });
      }
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [nurseIdInt]);
      console.log('Nurse exists:', nurseExists.rows.length > 0);
      if (nurseExists.rows.length === 0) {
        console.log('✗ NurseId does not exist');
        return res.status(400).json({ success: false, message: 'NurseId does not exist.' });
      }
      nurseIdValue = nurseIdInt;
    } else {
      console.log('NurseId not provided, using null');
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

    // Normalize DailyOrHourlyVitals to database format
    let dailyOrHourlyVitalsValue = null;
    if (DailyOrHourlyVitals !== undefined && DailyOrHourlyVitals !== null && DailyOrHourlyVitals !== '') {
      const trimmed = String(DailyOrHourlyVitals).trim();
      // Normalize to database format: 'Daily' -> 'Daily Vitals', 'Hourly' -> 'Hourly Vitals'
      if (trimmed === 'Daily' || trimmed === 'Daily Vitals') {
        dailyOrHourlyVitalsValue = 'Daily Vitals'; // Database format
      } else if (trimmed === 'Hourly' || trimmed === 'Hourly Vitals') {
        dailyOrHourlyVitalsValue = 'Hourly Vitals'; // Database format
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `DailyOrHourlyVitals must be 'Daily', 'Hourly', 'Daily Vitals', or 'Hourly Vitals' (case-sensitive). Received: "${DailyOrHourlyVitals}"` 
        });
      }
    }

    const insertQuery = `
      INSERT INTO "ICUVisitVitals"
        ("ICUVisitVitalsId", "ICUAdmissionId", "PatientId", "NurseId", "NurseVisitsDetails", "PatientCondition", "DailyOrHourlyVitals",
         "RecordedDateTime", "HeartRate", "BloodPressure", "Temperature", "O2Saturation", "RespiratoryRate",
         "PulseRate", "VitalsStatus", "VitalsRemarks", "VitalsCreatedBy", "Status")
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::timestamp, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;

    const insertParams = [
      icuVisitVitalsId,
      ICUAdmissionId,
      PatientId,
      nurseIdValue,
      NurseVisitsDetails || null,
      PatientCondition || null,
      dailyOrHourlyVitalsValue,
      RecordedDateTime,
      HeartRate ? parseInt(HeartRate, 10) : null,
      BloodPressure || null,
      Temperature ? parseInt(Temperature, 10) : null,
      O2Saturation ? parseInt(O2Saturation, 10) : null,
      RespiratoryRate ? parseInt(RespiratoryRate, 10) : null,
      PulseRate ? parseInt(PulseRate, 10) : null,
      VitalsStatus || null,
      VitalsRemarks || null,
      createdByValue,
      Status,
    ];
    
    console.log('Executing INSERT query');
    console.log('Query:', insertQuery);
    console.log('Params:', JSON.stringify(insertParams, null, 2));
    const { rows } = await db.query(insertQuery, insertParams);
    console.log('✓ INSERT successful, rows returned:', rows.length);
    console.log('Created record:', JSON.stringify(mapICUVisitVitalsRow(rows[0]), null, 2));

    res.status(201).json({
      success: true,
      message: 'ICU visit vitals created successfully',
      data: mapICUVisitVitalsRow(rows[0]),
    });
    console.log('✓ Response sent successfully (201)');
  } catch (error) {
    console.error('✗ ERROR in createICUVisitVitals:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    if (error.code === '23503') {
      console.log('Foreign key constraint violation');
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUAdmissionId, PatientId, or NurseId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating ICU visit vitals',
      error: error.message,
    });
  }
};

exports.updateICUVisitVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateICUVisitVitalsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUAdmissionId,
      PatientId,
      NurseId,
      NurseVisitsDetails,
      PatientCondition,
      DailyOrHourlyVitals,
      RecordedDateTime,
      HeartRate,
      BloodPressure,
      Temperature,
      O2Saturation,
      BloodSugar,
      RespiratoryRate,
      PulseRate,
      VitalsStatus,
      VitalsRemarks,
      VitalsCreatedBy,
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

    if (NurseId !== undefined && NurseId !== null) {
      const nurseIdInt = parseInt(NurseId, 10);
      if (isNaN(nurseIdInt)) {
        return res.status(400).json({ success: false, message: 'NurseId must be a valid integer.' });
      }
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [nurseIdInt]);
      if (nurseExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'NurseId does not exist.' });
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

    if (ICUAdmissionId !== undefined) {
      updates.push(`"ICUAdmissionId" = $${paramIndex++}::uuid`);
      params.push(ICUAdmissionId);
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}::uuid`);
      params.push(PatientId);
    }
    if (NurseId !== undefined) {
      updates.push(`"NurseId" = $${paramIndex++}`);
      params.push(NurseId !== null ? parseInt(NurseId, 10) : null);
    }
    if (NurseVisitsDetails !== undefined) {
      updates.push(`"NurseVisitsDetails" = $${paramIndex++}`);
      params.push(NurseVisitsDetails);
    }
    if (PatientCondition !== undefined) {
      updates.push(`"PatientCondition" = $${paramIndex++}`);
      params.push(PatientCondition);
    }
    if (DailyOrHourlyVitals !== undefined) {
      updates.push(`"DailyOrHourlyVitals" = $${paramIndex++}`);
      params.push(DailyOrHourlyVitals);
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
      params.push(Temperature !== null ? parseInt(Temperature, 10) : null);
    }
    if (O2Saturation !== undefined) {
      updates.push(`"O2Saturation" = $${paramIndex++}`);
      params.push(O2Saturation !== null ? parseInt(O2Saturation, 10) : null);
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
      UPDATE "ICUVisitVitals"
      SET ${updates.join(', ')}
      WHERE "ICUVisitVitalsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU visit vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU visit vitals updated successfully',
      data: mapICUVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ICUAdmissionId, PatientId, or NurseId. Please ensure they exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating ICU visit vitals',
      error: error.message,
    });
  }
};

exports.deleteICUVisitVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "ICUVisitVitals" WHERE "ICUVisitVitalsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU visit vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU visit vitals deleted successfully',
      data: mapICUVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ICU visit vitals',
      error: error.message,
    });
  }
};

