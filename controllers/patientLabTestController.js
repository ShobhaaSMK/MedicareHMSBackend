require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const allowedPatientTypes = ['OPD', 'Emergency', 'IPD', 'Direct'];
const allowedLabTestDone = ['Yes', 'No'];
const allowedStatus = ['Active', 'Inactive'];
const allowedTestStatus = ['Pending', 'InProgress', 'Completed'];
const allowedPriority = ['Normal', 'Urgent'];

const mapPatientLabTestRow = (row) => ({
  PatientLabTestsId: row.PatientLabTestsId || row.patientlabtestsid,
  PatientType: row.PatientType || row.patienttype,
  PatientId: row.PatientId || row.patientid,
  LabTestId: row.LabTestId || row.labtestid,
  AppointmentId: row.AppointmentId || row.appointmentid || null,
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
  EmergencyAdmissionId: row.EmergencyAdmissionId || row.emergencyadmissionid || null,
  BillId: row.BillId || row.billid || null,
  OrderedByDoctorId: row.OrderedByDoctorId || row.orderedbydoctorid || null,
  Priority: row.Priority || row.priority,
  LabTestDone: row.LabTestDone || row.labtestdone,
  ReportsUrl: row.ReportsUrl || row.reportsurl,
  TestStatus: row.TestStatus || row.teststatus,
  TestDoneDateTime: row.TestDoneDateTime || row.testdonedatetime,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
  CreatedDate: row.CreatedDate || row.createddate,
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  TestName: row.TestName || row.testname || null,
  DisplayTestId: row.DisplayTestId || row.displaytestid || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
  OrderedByDoctorName: row.OrderedByDoctorName || row.orderedbydoctorname || null,
  AppointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
  BillNo: row.BillNo || row.billno || null,
});

exports.getAllPatientLabTests = async (req, res) => {
  try {
    const { status, patientType, testStatus, patientId, labTestId } = req.query;
    
    // Check if OrderedByDoctorId column exists
    let hasOrderedByDoctorId = false;
    try {
      const columnCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'OrderedByDoctorId'
      `);
      hasOrderedByDoctorId = columnCheck.rows.length > 0;
    } catch (err) {
      // If check fails, assume column doesn't exist
      hasOrderedByDoctorId = false;
    }
    
    let query = `
      SELECT 
        plt.*,
        p."PatientName", p."PatientNo",
        lt."TestName", lt."DisplayTestId",
        lt."TestCategory",
        pa."TokenNo" AS "AppointmentTokenNo",
        b."BillNo",
        pa."PatientAppointmentId",
        pa."AppointmentDate",
        pa."AppointmentTime",
        pa."AppointmentStatus",
        pa."ConsultationCharge",
        pa."Diagnosis" AS "AppointmentDiagnosis",
        p."PatientId" AS "PatientId", 
        p."PhoneNo" AS "PatientPhoneNo",
        p."Gender" AS "PatientGender",
        p."Age" AS "PatientAge",
        plt."OrderedByDoctorId"
      FROM "PatientLabTest" plt
      LEFT JOIN "PatientRegistration" p ON plt."PatientId" = p."PatientId"
      LEFT JOIN "LabTest" lt ON plt."LabTestId" = lt."LabTestId"
      LEFT JOIN "PatientAppointment" pa ON plt."AppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Bills" b ON plt."BillId" = b."BillId"
    `;
    
    // Add OrderedByDoctorName to SELECT if column exists
    if (hasOrderedByDoctorId) {
      query = query.replace(
        'b."BillNo",',
        'b."BillNo",\n        doc."UserName" AS "OrderedByDoctorName",'
      );
      query += '\n      LEFT JOIN "Users" doc ON plt."OrderedByDoctorId" = doc."UserId"';
    }
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`plt."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (patientType) {
      conditions.push(`plt."PatientType" = $${params.length + 1}`);
      params.push(patientType);
    }
    if (testStatus) {
      conditions.push(`plt."TestStatus" = $${params.length + 1}`);
      params.push(testStatus);
    }
    if (patientId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(patientId)) {
        conditions.push(`plt."PatientId" = $${params.length + 1}::uuid`);
        params.push(patientId);
      }
    }
    if (labTestId) {
      const labTestIdInt = parseInt(labTestId, 10);
      if (!isNaN(labTestIdInt)) {
        conditions.push(`plt."LabTestId" = $${params.length + 1}`);
        params.push(labTestIdInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY plt."CreatedDate" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientLabTestRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient lab tests',
      error: error.message,
    });
  }
};

exports.getPatientLabTestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if this is a common endpoint that was accessed via GET instead of POST
    if (id === 'upload-files' || id === 'get-folder') {
      return res.status(405).json({
        success: false,
        message: `Method not allowed. The endpoint '/${id}' requires a ${id === 'upload-files' ? 'POST' : 'GET'} request, but you are using ${req.method}.`,
        hint: id === 'upload-files' 
          ? 'For file uploads, use POST method with multipart/form-data and FormData in your request body.'
          : 'This endpoint should be accessed directly, not as a path parameter.',
      });
    }
    
    // Validate that id is an integer
    const patientLabTestId = parseInt(id, 10);
    if (isNaN(patientLabTestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientLabTestsId. Must be an integer.',
        receivedId: id,
        hint: 'If you are trying to access a specific endpoint, make sure you are using the correct HTTP method (GET, POST, PUT, DELETE).'
      });
    }
    const { rows } = await db.query(
      `
      SELECT 
        plt.*,
        p."PatientName", p."PatientNo",
        lt."TestName", lt."DisplayTestId",
        pa."TokenNo" AS "AppointmentTokenNo",
        b."BillNo"
      FROM "PatientLabTest" plt
      LEFT JOIN "PatientRegistration" p ON plt."PatientId" = p."PatientId"
      LEFT JOIN "LabTest" lt ON plt."LabTestId" = lt."LabTestId"
      LEFT JOIN "PatientAppointment" pa ON plt."AppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Bills" b ON plt."BillId" = b."BillId"
      WHERE plt."PatientLabTestsId" = $1
      `,
      [patientLabTestId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient lab test not found' });
    }
    res.status(200).json({ success: true, data: mapPatientLabTestRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient lab test',
      error: error.message,
    });
  }
};

const validatePatientLabTestPayload = (body, requireAll = true) => {
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

  if (requireAll && !body.LabTestId) {
    errors.push('LabTestId is required');
  }
  if (body.LabTestId !== undefined && body.LabTestId !== null) {
    const labTestIdInt = parseInt(body.LabTestId, 10);
    if (isNaN(labTestIdInt)) {
      errors.push('LabTestId must be a valid integer');
    }
  }

  if (body.AppointmentId !== undefined && body.AppointmentId !== null && body.AppointmentId !== '') {
    const appointmentIdInt = parseInt(body.AppointmentId, 10);
    if (isNaN(appointmentIdInt)) {
      errors.push('AppointmentId must be a valid integer');
    }
  }

  if (body.EmergencyAdmissionId !== undefined && body.EmergencyAdmissionId !== null && body.EmergencyAdmissionId !== '') {
    const emergencyAdmissionIdInt = parseInt(body.EmergencyAdmissionId, 10);
    if (isNaN(emergencyAdmissionIdInt)) {
      errors.push('EmergencyAdmissionId must be a valid integer');
    }
  }

  if (body.BillId !== undefined && body.BillId !== null && body.BillId !== '') {
    const billIdInt = parseInt(body.BillId, 10);
    if (isNaN(billIdInt)) {
      errors.push('BillId must be a valid integer');
    }
  }

  if (requireAll && !body.PatientType) {
    errors.push('PatientType is required');
  }
  if (body.PatientType && !allowedPatientTypes.includes(body.PatientType)) {
    errors.push('PatientType must be OPD, Emergency, IPD, or Direct');
  }

  if (body.LabTestDone && !allowedLabTestDone.includes(body.LabTestDone)) {
    errors.push('LabTestDone must be Yes or No');
  }

  if (body.TestStatus && !allowedTestStatus.includes(body.TestStatus)) {
    errors.push('TestStatus must be Pending, InProgress, or Completed');
  }

  if (body.Priority && !allowedPriority.includes(body.Priority)) {
    errors.push('Priority must be Normal or Urgent');
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.CreatedBy !== undefined && body.CreatedBy !== null) {
    const createdByInt = parseInt(body.CreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('CreatedBy must be a valid integer');
    }
  }

  if (body.OrderedByDoctorId !== undefined && body.OrderedByDoctorId !== null) {
    const orderedByDoctorIdInt = parseInt(body.OrderedByDoctorId, 10);
    if (isNaN(orderedByDoctorIdInt)) {
      errors.push('OrderedByDoctorId must be a valid integer');
    }
  }

  return errors;
};

