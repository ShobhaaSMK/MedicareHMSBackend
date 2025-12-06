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
        message: 'Invalid RoomAdmissionId. Must be an integer.' 
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

/**
 * Get count of today's IPD admission records with Status = 'Active' and AdmissionStatus != 'Discharged'
 */
exports.getTodayIPDAdmissionsCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
      SELECT COUNT(*) AS count
      FROM "RoomAdmission"
      WHERE DATE("RoomAllocationDate") = $1::date
      AND "Status" = 'Active'
      AND "AdmissionStatus" != 'Discharged'
    `;

    const { rows } = await db.query(query, [today]);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Today\'s IPD admissions count retrieved successfully',
      date: today,
      count: count,
      data: {
        date: today,
        count: count,
        status: 'Active',
        admissionStatus: 'Not Discharged'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s IPD admissions count',
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

