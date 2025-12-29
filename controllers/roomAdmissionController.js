const db = require('../db');

const allowedAdmissionStatus = ['Active', 'Moved To ICU', 'Surgery Scheduled', 'Discharged'];
const allowedYesNo = ['Yes', 'No'];
const allowedStatus = ['Active', 'Inactive'];
const allowedPatientTypes = ['OPD', 'Emergency', 'Direct'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Normalize "Yes"/"No" values in a case-insensitive way
const normalizeYesNo = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'yes') return 'Yes';
  if (normalized === 'no') return 'No';
  return null;
};

// Normalize AdmissionStatus in a case-insensitive way and map to canonical values
const normalizeAdmissionStatus = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'active') return 'Active';
  if (normalized === 'moved to icu') return 'Moved To ICU';
  if (normalized === 'surgery scheduled') return 'Surgery Scheduled';
  if (normalized === 'discharged') return 'Discharged';
  return null;
};

const mapRoomAdmissionRow = (row) => ({
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid,
  PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
  EmergencyAdmissionId: row.EmergencyAdmissionId || row.emergencyadmissionid || null,
  PatientType: row.PatientType || row.patienttype || null,
  AdmittingDoctorId: row.AdmittingDoctorId || row.admittingdoctorid,
  PatientId: row.PatientId || row.patientid,
  RoomBedsId: row.RoomBedsId || row.roombedsid,
  RoomAllocationDate: row.RoomAllocationDate || row.roomallocationdate,
  RoomVacantDate: row.RoomVacantDate || row.roomvacantdate || null,
  AdmissionStatus: row.AdmissionStatus || row.admissionstatus,
  CaseSheetDetails: row.CaseSheetDetails || row.casesheetdetails || null,
  CaseSheet: row.CaseSheet || row.casesheet || null,
  ShiftToAnotherRoom: row.ShiftToAnotherRoom || row.shifttoanotherroom || 'No',
  ShiftedTo: row.ShiftedTo || row.shiftedto || null,
  ShiftedToDetails: row.ShiftedToDetails || row.shiftedtodetails || null,
  ScheduleOT: row.ScheduleOT || row.scheduleot || 'No',
  OTAdmissionId: row.OTAdmissionId || row.otadmissionid || null,
  IsLinkedToICU: row.IsLinkedToICU || row.islinkedtoicu || 'No',
  ICUAdmissionId: row.ICUAdmissionId || row.icuadmissionid || null,
  BillId: row.BillId || row.billid || null,
  AllocatedBy: row.AllocatedBy || row.allocatedby || null,
  AllocatedAt: row.AllocatedAt || row.allocatedat,
  Status: row.Status || row.status,
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  AdmittingDoctorName: row.AdmittingDoctorName || row.admittingdoctorname || null,
  AppointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
  BedNo: row.BedNo || row.bedno || null,
  RoomNo: row.RoomNo || row.roomno || null,
  AllocatedByName: row.AllocatedByName || row.allocatedbyname || null,
  RoomAdmissionId_RoomAllocationDate: row.RoomAdmissionId_RoomAllocationDate || row.roomadmissionid_roomallocationdate || null,
});