/**
 * Create a new patient lab test
 * PatientType can be: 'OPD', 'Emergency', 'IPD', or 'Direct'
 * Note: For 'Direct' PatientType, AppointmentId, RoomAdmissionId, and EmergencyAdmissionId should be null
 * as Direct patients don't come through appointments, room admissions, or emergency admissions
 */
exports.createPatientLabTest = async (req, res) => {
  try {
    const errors = validatePatientLabTestPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientType,
      PatientId,
      LabTestId,
      AppointmentId,
      RoomAdmissionId,
      EmergencyAdmissionId,
      BillId,
      OrderedByDoctorId,
      Priority,
      LabTestDone = 'No',
      ReportsUrl,
      TestStatus = 'Pending',
      TestDoneDateTime,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // For Direct PatientType, ensure AppointmentId, RoomAdmissionId, and EmergencyAdmissionId are null
    if (PatientType === 'Direct') {
      if (AppointmentId !== undefined && AppointmentId !== null && AppointmentId !== '') {
        return res.status(400).json({
          success: false,
          message: 'AppointmentId should be null for Direct PatientType',
        });
      }
      if (RoomAdmissionId !== undefined && RoomAdmissionId !== null && RoomAdmissionId !== '') {
        return res.status(400).json({
          success: false,
          message: 'RoomAdmissionId should be null for Direct PatientType',
        });
      }
      if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
        return res.status(400).json({
          success: false,
          message: 'EmergencyAdmissionId should be null for Direct PatientType',
        });
      }
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

    // Validate AppointmentId if provided
    let appointmentIdValue = null;
    if (AppointmentId !== undefined && AppointmentId !== null && AppointmentId !== '') {
      const appointmentIdInt = parseInt(AppointmentId, 10);
      if (isNaN(appointmentIdInt)) {
        return res.status(400).json({ success: false, message: 'AppointmentId must be a valid integer' });
      }
      // Check if appointment exists
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [appointmentIdInt]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AppointmentId does not exist' });
      }
      appointmentIdValue = appointmentIdInt;
    }

    // Validate RoomAdmissionId if provided
    let roomAdmissionIdValue = null;
    if (RoomAdmissionId !== undefined && RoomAdmissionId !== null && RoomAdmissionId !== '') {
      const roomAdmissionIdInt = parseInt(RoomAdmissionId, 10);
      if (isNaN(roomAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'RoomAdmissionId must be a valid integer' });
      }
      // Check if room admission exists
      const roomAdmissionExists = await db.query('SELECT "RoomAdmissionId" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1', [roomAdmissionIdInt]);
      if (roomAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'RoomAdmissionId does not exist' });
      }
      roomAdmissionIdValue = roomAdmissionIdInt;
    }

    // Validate EmergencyAdmissionId if provided
    let emergencyAdmissionIdValue = null;
    if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
      const emergencyAdmissionIdInt = parseInt(EmergencyAdmissionId, 10);
      if (isNaN(emergencyAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId must be a valid integer' });
      }
      // Check if emergency admission exists
      const emergencyAdmissionExists = await db.query('SELECT "EmergencyAdmissionId" FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1', [emergencyAdmissionIdInt]);
      if (emergencyAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId does not exist' });
      }
      emergencyAdmissionIdValue = emergencyAdmissionIdInt;
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

    // Validate OrderedByDoctorId if provided
    let orderedByDoctorIdValue = null;
    if (OrderedByDoctorId !== undefined && OrderedByDoctorId !== null && OrderedByDoctorId !== '') {
      const orderedByDoctorIdInt = parseInt(OrderedByDoctorId, 10);
      if (isNaN(orderedByDoctorIdInt)) {
        return res.status(400).json({ success: false, message: 'OrderedByDoctorId must be a valid integer' });
      }
      // Check if doctor exists
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [orderedByDoctorIdInt]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OrderedByDoctorId does not exist' });
      }
      orderedByDoctorIdValue = orderedByDoctorIdInt;
    }

    // PatientLabTestsId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "PatientLabTest"
        ("PatientType", "PatientId", "LabTestId", "AppointmentId", "RoomAdmissionId", "EmergencyAdmissionId", "BillId", "OrderedByDoctorId",
         "Priority", "LabTestDone", "ReportsUrl", "TestStatus", "TestDoneDateTime",
         "Status", "CreatedBy")
      VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      PatientType,
      PatientId,
      parseInt(LabTestId, 10),
      appointmentIdValue,
      roomAdmissionIdValue,
      emergencyAdmissionIdValue,
      billIdValue,
      orderedByDoctorIdValue,
      Priority ? Priority.trim() : null,
      LabTestDone,
      ReportsUrl ? ReportsUrl.trim() : null,
      TestStatus ? TestStatus.trim() : null,
      TestDoneDateTime || null,
      Status,
      createdByValue, // null is fine for integer columns in PostgreSQL
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient lab test created successfully',
      data: mapPatientLabTestRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId or LabTestId. Please verify the IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating patient lab test',
      error: error.message,
    });
  }
};

