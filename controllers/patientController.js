const db = require('../db');

const allowedGender = ['Male', 'Female'];
const allowedPatientTypes = ['OPD', 'IPD', 'Emergency', 'Direct'];
const allowedStatus = ['Active', 'Inactive'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapPatientRow = (row) => ({
  PatientId: row.PatientId || row.patientid,
  PatientNo: row.PatientNo || row.patientno,
  PatientName: row.PatientName || row.patientname,
  LastName: row.LastName || row.lastname,
  PhoneNo: row.PhoneNo || row.phoneno,
  Gender: row.Gender || row.gender,
  Age: row.Age || row.age,
  Address: row.Address || row.address,
  AdhaarID: row.AdhaarID || row.adhaarid || null,
  PANCard: row.PANCard || row.pancard || null,
  PatientType: row.PatientType || row.patienttype,
  ChiefComplaint: row.ChiefComplaint || row.chiefcomplaint,
  Description: row.Description || row.description,
  Status: row.Status || row.status,
  RegisteredBy: row.RegisteredBy || row.registeredby,
  RegisteredDate: row.RegisteredDate || row.registereddate,
  RegisteredByUserName: row.UserName || row.username || null,
});

/**
 * Generate PatientNo in format PYYYY_MM_XXXX
 * Example: P2025_11_0001
 */
const generatePatientNo = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}_${month}`;
  const pattern = `P${yearMonth}_%`;

  // Find the highest sequence number for this year_month
  // Format: PYYYY_MM_XXXX (position 1: P, positions 2-5: year, 6: _, 7-8: month, 9: _, 10-13: sequence)
  // Extract sequence number starting from position 10 (after PYYYY_MM_)
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("PatientNo" FROM 10) AS INT)), 0) + 1 AS next_seq
    FROM "PatientRegistration"
    WHERE "PatientNo" LIKE $1
  `;

  const { rows } = await db.query(query, [pattern]);
  const nextSeq = rows[0].next_seq;

  // Format as PYYYY_MM_XXXX (P prefix, 4 digits with leading zeros)
  const patientNo = `P${yearMonth}_${String(nextSeq).padStart(4, '0')}`;
  return patientNo;
};

exports.getAllPatients = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.*, u."UserName"
      FROM "PatientRegistration" p
      LEFT JOIN "Users" u ON p."RegisteredBy" = u."UserId"
    `;
    const params = [];
    if (status) {
      query += ' WHERE p."Status" = $1';
      params.push(status);
    }
    query += ' ORDER BY p."RegisteredDate" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message,
    });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is a valid UUID
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PatientId. Must be a valid UUID.' 
      });
    }
    const { rows } = await db.query(
      `
      SELECT p.*, u."UserName"
      FROM "PatientRegistration" p
      LEFT JOIN "Users" u ON p."RegisteredBy" = u."UserId"
      WHERE p."PatientId" = $1::uuid
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: mapPatientRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message,
    });
  }
};

const validatePatientPayload = (body, requireAll = true) => {
  const errors = [];
  if (requireAll && (!body.PatientName || !body.PatientName.trim())) {
    errors.push('PatientName is required');
  }
  if (requireAll && (!body.PhoneNo || !body.PhoneNo.trim())) {
    errors.push('PhoneNo is required');
  }
  // Validate AdhaarID format if provided (optional field)
  if (body.AdhaarID !== undefined && body.AdhaarID !== null && body.AdhaarID !== '') {
    const adhaarRegex = /^\d{12}$/;
    if (!adhaarRegex.test(body.AdhaarID.trim())) {
      errors.push('AdhaarID must be exactly 12 digits');
    }
  }
  // Validate PANCard format if provided (optional field)
  if (body.PANCard !== undefined && body.PANCard !== null && body.PANCard !== '') {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(body.PANCard.trim().toUpperCase())) {
      errors.push('PANCard must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)');
    }
  }
  if (body.Gender && !allowedGender.includes(body.Gender)) {
    errors.push('Gender must be Male or Female');
  }
  if (body.PatientType && !allowedPatientTypes.includes(body.PatientType)) {
    errors.push('PatientType must be OPD, IPD, Emergency, or Direct');
  }
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or InActive');
  }
  if (requireAll && !body.RegisteredBy) {
    errors.push('RegisteredBy is required');
  }
  return errors;
};

