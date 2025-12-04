const db = require('../db');

const allowedAppointmentStatus = ['Waiting', 'Consulting', 'Completed'];
const allowedToBeAdmitted = ['Yes', 'No'];
const allowedReferToAnotherDoctor = ['Yes', 'No'];
const allowedTransferToIPDOTICU = ['Yes', 'No'];
const allowedTransferTo = ['IPD Room Admission', 'ICU', 'OT'];
const allowedStatus = ['Active', 'Inactive'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapAppointmentRow = (row) => ({
  PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid,
  PatientId: row.PatientId || row.patientid,
  DoctorId: row.DoctorId || row.doctorid,
  AppointmentDate: row.AppointmentDate || row.appointmentdate,
  AppointmentTime: row.AppointmentTime || row.appointmenttime,
  TokenNo: row.TokenNo || row.tokenno,
  AppointmentStatus: row.AppointmentStatus || row.appointmentstatus,
  ConsultationCharge: row.ConsultationCharge ? parseFloat(row.ConsultationCharge) : row.consultationcharge ? parseFloat(row.consultationcharge) : null,
  Diagnosis: row.Diagnosis || row.diagnosis,
  FollowUpDetails: row.FollowUpDetails || row.followupdetails,
  PrescriptionsUrl: row.PrescriptionsUrl || row.prescriptionsurl,
  ToBeAdmitted: row.ToBeAdmitted || row.tobeadmitted,
  ReferToAnotherDoctor: row.ReferToAnotherDoctor || row.refertoanotherdoctor || 'No',
  ReferredDoctorId: row.ReferredDoctorId || row.referreddoctorid || null,
  ReferredDoctorName: row.ReferredDoctorName || row.referreddoctorname || null,
  TransferToIPDOTICU: row.TransferToIPDOTICU || row.transfertoipdoticu || 'No',
  TransferTo: row.TransferTo || row.transferto || null,
  TransferDetails: row.TransferDetails || row.transferdetails || null,
  BillId: row.BillId || row.billid || null,
  BillNo: row.BillNo || row.billno || null,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby || null,
  CreatedDate: row.CreatedDate || row.createddate,
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  DoctorName: row.DoctorName || row.doctorname || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
});

/**
 * Generate TokenNo in format T-0001, T-0002, etc.
 */
const generateTokenNo = async () => {
  // Find the highest token number
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("TokenNo" FROM 3) AS INT)), 0) + 1 AS next_seq
    FROM "PatientAppointment"
    WHERE "TokenNo" LIKE 'T-%'
  `;

  const { rows } = await db.query(query);
  const nextSeq = rows[0].next_seq;

  // Format as T-XXXX (T prefix, 4 digits with leading zeros)
  const tokenNo = `T-${String(nextSeq).padStart(4, '0')}`;
  return tokenNo;
};

exports.getAllAppointments = async (req, res) => {
  try {
    const { status, appointmentStatus, patientId, doctorId, appointmentDate } = req.query;
    let query = `
      SELECT 
        pa.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        rd."UserName" AS "ReferredDoctorName",
        b."BillNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientAppointment" pa
      LEFT JOIN "PatientRegistration" p ON pa."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON pa."DoctorId" = d."UserId"
      LEFT JOIN "Users" rd ON pa."ReferredDoctorId" = rd."UserId"
      LEFT JOIN "Bills" b ON pa."BillId" = b."BillId"
      LEFT JOIN "Users" u ON pa."CreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`pa."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (appointmentStatus) {
      conditions.push(`pa."AppointmentStatus" = $${params.length + 1}`);
      params.push(appointmentStatus);
    }
    if (patientId) {
      if (!uuidRegex.test(patientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid patientId. Must be a valid UUID.',
        });
      }
      conditions.push(`pa."PatientId" = $${params.length + 1}::uuid`);
      params.push(patientId);
    }
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (!isNaN(doctorIdInt)) {
        conditions.push(`pa."DoctorId" = $${params.length + 1}`);
        params.push(doctorIdInt);
      }
    }
    if (appointmentDate) {
      conditions.push(`pa."AppointmentDate" = $${params.length + 1}`);
      params.push(appointmentDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY pa."AppointmentDate" DESC, pa."AppointmentTime" ASC, pa."TokenNo" ASC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapAppointmentRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient appointments',
      error: error.message,
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid PatientAppointmentId. Must be an integer.' });
    }
    const { rows } = await db.query(
      `
      SELECT 
        pa.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "DoctorName",
        rd."UserName" AS "ReferredDoctorName",
        b."BillNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientAppointment" pa
      LEFT JOIN "PatientRegistration" p ON pa."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON pa."DoctorId" = d."UserId"
      LEFT JOIN "Users" rd ON pa."ReferredDoctorId" = rd."UserId"
      LEFT JOIN "Bills" b ON pa."BillId" = b."BillId"
      LEFT JOIN "Users" u ON pa."CreatedBy" = u."UserId"
      WHERE pa."PatientAppointmentId" = $1
      `,
      [appointmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.status(200).json({ success: true, data: mapAppointmentRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message,
    });
  }
};

const validateAppointmentPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && body.PatientId === undefined) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null) {
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
  
  if (requireAll && !body.AppointmentDate) {
    errors.push('AppointmentDate is required');
  }
  
  if (requireAll && !body.AppointmentTime) {
    errors.push('AppointmentTime is required');
  }
  
  if (body.AppointmentStatus && !allowedAppointmentStatus.includes(body.AppointmentStatus)) {
    errors.push('AppointmentStatus must be Waiting, Consulting, or Completed');
  }
  
  if (body.ConsultationCharge !== undefined && (isNaN(body.ConsultationCharge) || body.ConsultationCharge < 0)) {
    errors.push('ConsultationCharge must be a non-negative number');
  }
  
  if (body.ToBeAdmitted && !allowedToBeAdmitted.includes(body.ToBeAdmitted)) {
    errors.push('ToBeAdmitted must be Yes or No');
  }
  
  if (body.ReferToAnotherDoctor && !allowedReferToAnotherDoctor.includes(body.ReferToAnotherDoctor)) {
    errors.push('ReferToAnotherDoctor must be Yes or No');
  }
  
  if (body.ReferredDoctorId !== undefined && body.ReferredDoctorId !== null && body.ReferredDoctorId !== '') {
    const referredDoctorIdInt = parseInt(body.ReferredDoctorId, 10);
    if (isNaN(referredDoctorIdInt)) {
      errors.push('ReferredDoctorId must be a valid integer');
    }
  }
  
  if (body.TransferToIPDOTICU && !allowedTransferToIPDOTICU.includes(body.TransferToIPDOTICU)) {
    errors.push('TransferToIPDOTICU must be Yes or No');
  }
  
  if (body.TransferTo && !allowedTransferTo.includes(body.TransferTo)) {
    errors.push(`TransferTo must be one of: ${allowedTransferTo.join(', ')}`);
  }
  
  if (body.BillId !== undefined && body.BillId !== null && body.BillId !== '') {
    const billIdInt = parseInt(body.BillId, 10);
    if (isNaN(billIdInt)) {
      errors.push('BillId must be a valid integer');
    }
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }
  
  if (body.CreatedBy !== undefined && body.CreatedBy !== null && body.CreatedBy !== '') {
    const createdByInt = parseInt(body.CreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('CreatedBy must be a valid integer');
    }
  }
  
  return errors;
};