exports.updatePatientLabTest = async (req, res) => {
  try {
    const errors = validatePatientLabTestPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    // Validate that id is an integer
    const patientLabTestId = parseInt(id, 10);
    if (isNaN(patientLabTestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientLabTestsId. Must be an integer.'
      });
    }
    const {
      PatientType,
      PatientId,
      LabTestId,
      AppointmentId,
      RoomAdmissionId,
      EmergencyAdmissionId,
      BillId,
      OrderedByDoctorId,
      Priority,
      LabTestDone,
      ReportsUrl,
      TestStatus,
      TestDoneDateTime,
      Status,
      CreatedBy,
    } = req.body;

    // If PatientType is being updated to 'Direct', ensure AppointmentId, RoomAdmissionId, and EmergencyAdmissionId are null
    if (PatientType === 'Direct') {
      if (AppointmentId !== undefined && AppointmentId !== null && AppointmentId !== '') {
        return res.status(400).json({
          success: false,
          message: 'AppointmentId should be null for Direct PatientType',
        });
      }
      if (RoomAdmissionId !== undefined && RoomAdmissionId !== null && RoomAdmissionId !== '') {
        return res.status(400).json({
          success: false,
          message: 'RoomAdmissionId should be null for Direct PatientType',
        });
      }
      if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
        return res.status(400).json({
          success: false,
          message: 'EmergencyAdmissionId should be null for Direct PatientType',
        });
      }
    }

    // Validate AppointmentId if provided
    let appointmentIdValue = null;
    if (AppointmentId !== undefined && AppointmentId !== null && AppointmentId !== '') {
      const appointmentIdInt = parseInt(AppointmentId, 10);
      if (isNaN(appointmentIdInt)) {
        return res.status(400).json({ success: false, message: 'AppointmentId must be a valid integer' });
      }
      // Check if appointment exists
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [appointmentIdInt]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AppointmentId does not exist' });
      }
      appointmentIdValue = appointmentIdInt;
    } else if (AppointmentId === null) {
      appointmentIdValue = null;
    }


    // Validate EmergencyAdmissionId if provided
    let emergencyAdmissionIdValue = null;
    if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
      const emergencyAdmissionIdInt = parseInt(EmergencyAdmissionId, 10);
      if (isNaN(emergencyAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId must be a valid integer' });
      }
      // Check if emergency admission exists
      const emergencyAdmissionExists = await db.query('SELECT "EmergencyAdmissionId" FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1', [emergencyAdmissionIdInt]);
      if (emergencyAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId does not exist' });
      }
      emergencyAdmissionIdValue = emergencyAdmissionIdInt;
    } else if (EmergencyAdmissionId === null) {
      emergencyAdmissionIdValue = null;
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

    // Validate OrderedByDoctorId if provided
    let orderedByDoctorIdValue = null;
    if (OrderedByDoctorId !== undefined && OrderedByDoctorId !== null && OrderedByDoctorId !== '') {
      const orderedByDoctorIdInt = parseInt(OrderedByDoctorId, 10);
      if (isNaN(orderedByDoctorIdInt)) {
        return res.status(400).json({ success: false, message: 'OrderedByDoctorId must be a valid integer' });
      }
      // Check if doctor exists
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [orderedByDoctorIdInt]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OrderedByDoctorId does not exist' });
      }
      orderedByDoctorIdValue = orderedByDoctorIdInt;
    } else if (OrderedByDoctorId === null) {
      orderedByDoctorIdValue = null;
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
      UPDATE "PatientLabTest"
      SET
        "PatientType" = COALESCE($1, "PatientType"),
        "PatientId" = COALESCE($2::uuid, "PatientId"),
        "LabTestId" = COALESCE($3, "LabTestId"),
        "AppointmentId" = COALESCE($4, "AppointmentId"),
        "EmergencyAdmissionId" = COALESCE($5, "EmergencyAdmissionId"),
        "BillId" = COALESCE($6, "BillId"),
        "OrderedByDoctorId" = COALESCE($7, "OrderedByDoctorId"),
        "Priority" = COALESCE($8, "Priority"),
        "LabTestDone" = COALESCE($9, "LabTestDone"),
        "ReportsUrl" = COALESCE($10, "ReportsUrl"),
        "TestStatus" = COALESCE($11, "TestStatus"),
        "TestDoneDateTime" = COALESCE($12, "TestDoneDateTime"),
        "Status" = COALESCE($13, "Status"),
        "CreatedBy" = COALESCE($14, "CreatedBy")
      WHERE "PatientLabTestsId" = $15
      RETURNING *;
    `;

    const updateParams = [
      PatientType || null,
      PatientId !== undefined && PatientId !== null ? PatientId : null,
      LabTestId !== undefined && LabTestId !== null ? parseInt(LabTestId, 10) : null,
      appointmentIdValue,
      emergencyAdmissionIdValue,
      billIdValue,
      orderedByDoctorIdValue,
      Priority ? Priority.trim() : null,
      LabTestDone || null,
      ReportsUrl ? ReportsUrl.trim() : null,
      TestStatus ? TestStatus.trim() : null,
      TestDoneDateTime || null,
      Status || null,
      createdByValue,
      patientLabTestId,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient lab test not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient lab test updated successfully',
      data: mapPatientLabTestRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId or LabTestId. Please verify the IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient lab test',
      error: error.message,
    });
  }
};

exports.deletePatientLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate that id is an integer
    const patientLabTestId = parseInt(id, 10);
    if (isNaN(patientLabTestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientLabTestsId. Must be an integer.'
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "PatientLabTest" WHERE "PatientLabTestsId" = $1 RETURNING *;',
      [patientLabTestId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient lab test not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient lab test deleted successfully',
      data: mapPatientLabTestRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient lab test',
      error: error.message,
    });
  }
};

/**
 * Get TestStatus-wise counts and total active count of PatientLabTests
 * Returns counts for Pending, InProgress, Completed, and TotalActive
 * Optional query parameters:
 * - status: Filter by Status (Active, Inactive)
 * - patientId: Filter by specific patient (UUID)
 * - labTestId: Filter by specific lab test (Integer)
 * - createdDate: Filter by creation date (YYYY-MM-DD)
 */
exports.getTestStatusWiseCounts = async (req, res) => {
  try {
    const { status, patientId, labTestId, createdDate } = req.query;

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    // Default to Active status if not specified
    const statusFilter = status || 'Active';
    conditions.push(`plt."Status" = $${params.length + 1}`);
    params.push(statusFilter);

    if (patientId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(patientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid patientId. Must be a valid UUID.',
        });
      }
      conditions.push(`plt."PatientId" = $${params.length + 1}::uuid`);
      params.push(patientId);
    }

    if (labTestId) {
      const labTestIdInt = parseInt(labTestId, 10);
      if (isNaN(labTestIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid labTestId. Must be a valid integer.',
        });
      }
      conditions.push(`plt."LabTestId" = $${params.length + 1}`);
      params.push(labTestIdInt);
    }

    if (createdDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(createdDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-11-30)',
        });
      }
      conditions.push(`DATE(plt."CreatedDate") = $${params.length + 1}`);
      params.push(createdDate);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get all counts in a single query using conditional aggregation
    const query = `
      SELECT 
        COUNT(*) AS "TotalActiveCount",
        COUNT(CASE WHEN plt."TestStatus" = 'Pending' THEN 1 END) AS "PendingCount",
        COUNT(CASE WHEN plt."TestStatus" = 'InProgress' THEN 1 END) AS "InProgressCount",
        COUNT(CASE WHEN plt."TestStatus" = 'Completed' THEN 1 END) AS "CompletedCount",
        COUNT(CASE WHEN plt."TestStatus" IS NULL THEN 1 END) AS "NullStatusCount"
      FROM "PatientLabTest" plt
      ${whereClause}
    `;

    const { rows } = await db.query(query, params);

    const result = {
      TotalActiveCount: parseInt(rows[0].TotalActiveCount, 10) || 0,
      PendingCount: parseInt(rows[0].PendingCount, 10) || 0,
      InProgressCount: parseInt(rows[0].InProgressCount, 10) || 0,
      CompletedCount: parseInt(rows[0].CompletedCount, 10) || 0,
      NullStatusCount: parseInt(rows[0].NullStatusCount, 10) || 0,
    };

    res.status(200).json({
      success: true,
      filters: {
        status: statusFilter,
        patientId: patientId || null,
        labTestId: labTestId || null,
        createdDate: createdDate || null,
      },
      counts: result,
      message: `Found ${result.TotalActiveCount} active patient lab test(s) - Pending: ${result.PendingCount}, InProgress: ${result.InProgressCount}, Completed: ${result.CompletedCount}${result.NullStatusCount > 0 ? `, Null/Unset: ${result.NullStatusCount}` : ''}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching test status-wise counts',
      error: error.message,
    });
  }
};

/**
 * Get PatientLabTest records with comprehensive details including:
 * - PatientAppointment details with Doctor information
 * - RoomAdmission details with Doctor information
 * - Patient details
 * - LabTest details
 * Optional query parameters:
 * - status: Filter by Status (Active, Inactive)
 * - testStatus: Filter by TestStatus (Pending, InProgress, Completed)
 * - patientId: Filter by specific patient (UUID)
 * - labTestId: Filter by specific lab test (Integer)
 * - appointmentId: Filter by specific appointment (Integer)
 */