exports.getAllRoomAdmissions = async (req, res) => {
  try {
    const { status, admissionStatus, patientId, doctorId, roomBedsId, patientType } = req.query;
    let query = `
      SELECT 
        ra.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "AdmittingDoctorName",
        pa."TokenNo" AS "AppointmentTokenNo",
        rb."BedNo", rb."RoomNo",
        u."UserName" AS "AllocatedByName",
        TO_CHAR(ra."RoomAllocationDate", 'DD-MM-YYYY HH24:MI') AS "RoomAllocationDate"
      FROM "RoomAdmission" ra
      LEFT JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ra."AdmittingDoctorId" = d."UserId"
      LEFT JOIN "PatientAppointment" pa ON ra."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      LEFT JOIN "Users" u ON ra."AllocatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`ra."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (admissionStatus) {
      conditions.push(`ra."AdmissionStatus" = $${params.length + 1}`);
      params.push(admissionStatus);
    }
    if (patientId) {
      if (!uuidRegex.test(patientId)) {
        return res.status(400).json({ success: false, message: 'Invalid PatientId. Must be a valid UUID.' });
      }
      conditions.push(`ra."PatientId" = $${params.length + 1}::uuid`);
      params.push(patientId);
    }
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (isNaN(doctorIdInt)) {
        return res.status(400).json({ success: false, message: 'Invalid doctorId. Must be an integer.' });
      }
      conditions.push(`ra."AdmittingDoctorId" = $${params.length + 1}`);
      params.push(doctorIdInt);
    }
    if (roomBedsId) {
      const roomBedsIdInt = parseInt(roomBedsId, 10);
      if (isNaN(roomBedsIdInt)) {
        return res.status(400).json({ success: false, message: 'Invalid roomBedsId. Must be a valid integer.' });
      }
      conditions.push(`ra."RoomBedsId" = $${params.length + 1}`);
      params.push(roomBedsIdInt);
    }
    if (patientType) {
      if (!allowedPatientTypes.includes(patientType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid patientType. Must be one of: ${allowedPatientTypes.join(', ')}`,
        });
      }
      conditions.push(`ra."PatientType" = $${params.length + 1}`);
      params.push(patientType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY ra."RoomAllocationDate" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRoomAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room admissions',
      error: error.message,
    });
  }
};

exports.getRoomAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const roomAdmissionId = parseInt(id, 10);
    if (isNaN(roomAdmissionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid RoomAdmissionId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      `
      SELECT 
        ra.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "AdmittingDoctorName",
        pa."TokenNo" AS "AppointmentTokenNo",
        rb."BedNo", rb."RoomNo",
        u."UserName" AS "AllocatedByName"
      FROM "RoomAdmission" ra
      LEFT JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ra."AdmittingDoctorId" = d."UserId"
      LEFT JOIN "PatientAppointment" pa ON ra."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      LEFT JOIN "Users" u ON ra."AllocatedBy" = u."UserId"
      WHERE ra."RoomAdmissionId" = $1
      `,
      [roomAdmissionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room admission not found' });
    }
    res.status(200).json({ success: true, data: mapRoomAdmissionRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room admission',
      error: error.message,
    });
  }
};

exports.getRoomAdmissionsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, admissionStatus } = req.query;

    // Validate patientId format (UUID)
    if (!uuidRegex.test(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patientId. Must be a valid UUID.',
      });
    }

    let query = `
      SELECT 
        ra.*,
        p."PatientName", p."PatientNo",
        d."UserName" AS "AdmittingDoctorName",
        pa."TokenNo" AS "AppointmentTokenNo",
        rb."BedNo", rb."RoomNo",
        u."UserName" AS "AllocatedByName",
        CONCAT(ra."RoomAdmissionId", '_', ra."RoomAllocationDate"::text) AS "RoomAdmissionId_RoomAllocationDate"
      FROM "RoomAdmission" ra
      LEFT JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      LEFT JOIN "Users" d ON ra."AdmittingDoctorId" = d."UserId"
      LEFT JOIN "PatientAppointment" pa ON ra."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      LEFT JOIN "Users" u ON ra."AllocatedBy" = u."UserId"
      WHERE ra."PatientId" = $1::uuid
    `;
    
    const params = [patientId];
    const conditions = [];

    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowedStatus.join(', ')}`,
        });
      }
      conditions.push(`ra."Status" = $${params.length + 1}`);
      params.push(status);
    }

    if (admissionStatus) {
      if (!allowedAdmissionStatus.includes(admissionStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid admissionStatus. Must be one of: ${allowedAdmissionStatus.join(', ')}`,
        });
      }
      conditions.push(`ra."AdmissionStatus" = $${params.length + 1}`);
      params.push(admissionStatus);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ra."RoomAllocationDate" DESC LIMIT 1';

    const { rows } = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      patientId: patientId,
      data: rows.map(mapRoomAdmissionRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room admissions',
      error: error.message,
    });
  }
};

const validateRoomAdmissionPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && (body.PatientId === undefined || body.PatientId === null || body.PatientId === '')) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null && body.PatientId !== '') {
    if (!uuidRegex.test(body.PatientId)) {
      errors.push('PatientId must be a valid UUID');
    }
  }

  if (requireAll && (body.AdmittingDoctorId === undefined || body.AdmittingDoctorId === null || body.AdmittingDoctorId === '')) {
    errors.push('AdmittingDoctorId is required');
  }
  if (body.AdmittingDoctorId !== undefined && body.AdmittingDoctorId !== null && body.AdmittingDoctorId !== '') {
    const admittingDoctorIdInt = parseInt(body.AdmittingDoctorId, 10);
    if (isNaN(admittingDoctorIdInt)) {
      errors.push('AdmittingDoctorId must be a valid integer');
    }
  }

  if (requireAll && (body.RoomBedsId === undefined || body.RoomBedsId === null || body.RoomBedsId === '')) {
    errors.push('RoomBedsId is required');
  }
  if (body.RoomBedsId !== undefined && body.RoomBedsId !== null && body.RoomBedsId !== '') {
    const roomBedsIdInt = parseInt(body.RoomBedsId, 10);
    if (isNaN(roomBedsIdInt)) {
      errors.push('RoomBedsId must be a valid integer');
    }
  }

  if (requireAll && (!body.RoomAllocationDate || body.RoomAllocationDate === '')) {
    errors.push('RoomAllocationDate is required');
  }
  if (body.RoomAllocationDate && body.RoomAllocationDate !== '') {
    const date = new Date(body.RoomAllocationDate);
    if (isNaN(date.getTime())) {
      errors.push('RoomAllocationDate must be a valid date');
    }
  }

  if (body.PatientAppointmentId !== undefined && body.PatientAppointmentId !== null && body.PatientAppointmentId !== '') {
    const appointmentIdInt = parseInt(body.PatientAppointmentId, 10);
    if (isNaN(appointmentIdInt)) {
      errors.push('PatientAppointmentId must be a valid integer');
    }
  }

  if (body.EmergencyAdmissionId !== undefined && body.EmergencyAdmissionId !== null && body.EmergencyAdmissionId !== '') {
    const emergencyAdmissionIdInt = parseInt(body.EmergencyAdmissionId, 10);
    if (isNaN(emergencyAdmissionIdInt)) {
      errors.push('EmergencyAdmissionId must be a valid integer');
    }
  }

  if (body.RoomVacantDate !== undefined && body.RoomVacantDate !== null && body.RoomVacantDate !== '') {
    const date = new Date(body.RoomVacantDate);
    if (isNaN(date.getTime())) {
      errors.push('RoomVacantDate must be a valid date');
    }
  }

  const admissionStatusProvided =
    body.AdmissionStatus !== undefined ||
    body.admissionStatus !== undefined ||
    body.admission_status !== undefined;
  const normalizedAdmissionStatus = normalizeAdmissionStatus(
    body.AdmissionStatus ?? body.admissionStatus ?? body.admission_status
  );

  if (admissionStatusProvided && !normalizedAdmissionStatus) {
    errors.push(`AdmissionStatus must be one of: ${allowedAdmissionStatus.join(', ')}`);
  }

  if (body.ShiftToAnotherRoom && !allowedYesNo.includes(body.ShiftToAnotherRoom)) {
    errors.push('ShiftToAnotherRoom must be "Yes" or "No"');
  }

  if (body.ShiftedTo !== undefined && body.ShiftedTo !== null && body.ShiftedTo !== '') {
    const shiftedToInt = parseInt(body.ShiftedTo, 10);
    if (isNaN(shiftedToInt)) {
      errors.push('ShiftedTo must be a valid integer');
    }
  }

  if (body.ScheduleOT && !allowedYesNo.includes(body.ScheduleOT)) {
    errors.push('ScheduleOT must be "Yes" or "No"');
  }

  if (body.OTAdmissionId !== undefined && body.OTAdmissionId !== null && body.OTAdmissionId !== '') {
    const otAdmissionIdInt = parseInt(body.OTAdmissionId, 10);
    if (isNaN(otAdmissionIdInt)) {
      errors.push('OTAdmissionId must be a valid integer');
    }
  }

  const providedIsLinkedToICU =
    body.IsLinkedToICU !== undefined ||
    body.isLinkedToICU !== undefined ||
    body.is_linked_to_icu !== undefined;
  const normalizedIsLinkedToICU = normalizeYesNo(
    body.IsLinkedToICU ?? body.isLinkedToICU ?? body.is_linked_to_icu
  );

  if (providedIsLinkedToICU && !normalizedIsLinkedToICU) {
    errors.push('IsLinkedToICU must be "Yes" or "No"');
  }

  if (body.ICUAdmissionId !== undefined && body.ICUAdmissionId !== null && body.ICUAdmissionId !== '') {
    if (!uuidRegex.test(body.ICUAdmissionId)) {
      errors.push('ICUAdmissionId must be a valid UUID');
    }
  }

  if (body.BillId !== undefined && body.BillId !== null && body.BillId !== '') {
    const billIdInt = parseInt(body.BillId, 10);
    if (isNaN(billIdInt)) {
      errors.push('BillId must be a valid integer');
    }
  }

  if (body.AllocatedBy !== undefined && body.AllocatedBy !== null && body.AllocatedBy !== '') {
    const allocatedByInt = parseInt(body.AllocatedBy, 10);
    if (isNaN(allocatedByInt)) {
      errors.push('AllocatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be "Active" or "Inactive"');
  }

  if (body.PatientType && !allowedPatientTypes.includes(body.PatientType)) {
    errors.push(`PatientType must be one of: ${allowedPatientTypes.join(', ')}`);
  }

  return errors;
};

exports.createRoomAdmission = async (req, res) => {
  try {
    // Log all incoming fields for debugging
    console.log('=== INCOMING REQUEST BODY ===');
    console.log('All req.body keys:', Object.keys(req.body));
    console.log('PatientType in req.body:', req.body.PatientType, req.body.patientType, req.body.patient_type);
    console.log('CaseSheet in req.body:', req.body.CaseSheet, req.body.caseSheet, req.body.case_sheet);
    console.log('CaseSheetDetails in req.body:', req.body.CaseSheetDetails, req.body.caseSheetDetails, req.body.case_sheet_details);
    console.log('Full req.body:', JSON.stringify(req.body, null, 2));
    console.log('===========================');

    const errors = validateRoomAdmissionPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    // Extract fields from req.body with case-insensitive fallback
    const PatientAppointmentId = req.body.PatientAppointmentId || req.body.patientAppointmentId || req.body.patient_appointment_id;
    const EmergencyAdmissionId = req.body.EmergencyAdmissionId || req.body.emergencyAdmissionId || req.body.emergency_admission_id;
    const PatientType = req.body.PatientType || req.body.patientType || req.body.patient_type;
    const AdmittingDoctorId = req.body.AdmittingDoctorId || req.body.admittingDoctorId || req.body.admitting_doctor_id;
    const PatientId = req.body.PatientId || req.body.patientId || req.body.patient_id;
    const RoomBedsId = req.body.RoomBedsId || req.body.roomBedsId || req.body.room_beds_id;
    const RoomAllocationDate = req.body.RoomAllocationDate || req.body.roomAllocationDate || req.body.room_allocation_date;
    const RoomVacantDate = req.body.RoomVacantDate || req.body.roomVacantDate || req.body.room_vacant_date;
    const AdmissionStatusRaw = req.body.AdmissionStatus || req.body.admissionStatus || req.body.admission_status;
    const AdmissionStatus = normalizeAdmissionStatus(AdmissionStatusRaw) || 'Active';
    const CaseSheetDetails = req.body.CaseSheetDetails || req.body.caseSheetDetails || req.body.case_sheet_details;
    const CaseSheet = req.body.CaseSheet || req.body.caseSheet || req.body.case_sheet;
    const ShiftToAnotherRoom = req.body.ShiftToAnotherRoom || req.body.shiftToAnotherRoom || req.body.shift_to_another_room || 'No';
    const ShiftedTo = req.body.ShiftedTo || req.body.shiftedTo || req.body.shifted_to;
    const ShiftedToDetails = req.body.ShiftedToDetails || req.body.shiftedToDetails || req.body.shifted_to_details;
    const ScheduleOT = req.body.ScheduleOT || req.body.scheduleOT || req.body.schedule_ot || 'No';
    const OTAdmissionId = req.body.OTAdmissionId || req.body.otAdmissionId || req.body.ot_admission_id;
    const IsLinkedToICURaw = req.body.IsLinkedToICU || req.body.isLinkedToICU || req.body.is_linked_to_icu;
    const IsLinkedToICU = normalizeYesNo(IsLinkedToICURaw) || 'No';
    const ICUAdmissionId = req.body.ICUAdmissionId || req.body.icuAdmissionId || req.body.icu_admission_id;
    const BillId = req.body.BillId || req.body.billId || req.body.bill_id;
    const AllocatedBy = req.body.AllocatedBy || req.body.allocatedBy || req.body.allocated_by;
    const Status = req.body.Status || req.body.status || 'Active';
    
    // Validate PatientType if provided
    if (PatientType && !allowedPatientTypes.includes(PatientType)) {
      return res.status(400).json({
        success: false,
        message: `PatientType must be one of: ${allowedPatientTypes.join(', ')}`,
      });
    }

    // Validate AdmissionStatus after normalization
    if (!AdmissionStatus) {
      return res.status(400).json({
        success: false,
        message: `AdmissionStatus must be one of: ${allowedAdmissionStatus.join(', ')}`,
      });
    }

    // Business logic: If PatientType is 'Direct', PatientAppointmentId and EmergencyAdmissionId should be null
    if (PatientType === 'Direct') {
      if (PatientAppointmentId !== undefined && PatientAppointmentId !== null && PatientAppointmentId !== '') {
        return res.status(400).json({
          success: false,
          message: 'PatientAppointmentId should be null for Direct PatientType',
        });
      }
      if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
        return res.status(400).json({
          success: false,
          message: 'EmergencyAdmissionId should be null for Direct PatientType',
        });
      }
    }

    // Validate foreign key existence
    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
    }

    const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AdmittingDoctorId, 10)]);
    if (doctorExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'AdmittingDoctorId does not exist' });
    }

    const roomBedsIdInt = parseInt(RoomBedsId, 10);
    const roomBedsExists = await db.query('SELECT "RoomBedsId" FROM "RoomBeds" WHERE "RoomBedsId" = $1', [roomBedsIdInt]);
    if (roomBedsExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'RoomBedsId does not exist' });
    }

    if (PatientAppointmentId !== undefined && PatientAppointmentId !== null && PatientAppointmentId !== '') {
      const appointmentIdInt = parseInt(PatientAppointmentId, 10);
      if (isNaN(appointmentIdInt)) {
        return res.status(400).json({ success: false, message: 'PatientAppointmentId must be a valid integer' });
      }
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [appointmentIdInt]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientAppointmentId does not exist' });
      }
    }

    if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
      const emergencyAdmissionIdInt = parseInt(EmergencyAdmissionId, 10);
      if (isNaN(emergencyAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId must be a valid integer' });
      }
      const emergencyAdmissionExists = await db.query('SELECT "EmergencyAdmissionId" FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1', [emergencyAdmissionIdInt]);
      if (emergencyAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId does not exist' });
      }
    }

    if (ShiftedTo !== undefined && ShiftedTo !== null && ShiftedTo !== '') {
      const shiftedToInt = parseInt(ShiftedTo, 10);
      if (isNaN(shiftedToInt)) {
        return res.status(400).json({ success: false, message: 'ShiftedTo must be a valid integer' });
      }
      const shiftedToExists = await db.query('SELECT "RoomBedsId" FROM "RoomBeds" WHERE "RoomBedsId" = $1', [shiftedToInt]);
      if (shiftedToExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ShiftedTo RoomBedsId does not exist' });
      }
    }

    if (OTAdmissionId !== undefined && OTAdmissionId !== null && OTAdmissionId !== '') {
      const otAdmissionIdInt = parseInt(OTAdmissionId, 10);
      if (isNaN(otAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'OTAdmissionId must be a valid integer' });
      }
      const otAdmissionExists = await db.query('SELECT "PatientOTAllocationId" FROM "PatientOTAllocation" WHERE "PatientOTAllocationId" = $1', [otAdmissionIdInt]);
      if (otAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTAdmissionId does not exist' });
      }
    }

    if (ICUAdmissionId !== undefined && ICUAdmissionId !== null && ICUAdmissionId !== '') {
      if (!uuidRegex.test(ICUAdmissionId)) {
        return res.status(400).json({ success: false, message: 'ICUAdmissionId must be a valid UUID' });
      }
      const icuAdmissionExists = await db.query('SELECT "PatientICUAdmissionId" FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid', [ICUAdmissionId]);
      if (icuAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUAdmissionId does not exist' });
      }
    }
console.log("ICUAdmissionId", ICUAdmissionId);
    if (BillId !== undefined && BillId !== null && BillId !== '') {
      const billIdInt = parseInt(BillId, 10);
      if (isNaN(billIdInt)) {
        return res.status(400).json({ success: false, message: 'BillId must be a valid integer' });
      }
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [billIdInt]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
    }

    if (AllocatedBy !== undefined && AllocatedBy !== null && AllocatedBy !== '') {
      const allocatedByInt = parseInt(AllocatedBy, 10);
      if (isNaN(allocatedByInt)) {
        return res.status(400).json({ success: false, message: 'AllocatedBy must be a valid integer' });
      }
      const allocatedByExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [allocatedByInt]);
      if (allocatedByExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AllocatedBy User does not exist' });
      }
    }

    // Prepare values for INSERT with proper type conversion and validation
    // Helper function to safely parse integer
    const safeParseInt = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    };

    // Validate RoomAllocationDate (required)
    if (!RoomAllocationDate || RoomAllocationDate === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'RoomAllocationDate is required' 
      });
    }
    const roomAllocationDateValue = new Date(RoomAllocationDate);
    if (isNaN(roomAllocationDateValue.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'RoomAllocationDate must be a valid date' 
      });
    }

    // Validate RoomVacantDate if provided
    let roomVacantDateValue = null;
    if (RoomVacantDate && RoomVacantDate !== '') {
      const dateValue = new Date(RoomVacantDate);
      if (isNaN(dateValue.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'RoomVacantDate must be a valid date' 
        });
      }
      roomVacantDateValue = RoomVacantDate;
    }

    // Validate ICUAdmissionId if provided (must be UUID)
    // If IsLinkedToICU is 'No', ICUAdmissionId should be null
    let icuAdmissionIdValue = null;
    if (IsLinkedToICU === 'Yes' && ICUAdmissionId && ICUAdmissionId !== '') {
      if (!uuidRegex.test(ICUAdmissionId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'ICUAdmissionId must be a valid UUID' 
        });
      }
      icuAdmissionIdValue = ICUAdmissionId;
    } else if (IsLinkedToICU === 'No') {
      // Explicitly set to null if not linked to ICU
      icuAdmissionIdValue = null;
    }

    // Use already validated values
    const admittingDoctorIdInt = parseInt(AdmittingDoctorId, 10);

    // Log the raw values from req.body for debugging
    console.log('Raw values from req.body:', {
      PatientType: PatientType,
      CaseSheet: CaseSheet,
      CaseSheetDetails: CaseSheetDetails,
      PatientTypeType: typeof PatientType,
      CaseSheetType: typeof CaseSheet,
      CaseSheetDetailsType: typeof CaseSheetDetails,
    });

    // Process PatientType - allow empty string to be saved as empty string, not null
    let patientTypeValue = null;
    if (PatientType !== undefined && PatientType !== null) {
      if (PatientType === '') {
        patientTypeValue = null; // Empty string becomes null
      } else {
        patientTypeValue = String(PatientType).trim();
      }
    }

    // Process CaseSheetDetails - allow empty string
    let caseSheetDetailsValue = null;
    if (CaseSheetDetails !== undefined && CaseSheetDetails !== null) {
      if (CaseSheetDetails === '') {
        caseSheetDetailsValue = null; // Empty string becomes null
      } else {
        caseSheetDetailsValue = String(CaseSheetDetails).trim();
      }
    }

    // Process CaseSheet - allow empty string
    let caseSheetValue = null;
    if (CaseSheet !== undefined && CaseSheet !== null) {
      if (CaseSheet === '') {
        caseSheetValue = null; // Empty string becomes null
      } else {
        caseSheetValue = String(CaseSheet).trim();
      }
    }

    console.log('Processed values:', {
      patientTypeValue,
      caseSheetDetailsValue,
      caseSheetValue,
    });

    const insertValues = [
      // PatientAppointmentId - integer or null
      safeParseInt(PatientAppointmentId),
      // EmergencyAdmissionId - integer or null
      safeParseInt(EmergencyAdmissionId),
      // PatientType - string or null
      patientTypeValue,
      // AdmittingDoctorId - integer (required)
      admittingDoctorIdInt,
      // PatientId - UUID (required)
      PatientId.trim(),
      // RoomBedsId - integer (required) - already validated above
      roomBedsIdInt,
      // RoomAllocationDate - timestamp (required)
      RoomAllocationDate,
      // RoomVacantDate - timestamp or null
      roomVacantDateValue,
      // AdmissionStatus - string (already normalized)
      AdmissionStatus || 'Active',
      // CaseSheetDetails - text or null
      caseSheetDetailsValue,
      // CaseSheet - text or null
      caseSheetValue,
      // ShiftToAnotherRoom - string
      ShiftToAnotherRoom || 'No',
      // ShiftedTo - integer or null
      safeParseInt(ShiftedTo),
      // ShiftedToDetails - text or null
      (ShiftedToDetails && ShiftedToDetails !== '') ? ShiftedToDetails.trim() : null,
      // ScheduleOT - string
      ScheduleOT || 'No',
      // OTAdmissionId - integer or null
      safeParseInt(OTAdmissionId),
      // IsLinkedToICU - string
      IsLinkedToICU || 'No',
      // ICUAdmissionId - UUID or null
      icuAdmissionIdValue,
      // BillId - integer or null
      safeParseInt(BillId),
      // AllocatedBy - integer or null
      safeParseInt(AllocatedBy),
      // Status - string
      Status || 'Active',
    ];

    // Log values for debugging - specifically for the problematic fields
    console.log('=== INSERT VALUES DEBUG ===');
    console.log('PatientType (index 2):', insertValues[2], 'Type:', typeof insertValues[2]);
    console.log('CaseSheetDetails (index 9):', insertValues[9], 'Type:', typeof insertValues[9]);
    console.log('CaseSheet (index 10):', insertValues[10], 'Type:', typeof insertValues[10]);
    console.log('Creating RoomAdmission with values:', {
      PatientAppointmentId: insertValues[0],
      EmergencyAdmissionId: insertValues[1],
      PatientType: insertValues[2],
      AdmittingDoctorId: insertValues[3],
      PatientId: insertValues[4],
      RoomBedsId: insertValues[5],
      RoomAllocationDate: insertValues[6],
      RoomVacantDate: insertValues[7],
      AdmissionStatus: insertValues[8],
      CaseSheetDetails: insertValues[9],
      CaseSheet: insertValues[10],
      ShiftToAnotherRoom: insertValues[11],
      ShiftedTo: insertValues[12],
      ShiftedToDetails: insertValues[13],
      ScheduleOT: insertValues[14],
      OTAdmissionId: insertValues[15],
      IsLinkedToICU: insertValues[16],
      ICUAdmissionId: insertValues[17],
      BillId: insertValues[18],
      AllocatedBy: insertValues[19],
      Status: insertValues[20],
    });
    console.log('=== END INSERT VALUES DEBUG ===');
    console.log('All insert values:', insertValues);
    console.log('Insert values types:', insertValues.map((v, i) => {
      const fieldNames = [
        'PatientAppointmentId', 'EmergencyAdmissionId', 'PatientType', 'AdmittingDoctorId', 'PatientId',
        'RoomBedsId', 'RoomAllocationDate', 'RoomVacantDate', 'AdmissionStatus', 'CaseSheetDetails',
        'CaseSheet', 'ShiftToAnotherRoom', 'ShiftedTo', 'ShiftedToDetails', 'ScheduleOT',
        'OTAdmissionId', 'IsLinkedToICU', 'ICUAdmissionId', 'BillId', 'AllocatedBy', 'Status'
      ];
      return `${fieldNames[i]}: ${typeof v} (${v})`;
    }));

    const insertQuery = `
      INSERT INTO "RoomAdmission"
        ("PatientAppointmentId", "EmergencyAdmissionId", "PatientType", "AdmittingDoctorId", "PatientId", "RoomBedsId",
         "RoomAllocationDate", "RoomVacantDate", "AdmissionStatus", "CaseSheetDetails", "CaseSheet",
         "ShiftToAnotherRoom", "ShiftedTo", "ShiftedToDetails", "ScheduleOT", "OTAdmissionId",
         "IsLinkedToICU", "ICUAdmissionId", "BillId", "AllocatedBy", "Status")
      VALUES ($1, $2, $3, $4, $5::uuid, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::uuid, $19, $20, $21)
      RETURNING *;
    `;
    console.log('&&&&&&&&&&&&&&&&&&&&&&&&Insert query:', insertQuery);
    console.log('SQL Column Order:', [
      'PatientAppointmentId', 'EmergencyAdmissionId', 'PatientType', 'AdmittingDoctorId', 'PatientId', 'RoomBedsId',
      'RoomAllocationDate', 'RoomVacantDate', 'AdmissionStatus', 'CaseSheetDetails', 'CaseSheet',
      'ShiftToAnotherRoom', 'ShiftedTo', 'ShiftedToDetails', 'ScheduleOT', 'OTAdmissionId',
      'IsLinkedToICU', 'ICUAdmissionId', 'BillId', 'AllocatedBy', 'Status'
    ]);
    
    const { rows } = await db.query(insertQuery, insertValues);

    // Verify the inserted record has the correct values
    console.log('=== VERIFICATION: Inserted Record ===');
    console.log('PatientType in DB:', rows[0].PatientType || rows[0].patienttype);
    console.log('CaseSheetDetails in DB:', rows[0].CaseSheetDetails || rows[0].casesheetdetails);
    console.log('CaseSheet in DB:', rows[0].CaseSheet || rows[0].casesheet);
    console.log('=====================================');

    res.status(201).json({
      success: true,
      message: 'Room admission created successfully',
      data: mapRoomAdmissionRow(rows[0]),
    });
  } catch (error) {
    console.error('Error creating room admission:', error);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error constraint:', error.constraint);
    console.error('Request body:', req.body);
    
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please verify all referenced IDs exist.',
        error: error.message,
        detail: error.detail,
        constraint: error.constraint,
      });
    }
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. This record already exists.',
        error: error.message,
        detail: error.detail,
        constraint: error.constraint,
      });
    }
    if (error.code === '23514') {
      // Check constraint violation (e.g., PatientType, AdmissionStatus, etc.)
      return res.status(400).json({
        success: false,
        message: 'Invalid value provided. Please check the allowed values for fields like PatientType, AdmissionStatus, etc.',
        error: error.message,
        detail: error.detail,
        constraint: error.constraint,
      });
    }
    if (error.code === '23502') {
      // Not null constraint violation
      return res.status(400).json({
        success: false,
        message: 'Required field is missing. Please check that all required fields are provided.',
        error: error.message,
        detail: error.detail,
        column: error.column,
      });
    }
    if (error.code === '22P02' || error.code === '42804') {
      // Invalid data type
      return res.status(400).json({
        success: false,
        message: 'Invalid data type. Please check that all field values match their expected types (UUID, integer, date, etc.).',
        error: error.message,
        detail: error.detail,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating room admission',
      error: error.message,
      errorCode: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

exports.updateRoomAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateRoomAdmissionPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientAppointmentId,
      EmergencyAdmissionId,
      PatientType,
      AdmittingDoctorId,
      PatientId,
      RoomBedsId,
      RoomAllocationDate,
      RoomVacantDate,
      AdmissionStatus,
      CaseSheetDetails,
      CaseSheet,
      ShiftToAnotherRoom,
      ShiftedTo,
      ShiftedToDetails,
      ScheduleOT,
      OTAdmissionId,
      IsLinkedToICU,
      ICUAdmissionId,
      BillId,
      AllocatedBy,
      Status,
    } = req.body;

    const normalizedIsLinkedToICU = normalizeYesNo(IsLinkedToICU);

    // Validate PatientType if provided
    if (PatientType !== undefined && PatientType !== null && PatientType !== '') {
      if (!allowedPatientTypes.includes(PatientType)) {
        return res.status(400).json({
          success: false,
          message: `PatientType must be one of: ${allowedPatientTypes.join(', ')}`,
        });
      }
    }

    // Business logic: If PatientType is being updated to 'Direct', PatientAppointmentId and EmergencyAdmissionId should be null
    if (PatientType === 'Direct') {
      if (PatientAppointmentId !== undefined && PatientAppointmentId !== null && PatientAppointmentId !== '') {
        return res.status(400).json({
          success: false,
          message: 'PatientAppointmentId should be null for Direct PatientType',
        });
      }
      if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
        return res.status(400).json({
          success: false,
          message: 'EmergencyAdmissionId should be null for Direct PatientType',
        });
      }
    }

    const roomAdmissionId = parseInt(id, 10);
    if (isNaN(roomAdmissionId)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid RoomAdmissionId. Must be an integer. Received: ${id} (type: ${typeof id})`
      });
    }

    // Validate foreign key existence if provided
    if (PatientId !== undefined && PatientId !== null) {
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
      }
    }

    if (AdmittingDoctorId !== undefined && AdmittingDoctorId !== null) {
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AdmittingDoctorId, 10)]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AdmittingDoctorId does not exist' });
      }
    }

    if (RoomBedsId !== undefined && RoomBedsId !== null) {
      const roomBedsIdInt = parseInt(RoomBedsId, 10);
      if (isNaN(roomBedsIdInt)) {
        return res.status(400).json({ success: false, message: 'RoomBedsId must be a valid integer' });
      }
      const roomBedsExists = await db.query('SELECT "RoomBedsId" FROM "RoomBeds" WHERE "RoomBedsId" = $1', [roomBedsIdInt]);
      if (roomBedsExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'RoomBedsId does not exist' });
      }
    }

    if (PatientAppointmentId !== undefined && PatientAppointmentId !== null) {
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [parseInt(PatientAppointmentId, 10)]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientAppointmentId does not exist' });
      }
    }

    if (EmergencyAdmissionId !== undefined && EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
      const emergencyAdmissionIdInt = parseInt(EmergencyAdmissionId, 10);
      if (isNaN(emergencyAdmissionIdInt)) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId must be a valid integer' });
      }
      const emergencyAdmissionExists = await db.query('SELECT "EmergencyAdmissionId" FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1', [emergencyAdmissionIdInt]);
      if (emergencyAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyAdmissionId does not exist' });
      }
    }

    if (ShiftedTo !== undefined && ShiftedTo !== null) {
      const shiftedToExists = await db.query('SELECT "RoomBedsId" FROM "RoomBeds" WHERE "RoomBedsId" = $1', [parseInt(ShiftedTo, 10)]);
      if (shiftedToExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ShiftedTo RoomBedsId does not exist' });
      }
    }

    if (OTAdmissionId !== undefined && OTAdmissionId !== null) {
      const otAdmissionExists = await db.query('SELECT "PatientOTAllocationId" FROM "PatientOTAllocation" WHERE "PatientOTAllocationId" = $1', [parseInt(OTAdmissionId, 10)]);
      if (otAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTAdmissionId does not exist' });
      }
    }

    if (IsLinkedToICU !== undefined && IsLinkedToICU !== null && IsLinkedToICU !== '') {
      if (!normalizedIsLinkedToICU) {
        return res.status(400).json({ success: false, message: 'IsLinkedToICU must be "Yes" or "No"' });
      }
    }

    if (ICUAdmissionId !== undefined && ICUAdmissionId !== null) {
      const icuAdmissionExists = await db.query('SELECT "PatientICUAdmissionId" FROM "PatientICUAdmission" WHERE "PatientICUAdmissionId" = $1::uuid', [ICUAdmissionId]);
      if (icuAdmissionExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'ICUAdmissionId does not exist' });
      }
    }

    if (BillId !== undefined && BillId !== null) {
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [parseInt(BillId, 10)]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
    }

    if (AllocatedBy !== undefined && AllocatedBy !== null) {
      const allocatedByExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AllocatedBy, 10)]);
      if (allocatedByExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AllocatedBy User does not exist' });
      }
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (PatientAppointmentId !== undefined) {
      updates.push(`"PatientAppointmentId" = $${paramIndex++}`);
      params.push(PatientAppointmentId || null);
    }
    if (EmergencyAdmissionId !== undefined) {
      if (EmergencyAdmissionId !== null && EmergencyAdmissionId !== '') {
        const emergencyAdmissionIdInt = parseInt(EmergencyAdmissionId, 10);
        if (isNaN(emergencyAdmissionIdInt)) {
          return res.status(400).json({ success: false, message: 'EmergencyAdmissionId must be a valid integer' });
        }
        const emergencyAdmissionExists = await db.query('SELECT "EmergencyAdmissionId" FROM "EmergencyAdmission" WHERE "EmergencyAdmissionId" = $1', [emergencyAdmissionIdInt]);
        if (emergencyAdmissionExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'EmergencyAdmissionId does not exist' });
        }
        updates.push(`"EmergencyAdmissionId" = $${paramIndex++}`);
        params.push(emergencyAdmissionIdInt);
      } else {
        updates.push(`"EmergencyAdmissionId" = $${paramIndex++}`);
        params.push(null);
      }
    }
    if (PatientType !== undefined) {
      updates.push(`"PatientType" = $${paramIndex++}`);
      params.push(PatientType || null);
    }
    if (AdmittingDoctorId !== undefined) {
      updates.push(`"AdmittingDoctorId" = $${paramIndex++}`);
      params.push(parseInt(AdmittingDoctorId, 10));
    }
    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}::uuid`);
      params.push(PatientId);
    }
    if (RoomBedsId !== undefined) {
      updates.push(`"RoomBedsId" = $${paramIndex++}`);
      params.push(parseInt(RoomBedsId, 10));
    }
    if (RoomAllocationDate !== undefined) {
      updates.push(`"RoomAllocationDate" = $${paramIndex++}`);
      params.push(RoomAllocationDate);
    }
    if (RoomVacantDate !== undefined) {
      updates.push(`"RoomVacantDate" = $${paramIndex++}`);
      params.push(RoomVacantDate || null);
    }
    if (AdmissionStatus !== undefined) {
      const normalizedAdmissionStatus = normalizeAdmissionStatus(AdmissionStatus);
      if (!normalizedAdmissionStatus && AdmissionStatus !== null && AdmissionStatus !== '') {
        return res.status(400).json({ success: false, message: `AdmissionStatus must be one of: ${allowedAdmissionStatus.join(', ')}` });
      }
      updates.push(`"AdmissionStatus" = $${paramIndex++}`);
      params.push(normalizedAdmissionStatus ?? null);
    }
    if (CaseSheetDetails !== undefined) {
      updates.push(`"CaseSheetDetails" = $${paramIndex++}`);
      params.push(CaseSheetDetails || null);
    }
    if (CaseSheet !== undefined) {
      updates.push(`"CaseSheet" = $${paramIndex++}`);
      params.push(CaseSheet || null);
    }
    if (ShiftToAnotherRoom !== undefined) {
      updates.push(`"ShiftToAnotherRoom" = $${paramIndex++}`);
      params.push(ShiftToAnotherRoom);
    }
    if (ShiftedTo !== undefined) {
      updates.push(`"ShiftedTo" = $${paramIndex++}`);
      params.push(ShiftedTo ? parseInt(ShiftedTo, 10) : null);
    }
    if (ShiftedToDetails !== undefined) {
      updates.push(`"ShiftedToDetails" = $${paramIndex++}`);
      params.push(ShiftedToDetails || null);
    }
    if (ScheduleOT !== undefined) {
      updates.push(`"ScheduleOT" = $${paramIndex++}`);
      params.push(ScheduleOT);
    }
    if (OTAdmissionId !== undefined) {
      updates.push(`"OTAdmissionId" = $${paramIndex++}`);
      params.push(OTAdmissionId || null);
    }
    if (IsLinkedToICU !== undefined) {
      if (!normalizedIsLinkedToICU && IsLinkedToICU !== null && IsLinkedToICU !== '') {
        return res.status(400).json({ success: false, message: 'IsLinkedToICU must be "Yes" or "No"' });
      }
      updates.push(`"IsLinkedToICU" = $${paramIndex++}`);
      params.push(normalizedIsLinkedToICU ?? null);
    }
    if (ICUAdmissionId !== undefined) {
      updates.push(`"ICUAdmissionId" = $${paramIndex++}::uuid`);
      params.push(ICUAdmissionId || null);
    }
    if (BillId !== undefined) {
      updates.push(`"BillId" = $${paramIndex++}`);
      params.push(BillId || null);
    }
    if (AllocatedBy !== undefined) {
      updates.push(`"AllocatedBy" = $${paramIndex++}`);
      params.push(AllocatedBy ? parseInt(AllocatedBy, 10) : null);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(roomAdmissionId);
    const updateQuery = `
      UPDATE "RoomAdmission"
      SET ${updates.join(', ')}
      WHERE "RoomAdmissionId" = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room admission not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room admission updated successfully',
      data: mapRoomAdmissionRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please verify all referenced IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating room admission',
      error: error.message,
    });
  }
};