exports.createAppointment = async (req, res) => {
  try {
    const errors = validateAppointmentPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientId,
      DoctorId,
      AppointmentDate,
      AppointmentTime,
      AppointmentStatus = 'Waiting',
      ConsultationCharge,
      Diagnosis,
      FollowUpDetails,
      PrescriptionsUrl,
      ToBeAdmitted = 'No',
      ReferToAnotherDoctor = 'No',
      ReferredDoctorId,
      TransferToIPDOTICU = 'No',
      TransferTo,
      TransferDetails,
      BillId,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // Generate TokenNo
    const tokenNo = await generateTokenNo();
    
    // Proactive validation: Check if TokenNo already exists
    const existingToken = await db.query(
      'SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "TokenNo" = $1',
      [tokenNo]
    );
    if (existingToken.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Token number already exists. Please try again.',
      });
    }
    
    // PatientAppointmentId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT

    // Validate ReferredDoctorId if provided
    let referredDoctorIdValue = null;
    if (ReferToAnotherDoctor === 'Yes' && ReferredDoctorId !== undefined && ReferredDoctorId !== null && ReferredDoctorId !== '') {
      const referredDoctorIdInt = parseInt(ReferredDoctorId, 10);
      if (isNaN(referredDoctorIdInt)) {
        return res.status(400).json({ success: false, message: 'ReferredDoctorId must be a valid integer' });
      }
      // Check if referred doctor exists
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [referredDoctorIdInt]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ReferredDoctorId does not exist' });
      }
      referredDoctorIdValue = referredDoctorIdInt;
    }

    // Validate BillId if provided
    let billIdValue = null;
    if (BillId !== undefined && BillId !== null && BillId !== '') {
      const billIdInt = parseInt(BillId, 10);
      if (isNaN(billIdInt)) {
        return res.status(400).json({ success: false, message: 'BillId must be a valid integer' });
      }
      // Check if bill exists
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [billIdInt]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
      billIdValue = billIdInt;
    }

    // Validate CreatedBy if provided
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid integer' });
      }
      // Check if user exists
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'CreatedBy user does not exist' });
      }
      createdByValue = createdByInt;
    }

    const insertQuery = `
      INSERT INTO "PatientAppointment"
        ("PatientId", "DoctorId", "AppointmentDate", "AppointmentTime",
         "TokenNo", "AppointmentStatus", "ConsultationCharge", "Diagnosis", "FollowUpDetails",
         "PrescriptionsUrl", "ToBeAdmitted", "ReferToAnotherDoctor", "ReferredDoctorId",
         "TransferToIPDOTICU", "TransferTo", "TransferDetails", "BillId", "Status", "CreatedBy")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      PatientId,
      parseInt(DoctorId, 10),
      AppointmentDate,
      AppointmentTime,
      tokenNo,
      AppointmentStatus,
      ConsultationCharge !== undefined ? parseFloat(ConsultationCharge) : null,
      Diagnosis ? Diagnosis.trim() : null,
      FollowUpDetails ? FollowUpDetails.trim() : null,
      PrescriptionsUrl ? PrescriptionsUrl.trim() : null,
      ToBeAdmitted,
      ReferToAnotherDoctor,
      referredDoctorIdValue,
      TransferToIPDOTICU,
      TransferTo ? TransferTo.trim() : null,
      TransferDetails ? TransferDetails.trim() : null,
      billIdValue,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: mapAppointmentRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation (likely TokenNo)
      return res.status(400).json({
        success: false,
        message: 'Token number conflict. Please try again.',
        error: error.message,
      });
    }
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId or DoctorId. Please verify the IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message,
    });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const errors = validateAppointmentPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid PatientAppointmentId. Must be an integer.' });
    }

    const {
      PatientId,
      DoctorId,
      AppointmentDate,
      AppointmentTime,
      AppointmentStatus,
      ConsultationCharge,
      Diagnosis,
      FollowUpDetails,
      PrescriptionsUrl,
      ToBeAdmitted,
      ReferToAnotherDoctor,
      ReferredDoctorId,
      TransferToIPDOTICU,
      TransferTo,
      TransferDetails,
      BillId,
      Status,
      CreatedBy,
    } = req.body;

    // Validate ReferredDoctorId if provided
    let referredDoctorIdValue = null;
    if (ReferredDoctorId !== undefined && ReferredDoctorId !== null && ReferredDoctorId !== '') {
      const referredDoctorIdInt = parseInt(ReferredDoctorId, 10);
      if (isNaN(referredDoctorIdInt)) {
        return res.status(400).json({ success: false, message: 'ReferredDoctorId must be a valid integer' });
      }
      // Check if referred doctor exists
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [referredDoctorIdInt]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ReferredDoctorId does not exist' });
      }
      referredDoctorIdValue = referredDoctorIdInt;
    } else if (ReferredDoctorId === null) {
      referredDoctorIdValue = null;
    }

    // Validate BillId if provided
    let billIdValue = null;
    if (BillId !== undefined && BillId !== null && BillId !== '') {
      const billIdInt = parseInt(BillId, 10);
      if (isNaN(billIdInt)) {
        return res.status(400).json({ success: false, message: 'BillId must be a valid integer' });
      }
      // Check if bill exists
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [billIdInt]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
      billIdValue = billIdInt;
    } else if (BillId === null) {
      billIdValue = null;
    }

    // Validate CreatedBy if provided
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid integer' });
      }
      // Check if user exists
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'CreatedBy user does not exist' });
      }
      createdByValue = createdByInt;
    } else if (CreatedBy === null) {
      createdByValue = null;
    }

    const updateQuery = `
      UPDATE "PatientAppointment"
      SET
        "PatientId" = COALESCE($1::uuid, "PatientId"),
        "DoctorId" = COALESCE($2, "DoctorId"),
        "AppointmentDate" = COALESCE($3, "AppointmentDate"),
        "AppointmentTime" = COALESCE($4, "AppointmentTime"),
        "AppointmentStatus" = COALESCE($5, "AppointmentStatus"),
        "ConsultationCharge" = COALESCE($6, "ConsultationCharge"),
        "Diagnosis" = COALESCE($7, "Diagnosis"),
        "FollowUpDetails" = COALESCE($8, "FollowUpDetails"),
        "PrescriptionsUrl" = COALESCE($9, "PrescriptionsUrl"),
        "ToBeAdmitted" = COALESCE($10, "ToBeAdmitted"),
        "ReferToAnotherDoctor" = COALESCE($11, "ReferToAnotherDoctor"),
        "ReferredDoctorId" = COALESCE($12, "ReferredDoctorId"),
        "TransferToIPDOTICU" = COALESCE($13, "TransferToIPDOTICU"),
        "TransferTo" = COALESCE($14, "TransferTo"),
        "TransferDetails" = COALESCE($15, "TransferDetails"),
        "BillId" = COALESCE($16, "BillId"),
        "Status" = COALESCE($17, "Status"),
        "CreatedBy" = COALESCE($18, "CreatedBy")
      WHERE "PatientAppointmentId" = $19
      RETURNING *;
    `;

    const updateParams = [
      PatientId !== undefined && PatientId !== null ? PatientId : null,
      DoctorId !== undefined && DoctorId !== null ? parseInt(DoctorId, 10) : null,
      AppointmentDate || null,
      AppointmentTime || null,
      AppointmentStatus || null,
      ConsultationCharge !== undefined ? parseFloat(ConsultationCharge) : null,
      Diagnosis ? Diagnosis.trim() : null,
      FollowUpDetails ? FollowUpDetails.trim() : null,
      PrescriptionsUrl ? PrescriptionsUrl.trim() : null,
      ToBeAdmitted || null,
      ReferToAnotherDoctor || null,
      referredDoctorIdValue,
      TransferToIPDOTICU || null,
      TransferTo ? TransferTo.trim() : null,
      TransferDetails ? TransferDetails.trim() : null,
      billIdValue,
      Status || null,
      createdByValue,
      appointmentId,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: mapAppointmentRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId or DoctorId. Please verify the IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message,
    });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid PatientAppointmentId. Must be an integer.' });
    }
    const { rows } = await db.query(
      'DELETE FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1 RETURNING *;',
      [appointmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
      data: mapAppointmentRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message,
    });
  }
};

exports.getTodayActiveAppointmentsCount = async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const { rows } = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM "PatientAppointment"
      WHERE "AppointmentDate" = $1
        AND "Status" = 'Active'
      `,
      [today]
    );

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      date: today,
      count: count,
      message: `Found ${count} active appointment(s) for today`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s active appointments count',
      error: error.message,
    });
  }
};