exports.getPatientLabTestsWithDetails = async (req, res) => {
  try {
    const { status, testStatus, patientId, labTestId, appointmentId, roomAdmissionId, emergencyAdmissionId } = req.query;

    // Check if OrderedByDoctorId column exists
    let hasOrderedByDoctorId = false;
    try {
      const columnCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'OrderedByDoctorId'
      `);
      hasOrderedByDoctorId = columnCheck.rows.length > 0;
    } catch (err) {
      hasOrderedByDoctorId = false;
    }

    // Check CreatedBy column type - it might be UUID or INTEGER
    let createdByIsInteger = false;
    try {
      const createdByCheck = await db.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'CreatedBy'
      `);
      createdByIsInteger = createdByCheck.rows.length > 0 && createdByCheck.rows[0].data_type === 'integer';
    } catch (err) {
      createdByIsInteger = false;
    }

    let query = `
      SELECT 
        -- PatientLabTest fields
        plt."PatientLabTestsId",
        plt."PatientType",
        plt."PatientId",
        plt."LabTestId",
        plt."AppointmentId",
        plt."RoomAdmissionId",
        plt."EmergencyAdmissionId",
        plt."BillId",
        ${hasOrderedByDoctorId ? 'plt."OrderedByDoctorId",' : ''}
        plt."Priority",
        plt."LabTestDone",
        plt."ReportsUrl",
        plt."TestStatus",
        plt."TestDoneDateTime",
        
        plt."Status",
        plt."CreatedBy",
        plt."CreatedDate",
        
        -- Created By User details
        ${createdByIsInteger ? 'created_by_user."UserName" AS "CreatedByName",' : ''}
        ${createdByIsInteger ? 'created_by_user."EmailId" AS "CreatedByEmail",' : ''}
        
        -- Patient details
        p."PatientName",
        p."PatientNo",
        p."PhoneNo" AS "PatientPhoneNo",
        p."Gender" AS "PatientGender",
        p."Age" AS "PatientAge",
        p."Address" AS "PatientAddress",
        
        -- LabTest details
        lt."TestName",
        lt."DisplayTestId",
        
        lt."TestCategory",
        lt."Description" AS "LabTestDescription",
        lt."Charges" AS "LabTestCharges",
        
        -- PatientAppointment details
        pa."PatientAppointmentId",
        pa."AppointmentDate",
        pa."AppointmentTime",
        pa."TokenNo" AS "AppointmentTokenNo",
        pa."AppointmentStatus",
        pa."ConsultationCharge",
        pa."Diagnosis" AS "AppointmentDiagnosis",
        
        -- Appointment Doctor details
        appt_doctor."UserId" AS "AppointmentDoctorId",
        appt_doctor."UserName" AS "AppointmentDoctorName",
        appt_doctor."EmailId" AS "AppointmentDoctorEmail",
        appt_doctor."PhoneNo" AS "AppointmentDoctorPhone",
        appt_doctor."DoctorQualification" AS "AppointmentDoctorQualification",
        appt_dept."DepartmentName" AS "AppointmentDoctorDepartment",
        ${hasOrderedByDoctorId ? `-- Ordered By Doctor details
        doc."UserName" AS "OrderedByDoctorName",
        doc."EmailId" AS "OrderedByDoctorEmail",
        doc."PhoneNo" AS "OrderedByDoctorPhone",
        ` : ''}
        -- Bill details
        b."BillNo",
        b."BillDateTime",
        b."Amount" AS "BillAmount",
        b."PaidStatus"
      FROM "PatientLabTest" plt
      LEFT JOIN "PatientRegistration" p ON plt."PatientId" = p."PatientId"
      LEFT JOIN "LabTest" lt ON plt."LabTestId" = lt."LabTestId"
      LEFT JOIN "PatientAppointment" pa ON plt."AppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" appt_doctor ON pa."DoctorId" = appt_doctor."UserId"
      LEFT JOIN "DoctorDepartment" appt_dept ON appt_doctor."DoctorDepartmentId" = appt_dept."DoctorDepartmentId"
      LEFT JOIN "RoomAdmission" ra ON plt."RoomAdmissionId" = ra."RoomAdmissionId"
      LEFT JOIN "Users" room_doctor ON ra."AdmittingDoctorId" = room_doctor."UserId"
      LEFT JOIN "DoctorDepartment" room_dept ON room_doctor."DoctorDepartmentId" = room_dept."DoctorDepartmentId"
      LEFT JOIN "Bills" b ON plt."BillId" = b."BillId"
      ${createdByIsInteger ? 'LEFT JOIN "Users" created_by_user ON plt."CreatedBy" = created_by_user."UserId"' : ''}
      ${hasOrderedByDoctorId ? 'LEFT JOIN "Users" doc ON plt."OrderedByDoctorId" = doc."UserId"' : ''}
    `;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push(`plt."Status" = $${params.length + 1}`);
      params.push(status);
    }

    if (testStatus) {
      conditions.push(`plt."TestStatus" = $${params.length + 1}`);
      params.push(testStatus);
    }

    if (patientId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(patientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid patientId. Must be a valid UUID.',
        });
      }
      conditions.push(`plt."PatientId" = $${params.length + 1}::uuid`);
      params.push(patientId);
    }

    if (labTestId) {
      const labTestIdInt = parseInt(labTestId, 10);
      if (isNaN(labTestIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid labTestId. Must be a valid integer.',
        });
      }
      conditions.push(`plt."LabTestId" = $${params.length + 1}`);
      params.push(labTestIdInt);
    }

    if (appointmentId) {
      const appointmentIdInt = parseInt(appointmentId, 10);
      if (isNaN(appointmentIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointmentId. Must be a valid integer.',
        });
      }
      conditions.push(`plt."AppointmentId" = $${params.length + 1}`);
      params.push(appointmentIdInt);
    }

    if (roomAdmissionId) {
      const roomAdmissionIdInt = parseInt(roomAdmissionId, 10);
      if (isNaN(roomAdmissionIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid roomAdmissionId. Must be a valid integer.',
        });
      }
      conditions.push(`plt."RoomAdmissionId" = $${params.length + 1}`);
      params.push(roomAdmissionIdInt);
    }

    if (emergencyAdmissionId) {
      const emergencyAdmissionIdInt = parseInt(emergencyAdmissionId, 10);
      if (isNaN(emergencyAdmissionIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid emergencyAdmissionId. Must be a valid integer.',
        });
      }
      conditions.push(`plt."EmergencyAdmissionId" = $${params.length + 1}`);
      params.push(emergencyAdmissionIdInt);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY plt."CreatedDate" DESC';

    const { rows } = await db.query(query, params);

    // Map rows to structured response
    const mappedData = rows.map(row => ({
      // PatientLabTest basic info
      PatientLabTestsId: row.PatientLabTestsId || row.patientlabtestsid,
      PatientType: row.PatientType || row.patienttype,
      AppointmentId: row.AppointmentId || row.appointmentid || null,
      RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
      EmergencyAdmissionId: row.EmergencyAdmissionId || row.emergencyadmissionid || null,
      BillId: row.BillId || row.billid || null,
      TestStatus: row.TestStatus || row.teststatus,
      LabTestDone: row.LabTestDone || row.labtestdone,
      Priority: row.Priority || row.priority,
      ReportsUrl: row.ReportsUrl || row.reportsurl,
      TestDoneDateTime: row.TestDoneDateTime || row.testdonedatetime,
      Status: row.Status || row.status,
      CreatedDate: row.CreatedDate || row.createddate,

      // Patient details
      Patient: {
        PatientId: row.PatientId || row.patientid,
        PatientName: row.PatientName || row.patientname,
        PatientNo: row.PatientNo || row.patientno,
        PhoneNo: row.PatientPhoneNo || row.patientphoneno,
        Gender: row.PatientGender || row.patientgender,
        Age: row.PatientAge || row.patientage,
        Address: row.PatientAddress || row.patientaddress,
      },

      // LabTest details
      LabTest: {
        LabTestId: row.LabTestId || row.labtestid,
        TestName: row.TestName || row.testname,
        DisplayTestId: row.DisplayTestId || row.displaytestid,
        TestCategory: row.TestCategory || row.testcategory,
        Description: row.LabTestDescription || row.labtestdescription,
        Charges: row.LabTestCharges !== undefined && row.LabTestCharges !== null ? parseFloat(row.LabTestCharges) : null,
      },

      // PatientAppointment details
      Appointment: row.PatientAppointmentId ? {
        PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid,
        AppointmentDate: row.AppointmentDate || row.appointmentdate,
        AppointmentTime: row.AppointmentTime || row.appointmenttime,
        TokenNo: row.AppointmentTokenNo || row.appointmenttokenno,
        AppointmentStatus: row.AppointmentStatus || row.appointmentstatus,
        ConsultationCharge: row.ConsultationCharge !== undefined && row.ConsultationCharge !== null ? parseFloat(row.ConsultationCharge) : null,
        Diagnosis: row.AppointmentDiagnosis || row.appointmentdiagnosis,
        Doctor: row.AppointmentDoctorId ? {
          DoctorId: row.AppointmentDoctorId || row.appointmentdoctorid,
          DoctorName: row.AppointmentDoctorName || row.appointmentdoctorname,
          Email: row.AppointmentDoctorEmail || row.appointmentdoctoremail,
          Phone: row.AppointmentDoctorPhone || row.appointmentdoctorphone,
          Qualification: row.AppointmentDoctorQualification || row.appointmentdoctorqualification,
          Department: row.AppointmentDoctorDepartment || row.appointmentdoctordepartment,
        } : null,
      } : null,

      // RoomAdmission details
      RoomAdmission: row.RoomAdmissionId ? {
        RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid,
        RoomAllocationDate: row.RoomAllocationDate || row.roomallocationdate,
        RoomVacantDate: row.RoomVacantDate || row.roomvacantdate,
        AdmissionStatus: row.AdmissionStatus || row.admissionstatus,
        CaseSheetDetails: row.CaseSheetDetails || row.casesheetdetails,
        CurrentBedNo: row.CurrentBedNo || row.currentbedno,
        RoomBedNo: row.RoomBedNo || row.roombedno,
        RoomNo: row.RoomNo || row.roomno,
        RoomCategory: row.RoomCategory || row.roomcategory,
        RoomType: row.RoomType || row.roomtype,
        Doctor: row.RoomAdmissionDoctorId ? {
          DoctorId: row.RoomAdmissionDoctorId || row.roomadmissiondoctorid,
          DoctorName: row.RoomAdmissionDoctorName || row.roomadmissiondoctorname,
          Email: row.RoomAdmissionDoctorEmail || row.roomadmissiondoctoremail,
          Phone: row.RoomAdmissionDoctorPhone || row.roomadmissiondoctorphone,
          Qualification: row.RoomAdmissionDoctorQualification || row.roomadmissiondoctorqualification,
          Department: row.RoomAdmissionDoctorDepartment || row.roomadmissiondoctordepartment,
        } : null,
      } : null,

      // Bill details
      Bill: row.BillId ? {
        BillId: row.BillId || row.billid,
        BillNo: row.BillNo || row.billno,
        BillDateTime: row.BillDateTime || row.billdatetime,
        Amount: row.BillAmount !== undefined && row.BillAmount !== null ? parseFloat(row.BillAmount) : null,
        PaidStatus: row.PaidStatus || row.paidstatus,
      } : null,

      // Created By
      CreatedBy: row.CreatedBy ? {
        UserId: row.CreatedBy || row.createdby,
        UserName: createdByIsInteger ? (row.CreatedByName || row.createdbyname) : null,
        Email: createdByIsInteger ? (row.CreatedByEmail || row.createdbyemail) : null,
      } : null,
    }));

    res.status(200).json({
      success: true,
      count: mappedData.length,
      filters: {
        status: status || null,
        testStatus: testStatus || null,
        patientId: patientId || null,
        labTestId: labTestId || null,
        appointmentId: appointmentId || null,
        roomAdmissionId: roomAdmissionId || null,
        emergencyAdmissionId: emergencyAdmissionId || null,
      },
      data: mappedData,
    });
  } catch (error) {
    console.error('Error in getPatientLabTestsWithDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient lab tests with details',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Get Patient Lab Tests With Details by RoomAdmissionId
 * Returns detailed patient lab test data for a specific roomAdmissionId
 * Path parameter: roomAdmissionId (required)
 */
exports.getPatientLabTestsWithDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const roomAdmissionId = parseInt(id, 10);
    
    if (isNaN(roomAdmissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomAdmissionId. Must be an integer.'
      });
    }
    
    let query = `
      SELECT 
        -- PatientLabTest fields
        plt."PatientLabTestsId",
        plt."PatientType",
        plt."PatientId",
        plt."LabTestId",
        plt."AppointmentId",
        plt."RoomAdmissionId",
        plt."EmergencyAdmissionId",
        plt."BillId",
        plt."Priority",
        plt."LabTestDone",
        plt."ReportsUrl",
        plt."TestStatus",
        plt."TestDoneDateTime",
        plt."Status",
        plt."CreatedBy",
        plt."CreatedDate",
        
        -- Patient details
        p."PatientName",
        p."PatientNo",
        p."PhoneNo" AS "PatientPhoneNo",
        p."Gender" AS "PatientGender",
        p."Age" AS "PatientAge",
        p."Address" AS "PatientAddress",
        
        -- LabTest details
        lt."TestName",
        lt."DisplayTestId",
        lt."TestCategory",
        lt."Description" AS "LabTestDescription",
        lt."Charges" AS "LabTestCharges",
        
        -- PatientAppointment details
        pa."PatientAppointmentId",
        pa."AppointmentDate",
        pa."AppointmentTime",
        pa."TokenNo" AS "AppointmentTokenNo",
        pa."AppointmentStatus",
        pa."ConsultationCharge",
        pa."Diagnosis" AS "AppointmentDiagnosis",
        
        -- Appointment Doctor details
        appt_doctor."UserId" AS "AppointmentDoctorId",
        appt_doctor."UserName" AS "AppointmentDoctorName",
        appt_doctor."EmailId" AS "AppointmentDoctorEmail",
        appt_doctor."PhoneNo" AS "AppointmentDoctorPhone",
        appt_doctor."DoctorQualification" AS "AppointmentDoctorQualification",
        appt_dept."DepartmentName" AS "AppointmentDoctorDepartment",
        
        -- RoomAdmission details
        ra."RoomAdmissionId",
        ra."RoomAllocationDate",
        ra."RoomVacantDate",
        ra."AdmissionStatus",
        ra."CaseSheetDetails",
        
        -- RoomBeds details
        rb."BedNo" AS "RoomBedNo",
        rb."RoomNo",
        rb."RoomType" AS "RoomCategory",
        rb."RoomType",
        
        -- Room Admission Doctor details
        room_doctor."UserId" AS "RoomAdmissionDoctorId",
        room_doctor."UserName" AS "RoomAdmissionDoctorName",
        room_doctor."EmailId" AS "RoomAdmissionDoctorEmail",
        room_doctor."PhoneNo" AS "RoomAdmissionDoctorPhone",
        room_doctor."DoctorQualification" AS "RoomAdmissionDoctorQualification",
        room_dept."DepartmentName" AS "RoomAdmissionDoctorDepartment",
        
        -- Bill details
        b."BillNo",
        b."BillDateTime",
        b."Amount" AS "BillAmount",
        b."PaidStatus"
      FROM "PatientLabTest" plt
      LEFT JOIN "PatientRegistration" p ON plt."PatientId" = p."PatientId"
      LEFT JOIN "LabTest" lt ON plt."LabTestId" = lt."LabTestId"
      LEFT JOIN "PatientAppointment" pa ON plt."AppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" appt_doctor ON pa."DoctorId" = appt_doctor."UserId"
      LEFT JOIN "DoctorDepartment" appt_dept ON appt_doctor."DoctorDepartmentId" = appt_dept."DoctorDepartmentId"
      LEFT JOIN "RoomAdmission" ra ON plt."RoomAdmissionId" = ra."RoomAdmissionId"
      LEFT JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      LEFT JOIN "Users" room_doctor ON ra."AdmittingDoctorId" = room_doctor."UserId"
      LEFT JOIN "DoctorDepartment" room_dept ON room_doctor."DoctorDepartmentId" = room_dept."DoctorDepartmentId"
      LEFT JOIN "Bills" b ON plt."BillId" = b."BillId"
      WHERE plt."RoomAdmissionId" = $1
      ORDER BY plt."CreatedDate" DESC
    `;
    
    const { rows } = await db.query(query, [roomAdmissionId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No patient lab tests found for RoomAdmissionId ${roomAdmissionId}`
      });
    }
    
    // Map rows to structured response
    const mappedData = rows.map(row => ({
      // PatientLabTest basic info
      PatientLabTestsId: row.PatientLabTestsId || row.patientlabtestsid,
      PatientType: row.PatientType || row.patienttype,
      AppointmentId: row.AppointmentId || row.appointmentid || null,
      TestStatus: row.TestStatus || row.teststatus,
      LabTestDone: row.LabTestDone || row.labtestdone,
      Priority: row.Priority || row.priority,
      ReportsUrl: row.ReportsUrl || row.reportsurl,
      TestDoneDateTime: row.TestDoneDateTime || row.testdonedatetime,
      Status: row.Status || row.status,
      CreatedDate: row.CreatedDate || row.createddate,
      
      // Patient details
      Patient: {
        PatientId: row.PatientId || row.patientid,
        PatientName: row.PatientName || row.patientname,
        PatientNo: row.PatientNo || row.patientno,
        PhoneNo: row.PatientPhoneNo || row.patientphoneno,
        Gender: row.PatientGender || row.patientgender,
        Age: row.PatientAge || row.patientage,
        Address: row.PatientAddress || row.patientaddress,
      },
      
      // LabTest details
      LabTest: {
        LabTestId: row.LabTestId || row.labtestid,
        TestName: row.TestName || row.testname,
        DisplayTestId: row.DisplayTestId || row.displaytestid,
        TestCategory: row.TestCategory || row.testcategory,
        Description: row.LabTestDescription || row.labtestdescription,
        Charges: row.LabTestCharges !== undefined && row.LabTestCharges !== null ? parseFloat(row.LabTestCharges) : null,
      },
      
      // PatientAppointment details
      Appointment: row.PatientAppointmentId ? {
        PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid,
        AppointmentDate: row.AppointmentDate || row.appointmentdate,
        AppointmentTime: row.AppointmentTime || row.appointmenttime,
        TokenNo: row.AppointmentTokenNo || row.appointmenttokenno,
        AppointmentStatus: row.AppointmentStatus || row.appointmentstatus,
        ConsultationCharge: row.ConsultationCharge !== undefined && row.ConsultationCharge !== null ? parseFloat(row.ConsultationCharge) : null,
        Diagnosis: row.AppointmentDiagnosis || row.appointmentdiagnosis,
        Doctor: row.AppointmentDoctorId ? {
          DoctorId: row.AppointmentDoctorId || row.appointmentdoctorid,
          DoctorName: row.AppointmentDoctorName || row.appointmentdoctorname,
          Email: row.AppointmentDoctorEmail || row.appointmentdoctoremail,
          Phone: row.AppointmentDoctorPhone || row.appointmentdoctorphone,
          Qualification: row.AppointmentDoctorQualification || row.appointmentdoctorqualification,
          Department: row.AppointmentDoctorDepartment || row.appointmentdoctordepartment,
        } : null,
      } : null,
      
      // RoomAdmission details
      RoomAdmission: row.RoomAdmissionId ? {
        RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid,
        RoomAllocationDate: row.RoomAllocationDate || row.roomallocationdate,
        RoomVacantDate: row.RoomVacantDate || row.roomvacantdate,
        AdmissionStatus: row.AdmissionStatus || row.admissionstatus,
        CaseSheetDetails: row.CaseSheetDetails || row.casesheetdetails,
        RoomBedNo: row.RoomBedNo || row.roombedno,
        RoomNo: row.RoomNo || row.roomno,
        RoomCategory: row.RoomCategory || row.roomcategory,
        RoomType: row.RoomType || row.roomtype,
        Doctor: row.RoomAdmissionDoctorId ? {
          DoctorId: row.RoomAdmissionDoctorId || row.roomadmissiondoctorid,
          DoctorName: row.RoomAdmissionDoctorName || row.roomadmissiondoctorname,
          Email: row.RoomAdmissionDoctorEmail || row.roomadmissiondoctoremail,
          Phone: row.RoomAdmissionDoctorPhone || row.roomadmissiondoctorphone,
          Qualification: row.RoomAdmissionDoctorQualification || row.roomadmissiondoctorqualification,
          Department: row.RoomAdmissionDoctorDepartment || row.roomadmissiondoctordepartment,
        } : null,
      } : null,
      
      // Bill details
      Bill: row.BillId ? {
        BillId: row.BillId || row.billid,
        BillNo: row.BillNo || row.billno,
        BillDateTime: row.BillDateTime || row.billdatetime,
        Amount: row.BillAmount !== undefined && row.BillAmount !== null ? parseFloat(row.BillAmount) : null,
        PaidStatus: row.PaidStatus || row.paidstatus,
      } : null,
      
      // Created By
      CreatedBy: row.CreatedBy ? {
        UserId: row.CreatedBy || row.createdby,
        UserName: row.CreatedByName || row.createdbyname,
        Email: row.CreatedByEmail || row.createdbyemail,
      } : null,
    }));
    
    res.status(200).json({
      success: true,
      message: `Patient lab tests retrieved successfully for RoomAdmissionId ${roomAdmissionId}`,
      count: mappedData.length,
      roomAdmissionId: roomAdmissionId,
      data: mappedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient lab tests with details by RoomAdmissionId',
      error: error.message,
    });
  }
};

/**
 * Get OPD/IPD wise counts of PatientLabTests
 * Returns counts for OPD (PatientAppointmentId) and IPD (RoomAdmissionId)
 * Optional query parameters:
 * - status: Filter by Status (Active, Inactive)
 * - testStatus: Filter by TestStatus (Pending, InProgress, Completed)
 */
exports.getOPDIPDWiseCounts = async (req, res) => {
  try {
    const { status, testStatus } = req.query;

    let query = `
      SELECT
        COUNT(*) FILTER (WHERE plt."AppointmentId" IS NOT NULL) AS "OPDCount",
        COUNT(*) FILTER (WHERE plt."EmergencyAdmissionId" IS NOT NULL) AS "EmergencyCount",
        COUNT(*) FILTER (WHERE plt."AppointmentId" IS NOT NULL AND plt."EmergencyAdmissionId" IS NOT NULL) AS "BothCount",
        COUNT(*) FILTER (WHERE plt."AppointmentId" IS NULL AND plt."EmergencyAdmissionId" IS NULL) AS "DirectCount",
        COUNT(*) AS "TotalCount"
      FROM "PatientLabTest" plt
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND plt."Status" = $${params.length + 1}`;
      params.push(status);
    }

    if (testStatus) {
      query += ` AND plt."TestStatus" = $${params.length + 1}`;
      params.push(testStatus);
    }

    const { rows } = await db.query(query, params);

    const result = {
      OPDCount: parseInt(rows[0].OPDCount, 10) || 0,
      IPDCount: parseInt(rows[0].IPDCount, 10) || 0,
      BothCount: parseInt(rows[0].BothCount, 10) || 0,
      DirectCount: parseInt(rows[0].DirectCount, 10) || 0,
      TotalCount: parseInt(rows[0].TotalCount, 10) || 0,
    };

    res.status(200).json({
      success: true,
      filters: {
        status: status || null,
        testStatus: testStatus || null,
      },
      counts: result,
      message: `OPD: ${result.OPDCount}, Emergency: ${result.EmergencyCount}, Direct: ${result.DirectCount}, Total: ${result.TotalCount}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OPD/IPD wise counts',
      error: error.message,
    });
  }
};