exports.createPatient = async (req, res) => {
  try {
    const errors = validatePatientPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientName,
      LastName,
      PhoneNo,
      Gender,
      Age,
      Address,
      AdhaarID,
      PANCard,
      PatientType,
      ChiefComplaint,
      Description,
      Status = 'Active',
      RegisteredBy,
    } = req.body;

    // Generate PatientNo in format PYYYY_MM_XXXX
    const patientNo = await generatePatientNo();

    // Proactive validation: Check if PatientNo already exists
    const existingPatient = await db.query(
      'SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientNo" = $1',
      [patientNo]
    );
    if (existingPatient.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient number already exists. Please try again.',
      });
    }

    // Check if AdhaarID already exists (only if provided)
    if (AdhaarID !== undefined && AdhaarID !== null && AdhaarID.trim() !== '') {
      const existingAdhaar = await db.query(
        'SELECT "PatientId" FROM "PatientRegistration" WHERE "AdhaarID" = $1',
        [AdhaarID.trim()]
      );
      if (existingAdhaar.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'AdhaarID already exists. Each patient must have a unique AdhaarID.',
        });
      }
    }

    // PatientId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "PatientRegistration"
        ("PatientNo", "PatientName","LastName","PhoneNo","Gender","Age","Address",
         "AdhaarID","PANCard","PatientType",
         "ChiefComplaint","Description",
         "Status","RegisteredBy")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      patientNo,
      PatientName.trim(),
      LastName ? LastName.trim() : null,
      PhoneNo.trim(),
      Gender || null,
      Age || null,
      Address || null,
      AdhaarID && AdhaarID.trim() !== '' ? AdhaarID.trim() : null,
      PANCard ? PANCard.trim().toUpperCase() : null,
      PatientType || null,
      ChiefComplaint || null,
      Description || null,
      Status,
      RegisteredBy,
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: mapPatientRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation (likely PatientNo or AdhaarID)
      if (error.message && error.message.includes('AdhaarID')) {
        return res.status(400).json({
          success: false,
          message: 'AdhaarID already exists. Each patient must have a unique AdhaarID.',
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Patient number already exists. Please try again.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error registering patient',
      error: error.message,
    });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const errors = validatePatientPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientName,
      LastName,
      PhoneNo,
      Gender,
      Age,
      Address,
      AdhaarID,
      PANCard,
      PatientType,
      ChiefComplaint,
      Description,
      Status,
      RegisteredBy,
    } = req.body;

    const { id } = req.params;
  // Validate that id is a valid UUID
  if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
      message: 'Invalid PatientId. Must be a valid UUID.' 
      });
    }

    // Check if AdhaarID is being updated and if it already exists for another patient
    if (AdhaarID !== undefined && AdhaarID !== null && AdhaarID !== '') {
      const existingAdhaar = await db.query(
      'SELECT "PatientId" FROM "PatientRegistration" WHERE "AdhaarID" = $1 AND "PatientId" != $2::uuid',
      [AdhaarID.trim(), id]
      );
      if (existingAdhaar.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'AdhaarID already exists for another patient.',
        });
      }
    }

    const updateQuery = `
      UPDATE "PatientRegistration"
      SET
        "PatientName" = COALESCE($1, "PatientName"),
        "LastName" = COALESCE($2, "LastName"),
        "PhoneNo" = COALESCE($3, "PhoneNo"),
        "Gender" = COALESCE($4, "Gender"),
        "Age" = COALESCE($5, "Age"),
        "Address" = COALESCE($6, "Address"),
        "AdhaarID" = COALESCE($7, "AdhaarID"),
        "PANCard" = COALESCE($8, "PANCard"),
        "PatientType" = COALESCE($9, "PatientType"),
        "ChiefComplaint" = COALESCE($10, "ChiefComplaint"),
        "Description" = COALESCE($11, "Description"),
        "Status" = COALESCE($12, "Status"),
        "RegisteredBy" = COALESCE($13, "RegisteredBy")
      WHERE "PatientId" = $14
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, [
      PatientName ? PatientName.trim() : null,
      LastName ? LastName.trim() : null,
      PhoneNo ? PhoneNo.trim() : null,
      Gender || null,
      Age || null,
      Address || null,
      AdhaarID && AdhaarID.trim() !== '' ? AdhaarID.trim() : null,
      PANCard ? PANCard.trim().toUpperCase() : null,
      PatientType || null,
      ChiefComplaint || null,
      Description || null,
      Status || null,
      RegisteredBy || null,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: mapPatientRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      if (error.message && error.message.includes('AdhaarID')) {
        return res.status(400).json({
          success: false,
          message: 'AdhaarID already exists for another patient.',
          error: error.message,
        });
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message,
    });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is a valid UUID
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PatientId. Must be a valid UUID.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "PatientRegistration" WHERE "PatientId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
      data: mapPatientRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message,
    });
  }
};

