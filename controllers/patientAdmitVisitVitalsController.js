const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];
// Note: Database constraint requires 'Daily Vitals' and 'Hourly Vitals' (with spaces)
// We accept both 'Daily'/'Hourly' and 'Daily Vitals'/'Hourly Vitals' and normalize to the database format
const allowedDailyOrHourlyVitals = ['Daily', 'Hourly', 'Daily Vitals', 'Hourly Vitals'];
const allowedPatientStatus = ['Stable', 'Notstable'];
const allowedVitalsStatus = ['Stable', 'Critical', 'Improving', 'Normal'];

const mapPatientAdmitVisitVitalsRow = (row) => ({
  PatientAdmitVisitVitalsId: row.PatientAdmitVisitVitalsId || row.patientadmitvisitvitalsid,
  PatientAdmitNurseVisitsId: row.PatientAdmitNurseVisitsId || row.patientadmitnursevisitsid || null,
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid,
  PatientId: row.PatientId || row.patientid,
  NurseId: row.NurseId || row.nurseid,
  NurseName: row.NurseName || row.nursename || null,
  PatientStatus: row.PatientStatus || row.patientstatus,
  RecordedDateTime: row.RecordedDateTime || row.recordeddatetime,
  VisitRemarks: row.VisitRemarks || row.visitremarks,
  DailyOrHourlyVitals: row.DailyOrHourlyVitals || row.dailyorhourlyvitals,
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
});

exports.getAllPatientAdmitVisitVitals = async (req, res) => {
  try {
    const { status, vitalsStatus, patientId, roomAdmissionId, nurseId, patientStatus, dailyOrHourlyVitals, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM "PatientAdmitVisitVitals"';
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
    if (roomAdmissionId) {
      const roomAdmissionIdInt = parseInt(roomAdmissionId, 10);
      if (!isNaN(roomAdmissionIdInt)) {
        conditions.push(`"RoomAdmissionId" = $${params.length + 1}`);
        params.push(roomAdmissionIdInt);
      }
    }
    if (nurseId) {
      const nurseIdInt = parseInt(nurseId, 10);
      if (!isNaN(nurseIdInt)) {
        conditions.push(`"NurseId" = $${params.length + 1}`);
        params.push(nurseIdInt);
      }
    }
    if (patientStatus) {
      if (allowedPatientStatus.includes(patientStatus)) {
        conditions.push(`"PatientStatus" = $${params.length + 1}`);
        params.push(patientStatus);
      }
    }
    if (dailyOrHourlyVitals) {
      // Normalize for query: accept both 'Daily'/'Hourly' and 'Daily Vitals'/'Hourly Vitals'
      const normalized = (dailyOrHourlyVitals === 'Daily' || dailyOrHourlyVitals === 'Daily Vitals') 
        ? 'Daily Vitals' 
        : (dailyOrHourlyVitals === 'Hourly' || dailyOrHourlyVitals === 'Hourly Vitals') 
          ? 'Hourly Vitals' 
          : null;
      
      if (normalized && allowedDailyOrHourlyVitals.includes(dailyOrHourlyVitals)) {
        conditions.push(`"DailyOrHourlyVitals" = $${params.length + 1}`);
        params.push(normalized);
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

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientAdmitVisitVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit visit vitals',
      error: error.message,
    });
  }
};

exports.getPatientAdmitVisitVitalsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        pavv.*,
        u."UserName" AS "NurseName"
      FROM "PatientAdmitVisitVitals" pavv
      LEFT JOIN "Users" u ON pavv."NurseId" = u."UserId"
      WHERE pavv."PatientAdmitVisitVitalsId" = $1::uuid
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit visit vitals not found' });
    }
    res.status(200).json({ success: true, data: mapPatientAdmitVisitVitalsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit visit vitals',
      error: error.message,
    });
  }
};

exports.getPatientAdmitVisitVitalsByRoomAdmissionId = async (req, res) => {
  try {
    const { roomAdmissionId } = req.params;
    
    // Validate integer format
    const roomAdmissionIdInt = parseInt(roomAdmissionId, 10);
    if (isNaN(roomAdmissionIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId. Must be a valid integer.',
      });
    }

    const { rows } = await db.query(
      `
      SELECT * FROM "PatientAdmitVisitVitals"
      WHERE "RoomAdmissionId" = $1
      ORDER BY "RecordedDateTime" DESC
      `,
      [roomAdmissionIdInt]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      roomAdmissionId: roomAdmissionIdInt,
      data: rows.map(mapPatientAdmitVisitVitalsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient admit visit vitals by room admission ID',
      error: error.message,
    });
  }
};