/**
 * Get LabTest wise counts of PatientLabTests
 * Returns counts grouped by LabTest
 * Optional query parameters:
 * - status: Filter by Status (Active, Inactive)
 * - testStatus: Filter by TestStatus (Pending, InProgress, Completed)
 * - patientType: Filter by PatientType (OPD, IPD, Emergency, Direct)
 */
exports.getLabTestWiseCounts = async (req, res) => {
  try {
    const { status, testStatus, patientType } = req.query;

    let query = `
      SELECT
        lt."LabTestId",
        lt."TestName",
        lt."DisplayTestId",
        lt."TestCategory",
        COUNT(plt."PatientLabTestsId") AS "TotalCount",
        COUNT(plt."PatientLabTestsId") FILTER (WHERE plt."Status" = $1) AS "ActiveCount",
        COUNT(plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'Pending') AS "PendingCount",
        COUNT(plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'InProgress') AS "InProgressCount",
        COUNT(plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'Completed') AS "CompletedCount",
        COUNT(plt."PatientLabTestsId") FILTER (WHERE plt."AppointmentId" IS NOT NULL) AS "OPDCount",
        COUNT(plt."PatientLabTestsId") FILTER (WHERE plt."EmergencyAdmissionId" IS NOT NULL) AS "EmergencyCount"
      FROM "LabTest" lt
      LEFT JOIN "PatientLabTest" plt ON lt."LabTestId" = plt."LabTestId"
      WHERE 1=1
    `;
    const params = [];
    const statusFilter = status || 'Active';
    params.push(statusFilter);

    if (status) {
      query += ` AND (plt."Status" = $${params.length} OR plt."Status" IS NULL)`;
    }

    if (testStatus) {
      query += ` AND plt."TestStatus" = $${params.length + 1}`;
      params.push(testStatus);
    }

    if (patientType) {
      query += ` AND plt."PatientType" = $${params.length + 1}`;
      params.push(patientType);
    }

    query += `
      GROUP BY lt."LabTestId", lt."TestName", lt."DisplayTestId", lt."TestCategory"
      ORDER BY "TotalCount" DESC, lt."TestName" ASC
    `;

    const { rows } = await db.query(query, params);

    const mappedData = rows.map(row => ({
      LabTestId: row.LabTestId,
      TestName: row.TestName,
      DisplayTestId: row.DisplayTestId,
      TestCategory: row.TestCategory,
      TotalCount: parseInt(row.TotalCount, 10) || 0,
      ActiveCount: parseInt(row.ActiveCount, 10) || 0,
      PendingCount: parseInt(row.PendingCount, 10) || 0,
      InProgressCount: parseInt(row.InProgressCount, 10) || 0,
      CompletedCount: parseInt(row.CompletedCount, 10) || 0,
      OPDCount: parseInt(row.OPDCount, 10) || 0,
      IPDCount: parseInt(row.IPDCount, 10) || 0,
    }));

    const totalCounts = mappedData.reduce((acc, item) => ({
      TotalCount: acc.TotalCount + item.TotalCount,
      ActiveCount: acc.ActiveCount + item.ActiveCount,
      PendingCount: acc.PendingCount + item.PendingCount,
      InProgressCount: acc.InProgressCount + item.InProgressCount,
      CompletedCount: acc.CompletedCount + item.CompletedCount,
      OPDCount: acc.OPDCount + item.OPDCount,
      IPDCount: acc.IPDCount + item.IPDCount,
    }), { TotalCount: 0, ActiveCount: 0, PendingCount: 0, InProgressCount: 0, CompletedCount: 0, OPDCount: 0, IPDCount: 0 });

    res.status(200).json({
      success: true,
      filters: {
        status: status || null,
        testStatus: testStatus || null,
        patientType: patientType || null,
      },
      summary: totalCounts,
      count: mappedData.length,
      data: mappedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab test wise counts',
      error: error.message,
    });
  }
};