/**
 * Get count of active appointments for a specific date or today
 * Query parameter: ?date=YYYY-MM-DD (optional, defaults to today)
 */
exports.getActiveAppointmentsCountByDate = async (req, res) => {
  try {
    // Get date from query parameter or use today
    let appointmentDate;
    if (req.query.date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(req.query.date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-11-30)',
        });
      }
      // Validate that it's a valid date
      const parsedDate = new Date(req.query.date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date. Please provide a valid date in YYYY-MM-DD format',
        });
      }
      appointmentDate = req.query.date;
    } else {
      // Default to today
      appointmentDate = new Date().toISOString().split('T')[0];
    }
    
    const { rows } = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM "PatientAppointment"
      WHERE "AppointmentDate" = $1
        AND "Status" = 'Active'
      `,
      [appointmentDate]
    );

    const count = parseInt(rows[0].count, 10) || 0;

    const isToday = appointmentDate === new Date().toISOString().split('T')[0];
    const dateLabel = isToday ? 'today' : appointmentDate;

    res.status(200).json({
      success: true,
      date: appointmentDate,
      count: count,
      message: `Found ${count} active appointment(s) for ${dateLabel}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active appointments count',
      error: error.message,
    });
  }
};

/**
 * Get doctor-wise patient count from PatientAppointment
 * Returns count of distinct patients and total appointments per doctor
 * Optional query parameters:
 * - status: Filter by appointment status (Active, Inactive)
 * - appointmentDate: Filter by specific date (YYYY-MM-DD)
 */