const validatePatientAdmitVisitVitalsPayload = (body, requireAll = true) => {
  const errors = [];

  // PatientAdmitNurseVisitsId is optional - if not provided, will be auto-created
  if (body.PatientAdmitNurseVisitsId !== undefined && body.PatientAdmitNurseVisitsId !== null && body.PatientAdmitNurseVisitsId !== '') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.PatientAdmitNurseVisitsId)) {
      errors.push('PatientAdmitNurseVisitsId must be a valid UUID');
    }
  }

  if (body.RoomAdmissionId !== undefined && body.RoomAdmissionId !== null && body.RoomAdmissionId !== '') {
    const roomAdmissionIdInt = parseInt(body.RoomAdmissionId, 10);
    if (isNaN(roomAdmissionIdInt)) {
      errors.push('RoomAdmissionId must be a valid integer');
    }
  }

  if (requireAll && (body.PatientId === undefined || body.PatientId === null || body.PatientId === '')) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null && body.PatientId !== '') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.PatientId)) {
      errors.push('PatientId must be a valid UUID');
    }
  }

  if (body.NurseId !== undefined && body.NurseId !== null && body.NurseId !== '') {
    const nurseIdInt = parseInt(body.NurseId, 10);
    if (isNaN(nurseIdInt)) {
      errors.push('NurseId must be a valid integer');
    }
  }

  if (body.PatientStatus !== undefined && body.PatientStatus !== null) {
    if (typeof body.PatientStatus !== 'string') {
      errors.push('PatientStatus must be a string');
    } else if (!allowedPatientStatus.includes(body.PatientStatus)) {
      errors.push('PatientStatus must be Stable or Notstable');
    }
  }

  if (requireAll && (!body.RecordedDateTime || body.RecordedDateTime === '')) {
    errors.push('RecordedDateTime is required');
  }
  if (body.RecordedDateTime && body.RecordedDateTime !== '' && !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/.test(body.RecordedDateTime)) {
    errors.push('RecordedDateTime must be in ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)');
  }

  if (body.VisitRemarks !== undefined && body.VisitRemarks !== null && typeof body.VisitRemarks !== 'string') {
    errors.push('VisitRemarks must be a string');
  }

  if (body.DailyOrHourlyVitals !== undefined && body.DailyOrHourlyVitals !== null) {
    if (typeof body.DailyOrHourlyVitals !== 'string') {
      errors.push('DailyOrHourlyVitals must be a string');
    } else {
      const trimmed = body.DailyOrHourlyVitals.trim();
      // Accept both 'Daily'/'Hourly' and 'Daily Vitals'/'Hourly Vitals'
      if (!allowedDailyOrHourlyVitals.includes(trimmed)) {
        errors.push(`DailyOrHourlyVitals must be 'Daily', 'Hourly', 'Daily Vitals', or 'Hourly Vitals' (case-sensitive). Received: "${body.DailyOrHourlyVitals}"`);
      }
    }
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

  if (body.VitalsStatus !== undefined && body.VitalsStatus !== null) {
    if (typeof body.VitalsStatus !== 'string') {
      errors.push('VitalsStatus must be a string');
    } else if (!allowedVitalsStatus.includes(body.VitalsStatus)) {
      errors.push('VitalsStatus must be one of: Stable, Critical, Improving, or Normal');
    }
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

exports.createPatientAdmitVisitVitals = async (req, res) => {
  try {
    const errors = validatePatientAdmitVisitVitalsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomAdmissionId,
      PatientId,
      PatientAdmitNurseVisitsId,
      NurseId,
      PatientStatus,
      RecordedDateTime,
      VisitRemarks,
      DailyOrHourlyVitals,
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

    // Generate random UUID for PatientAdmitVisitVitalsId
    const patientAdmitVisitVitalsId = randomUUID();

    if (!patientAdmitVisitVitalsId || typeof patientAdmitVisitVitalsId !== 'string') {
      throw new Error('Failed to generate PatientAdmitVisitVitalsId');
    }

    // Validate PatientAdmitNurseVisitsId if provided, otherwise create a new one
    let patientAdmitNurseVisitsIdValue = null;
    if (PatientAdmitNurseVisitsId !== undefined && PatientAdmitNurseVisitsId !== null && PatientAdmitNurseVisitsId !== '') {
      // Use provided PatientAdmitNurseVisitsId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(PatientAdmitNurseVisitsId)) {
        return res.status(400).json({ success: false, message: 'PatientAdmitNurseVisitsId must be a valid UUID' });
      }
      // Check if PatientAdmitNurseVisits record exists
      const nurseVisitExists = await db.query('SELECT "PatientAdmitNurseVisitsId" FROM "PatientAdmitNurseVisits" WHERE "PatientAdmitNurseVisitsId" = $1::uuid', [PatientAdmitNurseVisitsId]);
      if (nurseVisitExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientAdmitNurseVisitsId does not exist' });
      }
      patientAdmitNurseVisitsIdValue = PatientAdmitNurseVisitsId;
    } else {
      // Automatically create a new PatientAdmitNurseVisits record
      // This will be done in the transaction below
    }

    // Validate foreign key existence
    if (RoomAdmissionId !== undefined && RoomAdmissionId !== null && RoomAdmissionId !== '') {
      const roomAdmissionIdInt = parseInt(RoomAdmissionId, 10);
      if (isNaN(roomAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'RoomAdmissionId must be a valid integer' });
      }
      const roomAdmissionExists = await db.query('SELECT "RoomAdmissionId" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1', [roomAdmissionIdInt]);
      if (roomAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'RoomAdmissionId does not exist' });
      }
    }

    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }

    // Validate foreign key existence for NurseId if provided
    let nurseIdValue = null;
    if (NurseId !== undefined && NurseId !== null && NurseId !== '') {
      const nurseIdInt = parseInt(NurseId, 10);
      if (isNaN(nurseIdInt)) {
        return res.status(400).json({ success: false, message: 'NurseId must be a valid integer.' });
      }
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [nurseIdInt]);
      if (nurseExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'NurseId does not exist.' });
      }
      nurseIdValue = nurseIdInt;
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

    // Use transaction to ensure both records are created atomically
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Debug: Check the actual constraint definition in the database
      const constraintCheck = await client.query(`
        SELECT 
          conname AS constraint_name,
          pg_get_constraintdef(oid) AS constraint_definition
        FROM pg_constraint
        WHERE conname = 'PatientAdmitVisitVitals_DailyOrHourlyVitals_check'
        LIMIT 1
      `);
      
      if (constraintCheck.rows.length > 0) {
        console.log('=== Database Constraint Definition ===');
        console.log('Constraint Name:', constraintCheck.rows[0].constraint_name);
        console.log('Constraint Definition:', constraintCheck.rows[0].constraint_definition);
        console.log('=====================================');
      } else {
        console.log('⚠ Constraint PatientAdmitVisitVitals_DailyOrHourlyVitals_check not found in database');
        // Try to find any constraints on this column
        const allConstraints = await client.query(`
          SELECT 
            conname AS constraint_name,
            pg_get_constraintdef(oid) AS constraint_definition
          FROM pg_constraint
          WHERE conrelid = 'PatientAdmitVisitVitals'::regclass
          AND conname LIKE '%DailyOrHourlyVitals%'
        `);
        if (allConstraints.rows.length > 0) {
          console.log('Found related constraints:');
          allConstraints.rows.forEach(row => {
            console.log(`  - ${row.constraint_name}: ${row.constraint_definition}`);
          });
        }
      }

      // If PatientAdmitNurseVisitsId was not provided, create a new PatientAdmitNurseVisits record
      if (!patientAdmitNurseVisitsIdValue) {
        const patientAdmitNurseVisitsId = randomUUID();
        
        // Extract VisitDate and VisitTime from RecordedDateTime
        const recordedDate = new Date(RecordedDateTime);
        const visitDate = recordedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const visitTime = recordedDate.toTimeString().split(' ')[0]; // HH:MM:SS
        
        // Use NurseId or VitalsCreatedBy for RoomVisitsCreatedBy
        const roomVisitsCreatedBy = nurseIdValue || createdByValue;
        
        // Insert PatientAdmitNurseVisits record
        const nurseVisitInsertQuery = `
          INSERT INTO "PatientAdmitNurseVisits"
            ("PatientAdmitNurseVisitsId", "RoomAdmissionId", "PatientId", "VisitDate", "VisitTime", 
             "PatientStatus", "Remarks", "Status", "RoomVisitsCreatedBy")
          VALUES ($1::uuid, $2, $3::uuid, $4::date, $5::time, $6, $7, $8, $9)
          RETURNING "PatientAdmitNurseVisitsId";
        `;
        
        const nurseVisitParams = [
          patientAdmitNurseVisitsId,
          (RoomAdmissionId !== undefined && RoomAdmissionId !== null && RoomAdmissionId !== '') ? parseInt(RoomAdmissionId, 10) : null,
          PatientId,
          visitDate,
          visitTime,
          (PatientStatus && PatientStatus !== '') ? PatientStatus : null,
          (VisitRemarks && VisitRemarks !== '') ? VisitRemarks : null,
          Status,
          roomVisitsCreatedBy,
        ];
        
        const nurseVisitResult = await client.query(nurseVisitInsertQuery, nurseVisitParams);
        patientAdmitNurseVisitsIdValue = nurseVisitResult.rows[0].PatientAdmitNurseVisitsId;
        
        console.log(`✓ Created new PatientAdmitNurseVisits record: ${patientAdmitNurseVisitsIdValue}`);
      }

      // Insert PatientAdmitVisitVitals record
      const insertQuery = `
        INSERT INTO "PatientAdmitVisitVitals"
          ("PatientAdmitVisitVitalsId", "PatientAdmitNurseVisitsId", "RoomAdmissionId", "PatientId", "NurseId", "PatientStatus", "RecordedDateTime", "VisitRemarks",
           "DailyOrHourlyVitals", "HeartRate", "BloodPressure", "Temperature", "O2Saturation", "RespiratoryRate",
           "PulseRate", "VitalsStatus", "VitalsRemarks", "VitalsCreatedBy", "Status")
        VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6, $7::timestamp, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *;
      `;

      // Ensure DailyOrHourlyVitals is valid and normalize to database format
      // Database constraint requires 'Daily Vitals' or 'Hourly Vitals' (with spaces)
      // We accept both 'Daily'/'Hourly' and 'Daily Vitals'/'Hourly Vitals' and normalize
      if (DailyOrHourlyVitals === undefined || DailyOrHourlyVitals === null || DailyOrHourlyVitals === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'DailyOrHourlyVitals is required and must be "Daily", "Hourly", "Daily Vitals", or "Hourly Vitals"' 
        });
      }
      
      const trimmed = String(DailyOrHourlyVitals).trim();
      let dailyOrHourlyVitalsValue = null;
      
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
      
      console.log(`✓ Validated and normalized DailyOrHourlyVitals: "${dailyOrHourlyVitalsValue}" (original: "${DailyOrHourlyVitals}")`);

      const insertParams = [
        patientAdmitVisitVitalsId,
        patientAdmitNurseVisitsIdValue,
        (RoomAdmissionId !== undefined && RoomAdmissionId !== null && RoomAdmissionId !== '') ? parseInt(RoomAdmissionId, 10) : null,
        PatientId,
        nurseIdValue,
        (PatientStatus && PatientStatus !== '') ? PatientStatus : null,
        RecordedDateTime,
        (VisitRemarks && VisitRemarks !== '') ? VisitRemarks : null,
        dailyOrHourlyVitalsValue,
        (HeartRate !== undefined && HeartRate !== null && HeartRate !== '') ? parseInt(HeartRate, 10) : null,
        (BloodPressure && BloodPressure !== '') ? BloodPressure : null,
        (Temperature !== undefined && Temperature !== null && Temperature !== '') ? parseInt(Temperature, 10) : null,
        (O2Saturation !== undefined && O2Saturation !== null && O2Saturation !== '') ? parseInt(O2Saturation, 10) : null,
        (RespiratoryRate !== undefined && RespiratoryRate !== null && RespiratoryRate !== '') ? parseInt(RespiratoryRate, 10) : null,
        (PulseRate !== undefined && PulseRate !== null && PulseRate !== '') ? parseInt(PulseRate, 10) : null,
        (VitalsStatus && VitalsStatus !== '') ? VitalsStatus : null,
        (VitalsRemarks && VitalsRemarks !== '') ? VitalsRemarks : null,
        createdByValue,
        Status,
      ];
      
      console.log('Inserting PatientAdmitVisitVitals with params:', insertParams);
      console.log('DailyOrHourlyVitals value being inserted:', JSON.stringify(dailyOrHourlyVitalsValue));
      console.log('DailyOrHourlyVitals type:', typeof dailyOrHourlyVitalsValue);
      console.log('DailyOrHourlyVitals length:', dailyOrHourlyVitalsValue ? dailyOrHourlyVitalsValue.length : 'null');
      
      const { rows } = await client.query(insertQuery, insertParams);
      
      await client.query('COMMIT');
      client.release();

      // Prepare response data
      const responseData = mapPatientAdmitVisitVitalsRow(rows[0]);
      
      // Add PatientAdmitNurseVisitsId to response
      responseData.PatientAdmitNurseVisitsId = patientAdmitNurseVisitsIdValue;

      res.status(201).json({
        success: true,
        message: 'Patient admit visit vitals created successfully',
        data: responseData,
        patientAdmitNurseVisitsId: patientAdmitNurseVisitsIdValue, // Also return it at top level for convenience
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating patient admit visit vitals:', error);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error constraint:', error.constraint);
    console.error('Request body:', req.body);
    
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please verify RoomAdmissionId, PatientId, NurseId, or VitalsCreatedBy exist.',
        error: error.message,
        detail: error.detail,
        constraint: error.constraint,
      });
    }
    if (error.code === '23502') {
      // Not null constraint violation
      return res.status(400).json({
        success: false,
        message: 'Required field is missing. Please check that PatientId and RecordedDateTime are provided.',
        error: error.message,
        detail: error.detail,
        column: error.column,
      });
    }
    if (error.code === '23514') {
      // Check constraint violation
      const receivedDailyOrHourlyVitals = req.body?.DailyOrHourlyVitals;
      const receivedPatientStatus = req.body?.PatientStatus;
      const receivedVitalsStatus = req.body?.VitalsStatus;
      const receivedStatus = req.body?.Status;
      
      let specificMessage = 'Invalid value provided. Please check allowed values for PatientStatus, DailyOrHourlyVitals, VitalsStatus, or Status.';
      
      if (error.constraint && error.constraint.includes('DailyOrHourlyVitals')) {
        specificMessage = `DailyOrHourlyVitals constraint violation. The value must be 'Daily', 'Hourly', 'Daily Vitals', or 'Hourly Vitals' (case-sensitive). The database requires 'Daily Vitals' or 'Hourly Vitals'. Received: "${receivedDailyOrHourlyVitals}"`;
      } else if (error.constraint && error.constraint.includes('PatientStatus')) {
        specificMessage = `PatientStatus must be exactly 'Stable' or 'Notstable' (case-sensitive). Received: "${receivedPatientStatus}"`;
      } else if (error.constraint && error.constraint.includes('VitalsStatus')) {
        specificMessage = `VitalsStatus must be exactly 'Stable', 'Critical', 'Improving', or 'Normal' (case-sensitive). Received: "${receivedVitalsStatus}"`;
      } else if (error.constraint && error.constraint.includes('Status')) {
        specificMessage = `Status must be exactly 'Active' or 'Inactive' (case-sensitive). Received: "${receivedStatus}"`;
      }
      
      return res.status(400).json({
        success: false,
        message: specificMessage,
        error: error.message,
        detail: error.detail,
        constraint: error.constraint,
        receivedValue: error.constraint && error.constraint.includes('DailyOrHourlyVitals') ? receivedDailyOrHourlyVitals : undefined,
      });
    }
    if (error.code === '22P02' || error.code === '42804') {
      // Invalid data type
      return res.status(400).json({
        success: false,
        message: 'Invalid data type. Please check that all field values match their expected types (UUID, integer, timestamp, etc.).',
        error: error.message,
        detail: error.detail,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating patient admit visit vitals',
      error: error.message,
      errorCode: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

exports.updatePatientAdmitVisitVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validatePatientAdmitVisitVitalsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomAdmissionId,
      PatientId,
      PatientAdmitNurseVisitsId,
      NurseId,
      PatientStatus,
      RecordedDateTime,
      VisitRemarks,
      DailyOrHourlyVitals,
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

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (RoomAdmissionId !== undefined) {
      if (RoomAdmissionId !== null) {
        const roomAdmissionIdInt = parseInt(RoomAdmissionId, 10);
        if (isNaN(roomAdmissionIdInt)) {
          return res.status(400).json({ success: false, message: 'RoomAdmissionId must be a valid integer.' });
        }
        const roomAdmissionExists = await db.query('SELECT "RoomAdmissionId" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1', [roomAdmissionIdInt]);
        if (roomAdmissionExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'RoomAdmissionId does not exist.' });
        }
        updates.push(`"RoomAdmissionId" = $${paramIndex++}`);
        params.push(roomAdmissionIdInt);
      } else {
        updates.push(`"RoomAdmissionId" = $${paramIndex++}`);
        params.push(null);
      }
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}::uuid`);
      params.push(PatientId);
    }
    if (PatientAdmitNurseVisitsId !== undefined) {
      if (PatientAdmitNurseVisitsId !== null && PatientAdmitNurseVisitsId !== '') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(PatientAdmitNurseVisitsId)) {
          return res.status(400).json({ success: false, message: 'PatientAdmitNurseVisitsId must be a valid UUID.' });
        }
        // Check if PatientAdmitNurseVisits record exists
        const nurseVisitExists = await db.query('SELECT "PatientAdmitNurseVisitsId" FROM "PatientAdmitNurseVisits" WHERE "PatientAdmitNurseVisitsId" = $1::uuid', [PatientAdmitNurseVisitsId]);
        if (nurseVisitExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'PatientAdmitNurseVisitsId does not exist.' });
        }
        updates.push(`"PatientAdmitNurseVisitsId" = $${paramIndex++}::uuid`);
        params.push(PatientAdmitNurseVisitsId);
      } else {
        // If null is provided, we can't set it to null if it's NOT NULL constraint
        // But we'll allow it in case the constraint allows it
        updates.push(`"PatientAdmitNurseVisitsId" = $${paramIndex++}::uuid`);
        params.push(null);
      }
    }
    if (NurseId !== undefined) {
      if (NurseId !== null && NurseId !== '') {
        const nurseIdInt = parseInt(NurseId, 10);
        if (isNaN(nurseIdInt)) {
          return res.status(400).json({ success: false, message: 'NurseId must be a valid integer.' });
        }
        const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [nurseIdInt]);
        if (nurseExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'NurseId does not exist.' });
        }
        updates.push(`"NurseId" = $${paramIndex++}`);
        params.push(nurseIdInt);
      } else {
        updates.push(`"NurseId" = $${paramIndex++}`);
        params.push(null);
      }
    }
    if (PatientStatus !== undefined) {
      updates.push(`"PatientStatus" = $${paramIndex++}`);
      params.push(PatientStatus);
    }
    if (RecordedDateTime !== undefined) {
      updates.push(`"RecordedDateTime" = $${paramIndex++}::timestamp`);
      params.push(RecordedDateTime);
    }
    if (VisitRemarks !== undefined) {
      updates.push(`"VisitRemarks" = $${paramIndex++}`);
      params.push(VisitRemarks);
    }
    if (DailyOrHourlyVitals !== undefined) {
      if (DailyOrHourlyVitals !== null && DailyOrHourlyVitals !== '') {
        const trimmed = String(DailyOrHourlyVitals).trim();
        let normalizedValue = null;
        
        // Normalize to database format: 'Daily' -> 'Daily Vitals', 'Hourly' -> 'Hourly Vitals'
        if (trimmed === 'Daily' || trimmed === 'Daily Vitals') {
          normalizedValue = 'Daily Vitals';
        } else if (trimmed === 'Hourly' || trimmed === 'Hourly Vitals') {
          normalizedValue = 'Hourly Vitals';
        } else {
          return res.status(400).json({ 
            success: false, 
            message: `DailyOrHourlyVitals must be 'Daily', 'Hourly', 'Daily Vitals', or 'Hourly Vitals' (case-sensitive). Received: "${DailyOrHourlyVitals}"` 
          });
        }
        
        updates.push(`"DailyOrHourlyVitals" = $${paramIndex++}`);
        params.push(normalizedValue);
      } else {
        updates.push(`"DailyOrHourlyVitals" = $${paramIndex++}`);
        params.push(null);
      }
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
      let createdByValue = null;
      if (VitalsCreatedBy !== null && VitalsCreatedBy !== '') {
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
      UPDATE "PatientAdmitVisitVitals"
      SET ${updates.join(', ')}
      WHERE "PatientAdmitVisitVitalsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit visit vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient admit visit vitals updated successfully',
      data: mapPatientAdmitVisitVitalsRow(rows[0]),
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
      message: 'Error updating patient admit visit vitals',
      error: error.message,
    });
  }
};

exports.deletePatientAdmitVisitVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "PatientAdmitVisitVitals" WHERE "PatientAdmitVisitVitalsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient admit visit vitals not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient admit visit vitals deleted successfully',
      data: mapPatientAdmitVisitVitalsRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient admit visit vitals',
      error: error.message,
    });
  }
};