/**
 * Get Doctor wise counts of PatientLabTests
 * Returns counts grouped by Doctor (from both PatientAppointment and RoomAdmission)
 * Optional query parameters:
 * - status: Filter by Status (Active, Inactive)
 * - testStatus: Filter by TestStatus (Pending, InProgress, Completed)
 * - patientType: Filter by PatientType (OPD, IPD, Emergency, Direct)
 */
exports.getDoctorWiseCounts = async (req, res) => {
  try {
    const { status, testStatus, patientType } = req.query;

    const statusFilter = status || 'Active';
    let query = `
      SELECT
        COALESCE(appt_doctor."UserId", room_doctor."UserId") AS "DoctorId",
        COALESCE(appt_doctor."UserName", room_doctor."UserName") AS "DoctorName",
        COALESCE(appt_doctor."EmailId", room_doctor."EmailId") AS "DoctorEmail",
        COALESCE(appt_doctor."PhoneNo", room_doctor."PhoneNo") AS "DoctorPhone",
        COALESCE(appt_doctor."DoctorQualification", room_doctor."DoctorQualification") AS "DoctorQualification",
        COALESCE(appt_dept."DepartmentName", room_dept."DepartmentName") AS "DepartmentName",
        COUNT(DISTINCT plt."PatientLabTestsId") AS "TotalCount",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."Status" = $1) AS "ActiveCount",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'Pending') AS "PendingCount",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'InProgress') AS "InProgressCount",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."TestStatus" = 'Completed') AS "CompletedCount",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."AppointmentId" IS NOT NULL) AS "OPDCount",
        COUNT(DISTINCT plt."PatientLabTestsId") FILTER (WHERE plt."EmergencyAdmissionId" IS NOT NULL) AS "EmergencyCount"
      FROM "PatientLabTest" plt
      LEFT JOIN "PatientAppointment" pa ON plt."AppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" appt_doctor ON pa."DoctorId" = appt_doctor."UserId"
      LEFT JOIN "DoctorDepartment" appt_dept ON appt_doctor."DoctorDepartmentId" = appt_dept."DoctorDepartmentId"
      WHERE appt_doctor."UserId" IS NOT NULL
    `;
    const params = [statusFilter];

    if (status) {
      query += ` AND plt."Status" = $1`;
    }

    if (testStatus) {
      query += ` AND plt."TestStatus" = $${params.length + 1}`;
      params.push(testStatus);
    }

    if (patientType) {
      query += ` AND plt."PatientType" = $${params.length + 1}`;
      params.push(patientType);
    }

    query += `
      GROUP BY 
        COALESCE(appt_doctor."UserId", room_doctor."UserId"),
        COALESCE(appt_doctor."UserName", room_doctor."UserName"),
        COALESCE(appt_doctor."EmailId", room_doctor."EmailId"),
        COALESCE(appt_doctor."PhoneNo", room_doctor."PhoneNo"),
        COALESCE(appt_doctor."DoctorQualification", room_doctor."DoctorQualification"),
        COALESCE(appt_dept."DepartmentName", room_dept."DepartmentName")
      ORDER BY "TotalCount" DESC, "DoctorName" ASC
    `;

    const { rows } = await db.query(query, params);

    const mappedData = rows.map(row => ({
      DoctorId: row.DoctorId,
      DoctorName: row.DoctorName,
      DoctorEmail: row.DoctorEmail,
      DoctorPhone: row.DoctorPhone,
      DoctorQualification: row.DoctorQualification,
      DepartmentName: row.DepartmentName,
      TotalCount: parseInt(row.TotalCount, 10) || 0,
      ActiveCount: parseInt(row.ActiveCount, 10) || 0,
      PendingCount: parseInt(row.PendingCount, 10) || 0,
      InProgressCount: parseInt(row.InProgressCount, 10) || 0,
      CompletedCount: parseInt(row.CompletedCount, 10) || 0,
      OPDCount: parseInt(row.OPDCount, 10) || 0,
      IPDCount: parseInt(row.IPDCount, 10) || 0,
    }));

    const totalCounts = mappedData.reduce((acc, item) => ({
      TotalCount: acc.TotalCount + item.TotalCount,
      ActiveCount: acc.ActiveCount + item.ActiveCount,
      PendingCount: acc.PendingCount + item.PendingCount,
      InProgressCount: acc.InProgressCount + item.InProgressCount,
      CompletedCount: acc.CompletedCount + item.CompletedCount,
      OPDCount: acc.OPDCount + item.OPDCount,
      IPDCount: acc.IPDCount + item.IPDCount,
    }), { TotalCount: 0, ActiveCount: 0, PendingCount: 0, InProgressCount: 0, CompletedCount: 0, OPDCount: 0, IPDCount: 0 });

    res.status(200).json({
      success: true,
      filters: {
        status: status || null,
        testStatus: testStatus || null,
        patientType: patientType || null,
      },
      summary: totalCounts,
      count: mappedData.length,
      data: mappedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor wise counts',
      error: error.message,
    });
  }
};