exports.getDoctorWisePatientCount = async (req, res) => {
  try {
    const { status, appointmentDate } = req.query;
    
    let query = `
      SELECT 
        pa."DoctorId",
        u."UserName" AS "DoctorName",
        u."EmailId" AS "DoctorEmail",
        u."PhoneNo" AS "DoctorPhone",
        u."DoctorQualification",
        d."DepartmentName",
        d."SpecialisationDetails",
        COUNT(DISTINCT pa."PatientId") AS "PatientCount",
        COUNT(pa."PatientAppointmentId") AS "TotalAppointments"
      FROM "PatientAppointment" pa
      INNER JOIN "Users" u ON pa."DoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push(`pa."Status" = $${params.length + 1}`);
      params.push(status);
    }
    
    if (appointmentDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-11-30)',
        });
      }
      conditions.push(`pa."AppointmentDate" = $${params.length + 1}`);
      params.push(appointmentDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY pa."DoctorId", u."UserName", u."EmailId", u."PhoneNo", u."DoctorQualification", d."DepartmentName", d."SpecialisationDetails"
      ORDER BY "PatientCount" DESC, "TotalAppointments" DESC
    `;
    
    const { rows } = await db.query(query, params);
    
    const totalPatients = rows.reduce((sum, row) => sum + parseInt(row.PatientCount, 10), 0);
    const totalAppointments = rows.reduce((sum, row) => sum + parseInt(row.TotalAppointments, 10), 0);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      totalPatients: totalPatients,
      totalAppointments: totalAppointments,
      filters: {
        status: status || null,
        appointmentDate: appointmentDate || null,
      },
      data: rows.map(row => ({
        DoctorId: row.DoctorId || row.doctorid,
        DoctorName: row.DoctorName || row.doctorname,
        DoctorEmail: row.DoctorEmail || row.doctoremail,
        DoctorPhone: row.DoctorPhone || row.doctorphone || null,
        DoctorQualification: row.DoctorQualification || row.doctorqualification || null,
        DepartmentName: row.DepartmentName || row.departmentname || null,
        SpecialisationDetails: row.SpecialisationDetails || row.specialisationdetails || null,
        PatientCount: parseInt(row.PatientCount, 10) || 0,
        TotalAppointments: parseInt(row.TotalAppointments, 10) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor-wise patient count',
      error: error.message,
    });
  }
};

/**
 * Get different appointment counts by status
 * Returns TotalActiveAppointments, Waiting Count, Consulting Count, and Completed Count
 * Optional query parameters:
 * - appointmentDate: Filter by specific date (YYYY-MM-DD)
 * - doctorId: Filter by specific doctor (UserId)
 */
exports.getAppointmentCountsByStatus = async (req, res) => {
  try {
    const { appointmentDate, doctorId } = req.query;
    
    // Build WHERE conditions
    const conditions = ['pa."Status" = \'Active\''];
    const params = [];
    
    if (appointmentDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-11-30)',
        });
      }
      conditions.push(`pa."AppointmentDate" = $${params.length + 1}`);
      params.push(appointmentDate);
    }
    
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (isNaN(doctorIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid doctorId. Must be a valid integer.',
        });
      }
      conditions.push(`pa."DoctorId" = $${params.length + 1}`);
      params.push(doctorIdInt);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get all counts in a single query using conditional aggregation
    const query = `
      SELECT 
        COUNT(*) AS "TotalActiveAppointments",
        COUNT(CASE WHEN pa."AppointmentStatus" = 'Waiting' THEN 1 END) AS "WaitingCount",
        COUNT(CASE WHEN pa."AppointmentStatus" = 'Consulting' THEN 1 END) AS "ConsultingCount",
        COUNT(CASE WHEN pa."AppointmentStatus" = 'Completed' THEN 1 END) AS "CompletedCount"
      FROM "PatientAppointment" pa
      ${whereClause}
    `;
    
    const { rows } = await db.query(query, params);
    
    const result = {
      TotalActiveAppointments: parseInt(rows[0].TotalActiveAppointments, 10) || 0,
      WaitingCount: parseInt(rows[0].WaitingCount, 10) || 0,
      ConsultingCount: parseInt(rows[0].ConsultingCount, 10) || 0,
      CompletedCount: parseInt(rows[0].CompletedCount, 10) || 0,
    };
    
    res.status(200).json({
      success: true,
      filters: {
        appointmentDate: appointmentDate || null,
        doctorId: doctorId || null,
      },
      counts: result,
      message: `Found ${result.TotalActiveAppointments} active appointment(s) - Waiting: ${result.WaitingCount}, Consulting: ${result.ConsultingCount}, Completed: ${result.CompletedCount}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment counts by status',
      error: error.message,
    });
  }
};

/**
 * Get count of active tokens
 * Returns count of appointments where AppointmentStatus is 'Waiting' or 'Consulting' and Status is 'Active'
 * Optional query parameters:
 * - appointmentDate: Filter by specific date (YYYY-MM-DD)
 * - doctorId: Filter by specific doctor (UserId)
 */
exports.getTodayOPDPatientsCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientAppointment"
      WHERE "AppointmentDate" = $1::date
      AND "Status" = 'Active'
    `;

    const { rows } = await db.query(query, [today]);

    const count = parseInt(rows[0].count, 10);

    res.status(200).json({
      success: true,
      message: 'Today\'s OPD patients count retrieved successfully',
      date: today,
      count: count,
      data: {
        date: today,
        count: count,
        status: 'Active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s OPD patients count',
      error: error.message,
    });
  }
};

/**
 * Get count of PatientAppointment records with Status = 'Active' and AppointmentStatus IN ('Waiting', 'Consulting')
 */
exports.getActiveWaitingOrConsultingCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientAppointment"
      WHERE "Status" = 'Active'
      AND ("AppointmentStatus" = 'Waiting' OR "AppointmentStatus" = 'Consulting')
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Active appointments count (Waiting or Consulting) retrieved successfully',
      count: count,
      data: {
        count: count,
        status: 'Active',
        appointmentStatus: ['Waiting', 'Consulting']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active waiting or consulting appointments count',
      error: error.message,
    });
  }
};

