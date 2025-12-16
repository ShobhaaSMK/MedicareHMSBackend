const db = require('../db');

const allowedAdmissionStatus = ['Active', 'Surgery Scheduled', 'Moved to ICU', 'Discharged'];
const allowedYesNo = ['Yes', 'No'];
const allowedStatus = ['Active', 'Inactive'];
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapRoomAdmissionRow = (row) => ({
  RoomAdmissionId: row.RoomAdmissionId || row.roomadmissionid,
  PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
  EmergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
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
    const { status, admissionStatus, patientId, doctorId, roomBedsId } = req.query;
    let query = `
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
        CONCAT(rb."BedNo", '_', ra."RoomAllocationDate"::text) AS "RoomAdmissionId_RoomAllocationDate"
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

  if (requireAll && body.PatientId === undefined) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null) {
    if (!uuidRegex.test(body.PatientId)) {
      errors.push('PatientId must be a valid UUID');
    }
  }

  if (requireAll && body.AdmittingDoctorId === undefined) {
    errors.push('AdmittingDoctorId is required');
  }
  if (body.AdmittingDoctorId !== undefined && body.AdmittingDoctorId !== null) {
    const admittingDoctorIdInt = parseInt(body.AdmittingDoctorId, 10);
    if (isNaN(admittingDoctorIdInt)) {
      errors.push('AdmittingDoctorId must be a valid integer');
    }
  }

  if (requireAll && body.RoomBedsId === undefined) {
    errors.push('RoomBedsId is required');
  }
  if (body.RoomBedsId !== undefined && body.RoomBedsId !== null) {
    const roomBedsIdInt = parseInt(body.RoomBedsId, 10);
    if (isNaN(roomBedsIdInt)) {
      errors.push('RoomBedsId must be a valid integer');
    }
  }

  if (requireAll && body.RoomAllocationDate === undefined) {
    errors.push('RoomAllocationDate is required');
  }
  if (body.RoomAllocationDate !== undefined && body.RoomAllocationDate !== null) {
    const date = new Date(body.RoomAllocationDate);
    if (isNaN(date.getTime())) {
      errors.push('RoomAllocationDate must be a valid date');
    }
  }

  if (body.PatientAppointmentId !== undefined && body.PatientAppointmentId !== null) {
    const appointmentIdInt = parseInt(body.PatientAppointmentId, 10);
    if (isNaN(appointmentIdInt)) {
      errors.push('PatientAppointmentId must be a valid integer');
    }
  }

  if (body.EmergencyBedSlotId !== undefined && body.EmergencyBedSlotId !== null) {
    const emergencyBedSlotIdInt = parseInt(body.EmergencyBedSlotId, 10);
    if (isNaN(emergencyBedSlotIdInt)) {
      errors.push('EmergencyBedSlotId must be a valid integer');
    }
  }

  if (body.RoomVacantDate !== undefined && body.RoomVacantDate !== null) {
    const date = new Date(body.RoomVacantDate);
    if (isNaN(date.getTime())) {
      errors.push('RoomVacantDate must be a valid date');
    }
  }

  if (body.AdmissionStatus && !allowedAdmissionStatus.includes(body.AdmissionStatus)) {
    errors.push('AdmissionStatus must be "Active", "Surgery Scheduled", "Moved to ICU", or "Discharged"');
  }

  if (body.ShiftToAnotherRoom && !allowedYesNo.includes(body.ShiftToAnotherRoom)) {
    errors.push('ShiftToAnotherRoom must be "Yes" or "No"');
  }

  if (body.ShiftedTo !== undefined && body.ShiftedTo !== null) {
    const shiftedToInt = parseInt(body.ShiftedTo, 10);
    if (isNaN(shiftedToInt)) {
      errors.push('ShiftedTo must be a valid integer');
    }
  }

  if (body.ScheduleOT && !allowedYesNo.includes(body.ScheduleOT)) {
    errors.push('ScheduleOT must be "Yes" or "No"');
  }

  if (body.OTAdmissionId !== undefined && body.OTAdmissionId !== null) {
    const otAdmissionIdInt = parseInt(body.OTAdmissionId, 10);
    if (isNaN(otAdmissionIdInt)) {
      errors.push('OTAdmissionId must be a valid integer');
    }
  }

  if (body.IsLinkedToICU && !allowedYesNo.includes(body.IsLinkedToICU)) {
    errors.push('IsLinkedToICU must be "Yes" or "No"');
  }

  if (body.ICUAdmissionId !== undefined && body.ICUAdmissionId !== null) {
    if (!uuidRegex.test(body.ICUAdmissionId)) {
      errors.push('ICUAdmissionId must be a valid UUID');
    }
  }

  if (body.BillId !== undefined && body.BillId !== null) {
    const billIdInt = parseInt(body.BillId, 10);
    if (isNaN(billIdInt)) {
      errors.push('BillId must be a valid integer');
    }
  }

  if (body.AllocatedBy !== undefined && body.AllocatedBy !== null) {
    const allocatedByInt = parseInt(body.AllocatedBy, 10);
    if (isNaN(allocatedByInt)) {
      errors.push('AllocatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be "Active" or "Inactive"');
  }

  return errors;
};

exports.createRoomAdmission = async (req, res) => {
  try {
    const errors = validateRoomAdmissionPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientAppointmentId,
      EmergencyBedSlotId,
      AdmittingDoctorId,
      PatientId,
      RoomBedsId,
      RoomAllocationDate,
      RoomVacantDate,
      AdmissionStatus = 'Active',
      CaseSheetDetails,
      CaseSheet,
      ShiftToAnotherRoom = 'No',
      ShiftedTo,
      ShiftedToDetails,
      ScheduleOT = 'No',
      OTAdmissionId,
      IsLinkedToICU = 'No',
      ICUAdmissionId,
      BillId,
      AllocatedBy,
      Status = 'Active',
    } = req.body;

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

    if (PatientAppointmentId !== undefined && PatientAppointmentId !== null) {
      const appointmentExists = await db.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientAppointmentId" = $1', [parseInt(PatientAppointmentId, 10)]);
      if (appointmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientAppointmentId does not exist' });
      }
    }

    if (EmergencyBedSlotId !== undefined && EmergencyBedSlotId !== null) {
      const emergencyBedSlotExists = await db.query('SELECT "EmergencyBedSlotId" FROM "EmergencyBedSlot" WHERE "EmergencyBedSlotId" = $1', [parseInt(EmergencyBedSlotId, 10)]);
      if (emergencyBedSlotExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyBedSlotId does not exist' });
      }
    }

    if (ShiftedTo !== undefined && ShiftedTo !== null) {
      const shiftedToInt = parseInt(ShiftedTo, 10);
      if (isNaN(shiftedToInt)) {
        return res.status(400).json({ success: false, message: 'ShiftedTo must be a valid integer' });
      }
      const shiftedToExists = await db.query('SELECT "RoomBedsId" FROM "RoomBeds" WHERE "RoomBedsId" = $1', [shiftedToInt]);
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

    const insertQuery = `
      INSERT INTO "RoomAdmission"
        ("PatientAppointmentId", "EmergencyBedSlotId", "AdmittingDoctorId", "PatientId", "RoomBedsId",
         "RoomAllocationDate", "RoomVacantDate", "AdmissionStatus", "CaseSheetDetails", "CaseSheet",
         "ShiftToAnotherRoom", "ShiftedTo", "ShiftedToDetails", "ScheduleOT", "OTAdmissionId",
         "IsLinkedToICU", "ICUAdmissionId", "BillId", "AllocatedBy", "Status")
      VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::uuid, $18, $19, $20)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      PatientAppointmentId || null,
      EmergencyBedSlotId || null,
      parseInt(AdmittingDoctorId, 10),
      PatientId,
      parseInt(RoomBedsId, 10),
      RoomAllocationDate,
      RoomVacantDate || null,
      AdmissionStatus,
      CaseSheetDetails || null,
      CaseSheet || null,
      ShiftToAnotherRoom,
      ShiftedTo ? parseInt(ShiftedTo, 10) : null,
      ShiftedToDetails || null,
      ScheduleOT,
      OTAdmissionId || null,
      IsLinkedToICU,
      ICUAdmissionId || null,
      BillId || null,
      AllocatedBy ? parseInt(AllocatedBy, 10) : null,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Room admission created successfully',
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
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. This record already exists.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating room admission',
      error: error.message,
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
      EmergencyBedSlotId,
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

    if (EmergencyBedSlotId !== undefined && EmergencyBedSlotId !== null) {
      const emergencyBedSlotExists = await db.query('SELECT "EmergencyBedSlotId" FROM "EmergencyBedSlot" WHERE "EmergencyBedSlotId" = $1', [parseInt(EmergencyBedSlotId, 10)]);
      if (emergencyBedSlotExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyBedSlotId does not exist' });
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
    if (EmergencyBedSlotId !== undefined) {
      updates.push(`"EmergencyBedSlotId" = $${paramIndex++}`);
      params.push(EmergencyBedSlotId || null);
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
      updates.push(`"AdmissionStatus" = $${paramIndex++}`);
      params.push(AdmissionStatus);
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
      updates.push(`"IsLinkedToICU" = $${paramIndex++}`);
      params.push(IsLinkedToICU);
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
 * - admissionStatus: Filter by admission status (Active, Surgery Scheduled, Moved to ICU, Discharged)
 */
exports.getRoomAdmissionsData = async (req, res) => {
  try {
    const { status, admissionStatus } = req.query;
    
    let query = `
      SELECT 
        ra."RoomAdmissionId",
        rb."BedNo",
        p."PatientName",
        p."Age",
        p."Gender",
        rb."RoomType",
        ra."RoomAllocationDate" AS "AdmissionDate",
        u."UserName" AS "AdmittedBy",
        ra."CaseSheetDetails" AS "Diagnosis",
        ra."AdmissionStatus",
        ra."Status",
        ra."ScheduleOT"
      FROM "RoomAdmission" ra
      INNER JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      INNER JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
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
    
    // Default: Only show active admissions that are not discharged
    if (!status && !admissionStatus) {
      conditions.push(`ra."Status" = $${params.length + 1}`);
      params.push('Active');
      conditions.push(`ra."AdmissionStatus" != $${params.length + 1}`);
      params.push('Discharged');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY ra."RoomAllocationDate" DESC';
    console.log("query****************", query);
    const { rows } = await db.query(query, params);
    
    // Format data with separate Age and Gender fields
    const formattedData = rows.map(row => {
      const age = row.Age || row.age || null;
      const gender = row.Gender || row.gender || null;
      
      return {
        roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
        bedNo: row.BedNo || row.bedno || null,
        patientName: row.PatientName || row.patientname || null,
        age: age !== null ? parseInt(age, 10) : null,
        gender: gender || null,
        roomType: row.RoomType || row.roomtype || null,
        admissionDate: row.AdmissionDate || row.admissiondate || null,
        admittedBy: row.AdmittedBy || row.admittedby || null,
        diagnosis: row.Diagnosis || row.diagnosis || null,
        admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
        status: row.Status || row.status || null,
        scheduleOT: row.ScheduleOT || row.scheduleot || null
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
        ra."RoomAdmissionId",
        rb."BedNo",
        p."PatientName",
        p."Age",
        p."Gender",
        rb."RoomType",
        ra."RoomAllocationDate" AS "AdmissionDate",
        u."UserName" AS "AdmittedBy",
        ra."CaseSheetDetails" AS "Diagnosis",
        ra."AdmissionStatus",
        ra."Status",
        ra."ScheduleOT"
      FROM "RoomAdmission" ra
      INNER JOIN "RoomBeds" rb ON ra."RoomBedsId" = rb."RoomBedsId"
      INNER JOIN "PatientRegistration" p ON ra."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON ra."AllocatedBy" = u."UserId"
      WHERE ra."RoomAdmissionId" = $1
    `;
    
    const { rows } = await db.query(query, [roomAdmissionId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Room admission with ID ${roomAdmissionId} not found`
      });
    }
    
    // Format data with separate Age and Gender fields
    const row = rows[0];
    const age = row.Age || row.age || null;
    const gender = row.Gender || row.gender || null;
    
    const formattedData = {
      roomAdmissionId: row.RoomAdmissionId || row.roomadmissionid || null,
      bedNo: row.BedNo || row.bedno || null,
      patientName: row.PatientName || row.patientname || null,
      age: age !== null ? parseInt(age, 10) : null,
      gender: gender || null,
      roomType: row.RoomType || row.roomtype || null,
      admissionDate: row.AdmissionDate || row.admissiondate || null,
      admittedBy: row.AdmittedBy || row.admittedby || null,
      diagnosis: row.Diagnosis || row.diagnosis || null,
      admissionStatus: row.AdmissionStatus || row.admissionstatus || null,
      status: row.Status || row.status || null,
      scheduleOT: row.ScheduleOT || row.scheduleot || null
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