/**
 * Create multer middleware for patient lab test file uploads
 * Accepts PatientNo_PatientName as query parameter or form field
 * Creates a folder with format: patientNo_PatientName_Date
 */
const createPatientLabTestUploadMiddleware = () => {
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        try {
          // Get PatientNo_PatientName from query or body
          const PatientNo_PatientName = (req.query.PatientNo_PatientName || 
                                       (req.body && req.body.PatientNo_PatientName) || '').trim();

          if (!PatientNo_PatientName) {
            return cb(new Error('PatientNo_PatientName parameter is required'));
          }

          // Get current date in YYYY-MM-DD format
          const currentDate = new Date().toISOString().split('T')[0];
          
          // Create folder name: patientNo_PatientName_Date
          const folderName = `${PatientNo_PatientName}_${currentDate}`;
          
          // Create uploads directory if it doesn't exist (read from .env file)
          const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          // Create patient-specific folder
          const patientFolder = path.join(uploadsDir, folderName);
          if (!fs.existsSync(patientFolder)) {
            fs.mkdirSync(patientFolder, { recursive: true });
          }

          // Store folder info in request for later use
          req.uploadFolderName = folderName;
          req.uploadFolderPath = patientFolder;
          console.log('*****************patientFolder', patientFolder);  
          console.log('folderName', folderName);  

          cb(null, patientFolder);
        } catch (error) {
          cb(error);
        }
      },
      filename: function (req, file, cb) {
        // Generate unique filename: originalname_timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
      // Accept all file types, or you can add specific file type validation here
      cb(null, true);
    }
  });
};

/**
 * Upload files for a patient lab test
 * Accepts PatientNo_PatientName parameter (query or form field) and creates a folder with format: patientNo_PatientName_Date
 * Saves uploaded files to that folder
 */