exports.getActiveTokensCount = async (req, res) => {
  try {
    const { appointmentDate, doctorId } = req.query;
    
    // Build WHERE conditions
    const conditions = [
      'pa."Status" = \'Active\'',
      '(pa."AppointmentStatus" = \'Waiting\' OR pa."AppointmentStatus" = \'Consulting\')'
    ];
    const params = [];
    
    if (appointmentDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-11-30)',
        });
      }
      conditions.push(`pa."AppointmentDate" = $${params.length + 1}`);
      params.push(appointmentDate);
    }
    
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (isNaN(doctorIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid doctorId. Must be a valid integer.',
        });
      }
      conditions.push(`pa."DoctorId" = $${params.length + 1}`);
      params.push(doctorIdInt);
    }
    
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    
    const query = `
      SELECT COUNT(*) AS "ActiveTokensCount"
      FROM "PatientAppointment" pa
      ${whereClause}
    `;
    
    const { rows } = await db.query(query, params);
    
    const count = parseInt(rows[0].ActiveTokensCount, 10) || 0;
    
    res.status(200).json({
      success: true,
      filters: {
        appointmentDate: appointmentDate || null,
        doctorId: doctorId || null,
      },
      count: count,
      message: `Found ${count} active token(s) with status Waiting or Consulting`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active tokens count',
      error: error.message,
    });
  }
};