exports.deleteRoomAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const roomAdmissionId = parseInt(id, 10);
    if (isNaN(roomAdmissionId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid RoomAdmissionId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1 RETURNING *',
      [roomAdmissionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room admission not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room admission deleted successfully',
      data: mapRoomAdmissionRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room admission. It is referenced by other records.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting room admission',
      error: error.message,
    });
  }
};

/**
 * Get Room Capacity Overview data - RoomType wise with Total Beds, Occupied, Available, and Percentage
 * Returns capacity overview for each room type
 */
exports.getRoomCapacityOverview = async (req, res) => {
  try {
    const query = `
      SELECT 
        rb."RoomType",
        COUNT(DISTINCT rb."RoomBedsId") AS "TotalBeds",
        COUNT(DISTINCT CASE 
          WHEN ra."Status" = 'Active' 
          AND ra."AdmissionStatus" != 'Discharged' 
          THEN ra."RoomBedsId" 
        END) AS "Occupied"
      FROM "RoomBeds" rb
      LEFT JOIN "RoomAdmission" ra ON rb."RoomBedsId" = ra."RoomBedsId"
      WHERE rb."Status" = 'Active'
      GROUP BY rb."RoomType"
      ORDER BY 
        CASE rb."RoomType"
          WHEN 'Special' THEN 1
          WHEN 'Special Shared' THEN 2
          WHEN 'Regular' THEN 3
          ELSE 4
        END
    `;

    const { rows } = await db.query(query);

    // Format data with calculations
    const capacityData = rows.map(row => {
      const roomType = row.RoomType || row.roomtype;
      const totalBeds = parseInt(row.TotalBeds || row.totalbeds, 10) || 0;
      const occupied = parseInt(row.Occupied || row.occupied, 10) || 0;
      const available = totalBeds - occupied;
      const percentage = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

      // Format room type name for display
      let roomTypeName = roomType;
      if (roomType === 'Regular') {
        roomTypeName = 'Regular Ward';
      } else if (roomType === 'Special') {
        roomTypeName = 'Special Room';
      } else if (roomType === 'Special Shared') {
        roomTypeName = 'Special Shared Room';
      }

      return {
        roomType: roomTypeName,
        percentage: percentage,
        totalBeds: totalBeds,
        occupied: occupied,
        available: available
      };
    });

    res.status(200).json({
      success: true,
      message: 'Room Capacity Overview data retrieved successfully',
      data: capacityData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Room Capacity Overview data',
      error: error.message,
    });
  }
};