exports.uploadPatientLabTestFiles = async (req, res) => {
  try {
    // Get PatientNo_PatientName from query or body
    const PatientNo_PatientName = (req.query.PatientNo_PatientName || req.body.PatientNo_PatientName || '').trim();
    console.log('PatientNo_PatientName', PatientNo_PatientName);  
    if (!PatientNo_PatientName) {
      return res.status(400).json({
        success: false,
        message: 'PatientNo_PatientName parameter is required (as query parameter or form field)',
      });
    }

    // Create multer middleware
    const upload = createPatientLabTestUploadMiddleware();
    
    // Handle single or multiple files
    // Try to use a specific field name first (common: 'files', 'file', 'upload')
    // If that doesn't work, fall back to .any() to accept files with any field name
    // This prevents "Unexpected field" errors when other form fields are present
    
    // Check Content-Type to ensure it's multipart/form-data
    // Note: Some clients may not set this header initially, so we'll let multer handle it
    const contentType = req.headers['content-type'] || '';
    if (contentType && !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be multipart/form-data for file uploads',
        receivedContentType: contentType,
        hint: 'Make sure you are using FormData in your frontend and not manually setting Content-Type header',
      });
    }
    
    // Use .any() to accept files with any field name (most flexible)
    const uploadMiddleware = upload.any(); // Accept any field name for files

    uploadMiddleware(req, res, function (err) {
      // Debug logging
      console.log('Upload middleware callback called');
      console.log('req.files:', req.files);
      console.log('req.body:', req.body);
      console.log('Error:', err);
      
      if (err instanceof multer.MulterError) {
        console.log('MulterError:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 10MB',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum is 10 files',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field. Please check your form field names.',
            error: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message,
          code: err.code,
        });
      } else if (err) {
        console.log('Non-multer error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error uploading files',
          error: err.message,
        });
      }

      // Check for files - multer.any() puts files in req.files array
      // Also check if files might be in a different location
      let uploadedFiles = [];
      
      if (req.files && Array.isArray(req.files)) {
        // Filter to only include actual file objects (not text fields)
        uploadedFiles = req.files.filter(file => file && file.fieldname && file.originalname);
      } else if (req.files && typeof req.files === 'object') {
        // If req.files is an object, convert to array
        uploadedFiles = Object.values(req.files).flat().filter(file => file && file.fieldname && file.originalname);
      }
      
      console.log('Filtered uploadedFiles:', uploadedFiles.length, uploadedFiles);
      
      // If no files were uploaded
      if (uploadedFiles.length === 0) {
        // Provide helpful debugging information
        const debugInfo = {
          hasFiles: !!req.files,
          filesType: typeof req.files,
          filesValue: req.files,
          filesLength: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : 0,
          contentType: req.headers['content-type'],
          method: req.method,
          url: req.url,
          bodyKeys: req.body ? Object.keys(req.body) : [],
        };
        
        console.log('No files uploaded. Debug info:', debugInfo);
        
        return res.status(400).json({
          success: false,
          message: 'No files were uploaded. Please ensure you are sending files in the request with Content-Type: multipart/form-data.',
          hint: 'Make sure your frontend is sending files using FormData and the request has Content-Type: multipart/form-data',
          debug: debugInfo,
        });
      }

      // Limit to 10 files (since upload.any() doesn't have a limit parameter)
      if (uploadedFiles.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files',
        });
      }

      // Prepare response with uploaded file information
      const fileDetails = uploadedFiles.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path, // Complete absolute file path
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.status(200).json({
        success: true,
        message: `Files uploaded successfully to folder: ${req.uploadFolderName}`,
        folderName: req.uploadFolderName,
        folderPath: req.uploadFolderPath, // Complete absolute folder path
        filesCount: fileDetails.length,
        files: fileDetails,
      });
    });

  } catch (error) {
    console.error('Error in uploadPatientLabTestFiles:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error uploading patient lab test files',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Get folder information for a patient lab test
 * Accepts PatientNo_PatientName parameter and optional date
 * Returns folder name and URL/path information
 * Query Parameters:
 *   - PatientNo_PatientName: String (required) - Format: "PatientNo_PatientName" (e.g., "P001_JohnDoe")
 *   - date: String (optional) - Format: "YYYY-MM-DD" - If provided, returns specific date folder, otherwise returns all folders
 */
exports.getPatientLabTestFolder = async (req, res) => {
  try {
    const { PatientNo_PatientName, date } = req.query;

    if (!PatientNo_PatientName) {
      return res.status(400).json({
        success: false,
        message: 'PatientNo_PatientName parameter is required',
      });
    }

    // Get uploads directory from .env file, fallback to default
    const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
    // Get uploads URL prefix from .env file, fallback to default
    const uploadsUrlPrefix = process.env.UPLOADS_URL_PREFIX || '/uploads';
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        success: true,
        message: 'No folders found for this patient',
        PatientNo_PatientName: PatientNo_PatientName,
        folders: [],
        count: 0,
      });
    }

    // If date is provided, return specific folder
    if (date) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-01-15)',
        });
      }

      const folderName = `${PatientNo_PatientName}_${date}`;
      const folderPath = path.join(uploadsDir, folderName);
      const folderExists = fs.existsSync(folderPath);

      if (!folderExists) {
        return res.status(404).json({
          success: false,
          message: `Folder not found for ${PatientNo_PatientName} on date ${date}`,
          PatientNo_PatientName: PatientNo_PatientName,
          date: date,
          folderName: folderName,
        });
      }

      // Get folder contents
      const files = fs.readdirSync(folderPath);
      const fileDetails = files.map(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        const fullFileUrl = `${folderName}/${file}`;
        return {
          fileName: file,
          filePath: path.relative(path.join(__dirname, '..'), filePath),
          fileUrl: `${uploadsUrlPrefix}/${folderName}/${file}`,
          size: stats.size,
          createdDate: stats.birthtime,
          modifiedDate: stats.mtime,
          isDirectory: stats.isDirectory(),
          fullFileUrl: fullFileUrl,
        };
      });

      return res.status(200).json({
        success: true,
        message: `Folder found for ${PatientNo_PatientName} on date ${date}`,
        PatientNo_PatientName: PatientNo_PatientName,
        date: date,
        folderName: folderName,
        folderPath: path.relative(path.join(__dirname, '..'), folderPath),
        folderUrl: `${uploadsUrlPrefix}/${folderName}`,
        filesCount: fileDetails.filter(f => !f.isDirectory).length,
        files: fileDetails.filter(f => !f.isDirectory),
      });
    }

    // If no date provided, return all folders for this patient
    const allFolders = fs.readdirSync(uploadsDir);
    const patientFolders = allFolders.filter(folder => {
      const folderPath = path.join(uploadsDir, folder);
      if (!fs.statSync(folderPath).isDirectory()) {
        return false;
      }
      // Check if folder name starts with PatientNo_PatientName
      return folder.startsWith(`${PatientNo_PatientName}_`);
    });

    if (patientFolders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No folders found for this patient',
        PatientNo_PatientName: PatientNo_PatientName,
        folders: [],
        count: 0,
      });
    }

    // Get details for each folder
    const folderDetails = patientFolders.map(folderName => {
      const folderPath = path.join(uploadsDir, folderName);
      const stats = fs.statSync(folderPath);
      const files = fs.readdirSync(folderPath);
      const fileCount = files.filter(file => {
        const filePath = path.join(folderPath, file);
        return fs.statSync(filePath).isFile();
      }).length;

      // Extract date from folder name (format: PatientNo_PatientName_YYYY-MM-DD)
      const dateMatch = folderName.match(/_(\d{4}-\d{2}-\d{2})$/);
      const folderDate = dateMatch ? dateMatch[1] : null;

      return {
        folderName: folderName,
        folderPath: path.relative(path.join(__dirname, '..'), folderPath),
        folderUrl: `${uploadsUrlPrefix}/${folderName}`,
        date: folderDate,
        createdDate: stats.birthtime,
        modifiedDate: stats.mtime,
        filesCount: fileCount,
      };
    });

    // Sort by date (most recent first)
    folderDetails.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return new Date(b.modifiedDate) - new Date(a.modifiedDate);
    });

    res.status(200).json({
      success: true,
      message: `Found ${folderDetails.length} folder(s) for ${PatientNo_PatientName}`,
      PatientNo_PatientName: PatientNo_PatientName,
      count: folderDetails.length,
      folders: folderDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving patient lab test folder information',
      error: error.message,
    });
  }
};