/**
 * Get RoomAdmissions Data with detailed information
 * Returns Bed No, Patient Name, Age/Gender, Room Type, Admission Date, Admitted By, Diagnosis, AdmissionStatus
 * Optional query parameters:
 * - status: Filter by status (Active, Inactive)
 * - admissionStatus: Filter by admission status (Active, Moved to ICU, Surgery Scheduled, Discharged)
 */
exports.getRoomAdmissionsData = async (req, res) => {
  try {
    const { status, admissionStatus } = req.query;
    
    let query = `
      SELECT 
        ra.*,
        rb."BedNo",
        rb."RoomNo",
        rb."RoomType",
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        ra."RoomAllocationDate" AS "AdmissionDate",
        u."UserName" AS "AdmittedBy",
        ra."CaseSheetDetails" AS "Diagnosis",
        d."UserName" as "AdmittingDoctorName",
        latest_appt."PatientAppointmentId" as "PatientAppointmentId",
        latest_appt."AppointmentDate" as "AppointmentDate",
        latest_appt."TokenNo" as "AppointmentTokenNo",
        latest_emergency."EmergencyAdmissionId" as "LatestEmergencyAdmissionId",
        latest_emergency."EmergencyAdmissionDate" as "EmergencyAdmissionDate",
        latest_emergency."EmergencyBedId" as "EmergencyBedId",
        latest_emergency."EmergencyStatus" as "EmergencyStatus",
        latest_emergency."EmergencyBedNo" as "EmergencyBedNo",
        TO_CHAR(ra."RoomAllocationDate", 'DD-MM-YYYY HH24:MI') AS "RoomAllocationDate"
      FROM "RoomAdmission" ra
      INNER JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      INNER JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON ra."AllocatedBy" = u."UserId"
      LEFT JOIN "Users" d ON ra."AdmittingDoctorId" = d."UserId"
      LEFT JOIN LATERAL (
        SELECT 
          pa."PatientAppointmentId",
          pa."AppointmentDate",
          pa."TokenNo"
        FROM "PatientAppointment" pa
        WHERE pa."PatientId" = ra."PatientId"
        ORDER BY pa."AppointmentDate" DESC, pa."PatientAppointmentId" DESC
        LIMIT 1
      ) latest_appt ON true
      LEFT JOIN LATERAL (
        SELECT 
          ea."EmergencyAdmissionId",
          ea."EmergencyAdmissionDate",
          ea."EmergencyBedId",
          ea."EmergencyStatus",
          eb."EmergencyBedNo"
        FROM "EmergencyAdmission" ea
        LEFT JOIN "EmergencyBed" eb ON ea."EmergencyBedId" = eb."EmergencyBedId"
        WHERE ea."PatientId" = ra."PatientId"
        ORDER BY ea."EmergencyAdmissionDate" DESC, ea."EmergencyAdmissionId" DESC
        LIMIT 1
      ) latest_emergency ON true
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`ra."Status" = $${params.length + 1}`);
      params.push(status);
    }
    
    if (admissionStatus) {
      conditions.push(`ra."AdmissionStatus" = $${params.length + 1}`);
      params.push(admissionStatus);
    }
    
    // Default: Only show active admissions that are not discharged
    if (!status && !admissionStatus) {
      conditions.push(`ra."Status" = $${params.length + 1}`);
      params.push('Active');
      //conditions.push(`ra."AdmissionStatus" != $${params.length + 1}`);
      //params.push('Discharged');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY ra."RoomAllocationDate" DESC';
    console.log("query****************", query);
    const { rows } = await db.query(query, params);
    
    // Format data with all required fields
    const formattedData = rows.map(row => {
      const age = row.Age || row.age || null;
      const gender = row.Gender || row.gender || null;
      const mappedRow = mapRoomAdmissionRow(row);
      
      return {
        // All required RoomAdmission fields
        RoomAdmissionId: mappedRow.RoomAdmissionId,
        PatientAppointmentId: mappedRow.PatientAppointmentId,
        EmergencyAdmissionId: mappedRow.EmergencyAdmissionId,
        PatientType: mappedRow.PatientType,
        AdmittingDoctorId: mappedRow.AdmittingDoctorId,
        PatientId: mappedRow.PatientId,
        RoomBedsId: mappedRow.RoomBedsId,
        RoomAllocationDate: mappedRow.RoomAllocationDate,
        RoomVacantDate: mappedRow.RoomVacantDate,
        AdmissionStatus: mappedRow.AdmissionStatus,
        CaseSheetDetails: mappedRow.CaseSheetDetails,
        CaseSheet: mappedRow.CaseSheet,
        ShiftToAnotherRoom: mappedRow.ShiftToAnotherRoom,
        ShiftedTo: mappedRow.ShiftedTo,
        ShiftedToDetails: mappedRow.ShiftedToDetails,
        ScheduleOT: mappedRow.ScheduleOT,
        OTAdmissionId: mappedRow.OTAdmissionId,
        IsLinkedToICU: mappedRow.IsLinkedToICU,
        ICUAdmissionId: mappedRow.ICUAdmissionId,
        BillId: mappedRow.BillId,
        AllocatedBy: mappedRow.AllocatedBy,
        AllocatedAt: mappedRow.AllocatedAt,
        Status: mappedRow.Status,
        // Additional display fields
        roomAdmissionId: mappedRow.RoomAdmissionId,
        bedNo: row.BedNo || row.bedno || null,
        roomNo: row.RoomNo || row.roomno || null,
        patientName: row.PatientName || row.patientname || null,
        age: age !== null ? parseInt(age, 10) : null,
        gender: gender || null,
        roomType: row.RoomType || row.roomtype || null,
        admissionDate: row.AdmissionDate || row.admissiondate || null,
        admittedBy: row.AdmittedBy || row.admittedby || null,
        admittingDoctorName: row.AdmittingDoctorName || row.admittingdoctorname || null,
        diagnosis: row.Diagnosis || row.diagnosis || null,
        patientNo: row.PatientNo || row.patientno || null,
        appointmentDate: row.AppointmentDate || row.appointmentdate || null,
        appointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
        latestEmergencyAdmissionId: row.LatestEmergencyAdmissionId || row.latestemergencyadmissionid || null,
        emergencyAdmissionDate: row.EmergencyAdmissionDate || row.emergencyadmissiondate || null,
        emergencyBedId: row.EmergencyBedId || row.emergencybedid || null,
        emergencyStatus: row.EmergencyStatus || row.emergencystatus || null,
        emergencyBedNo: row.EmergencyBedNo || row.emergencybedno || null
      };
    });
    
    res.status(200).json({
      success: true,
      message: 'RoomAdmissions data retrieved successfully',
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching RoomAdmissions data',
      error: error.message,
    });
  }
};

/**
 * Get RoomAdmissions Data by ID
 * Returns detailed room admission data for a specific roomAdmissionId
 * Path parameter: roomAdmissionId (required)
 */
exports.getRoomAdmissionsDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const roomAdmissionId = parseInt(id, 10);
    
    if (isNaN(roomAdmissionId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid RoomAdmissionId. Must be an integer. Received: ${id} (type: ${typeof id})`
      });
    }
    
    const query = `
      SELECT 
        ra.*,
        rb."BedNo",
        rb."RoomNo",
        rb."RoomType",
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        d."UserName" AS "AdmittingDoctorName",
        u."UserName" AS "AllocatedByName",
        pa."TokenNo" AS "AppointmentTokenNo"
      FROM "RoomAdmission" ra
      LEFT JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      LEFT JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      LEFT JOIN "Users" u ON ra."AllocatedBy" = u."UserId"
      LEFT JOIN "Users" d ON ra."AdmittingDoctorId" = d."UserId"
      LEFT JOIN "PatientAppointment" pa ON ra."PatientAppointmentId" = pa."PatientAppointmentId"
      WHERE ra."RoomAdmissionId" = $1
    `;
    
    const { rows } = await db.query(query, [roomAdmissionId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room admission not found'
      });
    }
    
    const row = rows[0];
    const mappedRow = mapRoomAdmissionRow(row);
    const age = row.Age || row.age || null;
    const gender = row.Gender || row.gender || null;
    
    const formattedData = {
      // All required RoomAdmission fields
      RoomAdmissionId: mappedRow.RoomAdmissionId,
      PatientAppointmentId: mappedRow.PatientAppointmentId,
      EmergencyAdmissionId: mappedRow.EmergencyAdmissionId,
      PatientType: mappedRow.PatientType,
      AdmittingDoctorId: mappedRow.AdmittingDoctorId,
      PatientId: mappedRow.PatientId,
      RoomBedsId: mappedRow.RoomBedsId,
      RoomAllocationDate: mappedRow.RoomAllocationDate,
      RoomVacantDate: mappedRow.RoomVacantDate,
      AdmissionStatus: mappedRow.AdmissionStatus,
      CaseSheetDetails: mappedRow.CaseSheetDetails,
      CaseSheet: mappedRow.CaseSheet,
      ShiftToAnotherRoom: mappedRow.ShiftToAnotherRoom,
      ShiftedTo: mappedRow.ShiftedTo,
      ShiftedToDetails: mappedRow.ShiftedToDetails,
      ScheduleOT: mappedRow.ScheduleOT,
      OTAdmissionId: mappedRow.OTAdmissionId,
      IsLinkedToICU: mappedRow.IsLinkedToICU,
      ICUAdmissionId: mappedRow.ICUAdmissionId,
      BillId: mappedRow.BillId,
      AllocatedBy: mappedRow.AllocatedBy,
      AllocatedAt: mappedRow.AllocatedAt,
      Status: mappedRow.Status,
      // Additional display fields (for backward compatibility)
      roomAdmissionId: mappedRow.RoomAdmissionId,
      bedNo: row.BedNo || row.bedno || null,
      roomNo: row.RoomNo || row.roomno || null,
      roomType: row.RoomType || row.roomtype || null,
      patientName: row.PatientName || row.patientname || null,
      patientNo: row.PatientNo || row.patientno || null,
      age: age !== null ? parseInt(age, 10) : null,
      gender: gender || null,
      admissionDate: mappedRow.RoomAllocationDate,
      admittedBy: row.AllocatedByName || row.allocatedbyname || null,
      admittingDoctorName: row.AdmittingDoctorName || row.admittingdoctorname || null,
      diagnosis: mappedRow.CaseSheetDetails,
      appointmentTokenNo: row.AppointmentTokenNo || row.appointmenttokenno || null,
    };
    
    res.status(200).json({
      success: true,
      message: 'RoomAdmission data retrieved successfully',
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching RoomAdmission data',
      error: error.message,
    });
  }
};

/**
 * Get Total Admissions Count
 * Returns count of all admissions from RoomAdmission table
 * Optional query parameter: ?status=String (to filter by status)
 */
exports.getTotalAdmissionsCount = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT COUNT(*) AS count FROM "RoomAdmission"';
    const params = [];
    
    if (status) {
      query += ' WHERE "Status" = $1';
      params.push(status);
    }
    
    const { rows } = await db.query(query, params);
    
    const count = parseInt(rows[0].count, 10) || 0;
    
    res.status(200).json({
      success: true,
      message: 'Total admissions count retrieved successfully',
      count: count,
      data: {
        count: count,
        status: status || 'All'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching total admissions count',
      error: error.message,
    });
  }
};

/**
 * Get Room Admissions Dashboard Metrics
 * Returns comprehensive metrics including:
 * - Total Admissions
 * - Active patients
 * - Bed Occupancy (occupied/total)
 * - Occupied beds
 * - Available Beds
 * - Ready for admission (same as available beds)
 * - Average Stay duration in days
 */
exports.getRoomAdmissionsDashboardMetrics = async (req, res) => {
  try {
    const query = `
      WITH bed_counts AS (
        SELECT 
          COUNT(DISTINCT rb."RoomBedsId") FILTER (WHERE rb."Status" = 'Active') AS total_beds,
          COUNT(DISTINCT ra."RoomBedsId") FILTER (
            WHERE ra."Status" = 'Active' 
            AND ra."AdmissionStatus" != 'Discharged'
          ) AS occupied_beds
        FROM "RoomBeds" rb
        LEFT JOIN "RoomAdmission" ra ON rb."RoomBedsId" = ra."RoomBedsId"
        WHERE rb."Status" = 'Active'
      ),
      admission_counts AS (
        SELECT 
          COUNT(*) AS total_admissions,
          COUNT(*) FILTER (
            WHERE "Status" = 'Active' 
            AND "AdmissionStatus" != 'Discharged'
          ) AS active_patients
        FROM "RoomAdmission"
      ),
      avg_stay AS (
        SELECT 
          COALESCE(
            AVG(
              CASE 
                WHEN "RoomVacantDate" IS NOT NULL THEN
                  EXTRACT(EPOCH FROM ("RoomVacantDate" - "RoomAllocationDate")) / 86400.0
                ELSE
                  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "RoomAllocationDate")) / 86400.0
              END
            ),
            0
          ) AS avg_stay_days
        FROM "RoomAdmission"
        WHERE "Status" = 'Active'
      )
      SELECT 
        ac.total_admissions,
        ac.active_patients,
        bc.total_beds,
        bc.occupied_beds,
        (bc.total_beds - bc.occupied_beds) AS available_beds,
        ast.avg_stay_days
      FROM bed_counts bc
      CROSS JOIN admission_counts ac
      CROSS JOIN avg_stay ast
    `;

    const { rows } = await db.query(query);

    const totalAdmissions = parseInt(rows[0].total_admissions || rows[0].totaladmissions, 10) || 0;
    const activePatients = parseInt(rows[0].active_patients || rows[0].activepatients, 10) || 0;
    const totalBeds = parseInt(rows[0].total_beds || rows[0].totalbeds, 10) || 0;
    const occupiedBeds = parseInt(rows[0].occupied_beds || rows[0].occupiedbeds, 10) || 0;
    const availableBeds = parseInt(rows[0].available_beds || rows[0].availablebeds, 10) || 0;
    const avgStayDays = parseFloat(rows[0].avg_stay_days || rows[0].avgstaydays || 0) || 0;

    // Format bed occupancy as "occupied/total"
    const bedOccupancy = totalBeds > 0 ? `${occupiedBeds}/${totalBeds}` : '0/0';

    // Round average stay to 1 decimal place
    const avgStay = Math.round(avgStayDays * 10) / 10;

    res.status(200).json({
      success: true,
      message: 'Room Admissions Dashboard metrics retrieved successfully',
      data: {
        totalAdmissions: totalAdmissions,
        totalBeds: totalBeds,
        activePatients: activePatients,
        bedOccupancy: bedOccupancy,
        occupiedBeds: occupiedBeds,
        availableBeds: availableBeds,
        readyForAdmission: availableBeds,
        avgStay: avgStay
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Room Admissions Dashboard metrics',
      error: error.message,
    });
  }
};

/**
 * Check room availability for admission
 * Query parameters:
 *   - roomBedsId: INTEGER (required) - The RoomBedsId to check
 *   - checkDate: DATE (optional) - Date to check availability for (defaults to today)
 * 
 * Returns:
 *   - isAvailable: Boolean - Whether the room is available
 *   - reason: String - Reason for availability/unavailability
 *   - conflictingAdmissions: Array - List of conflicting admissions if not available
 */
exports.checkRoomAvailability = async (req, res) => {
  try {
    // Accept both roomBedsId and RoomBedsId (case-insensitive)
    const roomBedsId = req.query.roomBedsId || req.query.RoomBedsId;
    const checkDate = req.query.checkDate || req.query.AllocationDate;

    // Validate roomBedsId
    if (!roomBedsId) {
      return res.status(400).json({
        success: false,
        message: 'roomBedsId (or RoomBedsId) is required',
      });
    }

    const roomBedsIdInt = parseInt(roomBedsId, 10);
    if (isNaN(roomBedsIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'roomBedsId must be a valid integer',
      });
    }

    // Validate checkDate if provided
    let checkDateValue = new Date();
    if (checkDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(checkDate)) {
        return res.status(400).json({
          success: false,
          message: 'checkDate must be in YYYY-MM-DD format',
        });
      }
      checkDateValue = new Date(checkDate + 'T00:00:00');
      if (isNaN(checkDateValue.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'checkDate must be a valid date',
        });
      }
    }

    // Format checkDate for SQL query (YYYY-MM-DD)
    const checkDateStr = checkDateValue.toISOString().split('T')[0];

    // Check if room bed exists
    const roomBedCheck = await db.query(
      'SELECT "RoomBedsId", "BedNo", "RoomNo" FROM "RoomBeds" WHERE "RoomBedsId" = $1',
      [roomBedsIdInt]
    );

    if (roomBedCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room bed not found',
      });
    }

    const roomBed = roomBedCheck.rows[0];

    // Query to find conflicting admissions
    // A room is NOT available if:
    // 1. AdmissionStatus is 'Active' or 'Surgery Scheduled' AND
    //    (RoomVacantDate is NULL OR RoomVacantDate is in the future relative to checkDate)
    // 2. The checkDate falls between RoomAllocationDate and RoomVacantDate (if RoomVacantDate exists)
    const query = `
      SELECT 
        ra."RoomAdmissionId",
        ra."RoomAllocationDate",
        ra."RoomVacantDate",
        ra."AdmissionStatus",
        ra."Status",
        p."PatientName",
        p."PatientNo"
      FROM "RoomAdmission" ra
      LEFT JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      WHERE ra."RoomBedsId" = $1
        AND ra."Status" = 'Active'
        AND (
          -- Active or Surgery Scheduled admissions that haven't been vacated
          (
            ra."AdmissionStatus" IN ('Active', 'Surgery Scheduled')
            AND (
              ra."RoomVacantDate" IS NULL 
              OR ra."RoomVacantDate"::date > $2::date
            )
          )
          OR
          -- Check if checkDate falls within the allocation period
          (
            ra."RoomAllocationDate"::date <= $2::date
            AND (
              ra."RoomVacantDate" IS NULL 
              OR ra."RoomVacantDate"::date >= $2::date
            )
            AND ra."AdmissionStatus" != 'Discharged'
          )
        )
      ORDER BY ra."RoomAllocationDate" DESC
    `;

    const { rows } = await db.query(query, [roomBedsIdInt, checkDateStr]);

    const isAvailable = rows.length === 0;
    let reason = '';
    const conflictingAdmissions = rows.map(row => ({
      RoomAdmissionId: row.RoomAdmissionId,
      PatientName: row.PatientName || 'Unknown',
      PatientNo: row.PatientNo || 'N/A',
      RoomAllocationDate: row.RoomAllocationDate,
      RoomVacantDate: row.RoomVacantDate,
      AdmissionStatus: row.AdmissionStatus,
    }));

    if (isAvailable) {
      reason = `Room ${roomBed.RoomNo || 'N/A'}, Bed ${roomBed.BedNo || 'N/A'} is available for admission on ${checkDateStr}`;
    } else {
      const activeAdmissions = rows.filter(r => r.AdmissionStatus === 'Active');
      const scheduledAdmissions = rows.filter(r => r.AdmissionStatus === 'Surgery Scheduled');
      
      if (activeAdmissions.length > 0) {
        reason = `Room is currently occupied by ${activeAdmissions.length} active admission(s)`;
      } else if (scheduledAdmissions.length > 0) {
        reason = `Room has ${scheduledAdmissions.length} surgery scheduled admission(s)`;
      } else {
        reason = `Room has ${rows.length} conflicting admission(s)`;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Room availability checked successfully',
      data: {
        roomBedsId: roomBedsIdInt,
        roomNo: roomBed.RoomNo,
        bedNo: roomBed.BedNo,
        checkDate: checkDateStr,
        isAvailable: isAvailable,
        reason: reason,
        conflictingAdmissions: conflictingAdmissions,
        conflictingCount: rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking room availability',
      error: error.message,
    });
  }
};

