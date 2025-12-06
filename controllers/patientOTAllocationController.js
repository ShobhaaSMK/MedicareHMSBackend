const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];
const allowedOperationStatus = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

const mapPatientOTAllocationRow = (row) => ({
  PatientOTAllocationId: row.PatientOTAllocationId || row.patientotallocationid,
  PatientId: row.PatientId || row.patientid,
  PatientAppointmentId: row.PatientAppointmentId || row.patientappointmentid || null,
  EmergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid || null,
  OTId: row.OTId || row.otid,
  SurgeryId: row.SurgeryId || row.surgeryid || null,
  LeadSurgeonId: row.LeadSurgeonId || row.leadsurgeonid,
  AssistantDoctorId: row.AssistantDoctorId || row.assistantdoctorid || null,
  AnaesthetistId: row.AnaesthetistId || row.anaesthetistid || null,
  NurseId: row.NurseId || row.nurseid || null,
  OTAllocationDate: row.OTAllocationDate || row.otallocationdate,
  Duration: row.Duration || row.duration || null,
  OTStartTime: row.OTStartTime || row.otstarttime || null,
  OTEndTime: row.OTEndTime || row.otendtime || null,
  OTActualStartTime: row.OTActualStartTime || row.otactualstarttime || null,
  OTActualEndTime: row.OTActualEndTime || row.otactualendtime || null,
  OperationDescription: row.OperationDescription || row.operationdescription || null,
  OperationStatus: row.OperationStatus || row.operationstatus || 'Scheduled',
  PreOperationNotes: row.PreOperationNotes || row.preoperationnotes || null,
  PostOperationNotes: row.PostOperationNotes || row.postoperationnotes || null,
  OTDocuments: row.OTDocuments || row.otdocuments || null,
  BillId: row.BillId || row.billid || null,
  OTAllocationCreatedBy: row.OTAllocationCreatedBy || row.otallocationcreatedby || null,
  OTAllocationCreatedAt: row.OTAllocationCreatedAt || row.otallocationcreatedat,
  Status: row.Status || row.status,
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  OTNo: row.OTNo || row.otno || null,
  SurgeryName: row.SurgeryName || row.surgeryname || null,
  LeadSurgeonName: row.LeadSurgeonName || row.leadsurgeonname || null,
  AssistantDoctorName: row.AssistantDoctorName || row.assistantdoctorname || null,
  AnaesthetistName: row.AnaesthetistName || row.anaesthetistname || null,
  NurseName: row.NurseName || row.nursename || null,
  BillNo: row.BillNo || row.billno || null,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
});

exports.getAllPatientOTAllocations = async (req, res) => {
  try {
    const { status, operationStatus, patientId, otId, surgeryId, leadSurgeonId, fromDate, toDate } = req.query;
    let query = `
      SELECT 
        pta.*,
        p."PatientName", p."PatientNo",
        ot."OTNo",
        sp."SurgeryName",
        ls."UserName" AS "LeadSurgeonName",
        ad."UserName" AS "AssistantDoctorName",
        an."UserName" AS "AnaesthetistName",
        n."UserName" AS "NurseName",
        b."BillNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientOTAllocation" pta
      LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
      LEFT JOIN "OT" ot ON pta."OTId" = ot."OTId"
      LEFT JOIN "SurgeryProcedure" sp ON pta."SurgeryId" = sp."SurgeryId"
      LEFT JOIN "Users" ls ON pta."LeadSurgeonId" = ls."UserId"
      LEFT JOIN "Users" ad ON pta."AssistantDoctorId" = ad."UserId"
      LEFT JOIN "Users" an ON pta."AnaesthetistId" = an."UserId"
      LEFT JOIN "Users" n ON pta."NurseId" = n."UserId"
      LEFT JOIN "Bills" b ON pta."BillId" = b."BillId"
      LEFT JOIN "Users" u ON pta."OTAllocationCreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`pta."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (operationStatus) {
      conditions.push(`pta."OperationStatus" = $${params.length + 1}`);
      params.push(operationStatus);
    }
    if (patientId) {
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`pta."PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
      }
    }
    if (otId) {
      const otIdInt = parseInt(otId, 10);
      if (!isNaN(otIdInt)) {
        conditions.push(`pta."OTId" = $${params.length + 1}`);
        params.push(otIdInt);
      }
    }
    if (surgeryId) {
      const surgeryIdInt = parseInt(surgeryId, 10);
      if (!isNaN(surgeryIdInt)) {
        conditions.push(`pta."SurgeryId" = $${params.length + 1}`);
        params.push(surgeryIdInt);
      }
    }
    if (leadSurgeonId) {
      const leadSurgeonIdInt = parseInt(leadSurgeonId, 10);
      if (!isNaN(leadSurgeonIdInt)) {
        conditions.push(`pta."LeadSurgeonId" = $${params.length + 1}`);
        params.push(leadSurgeonIdInt);
      }
    }
    if (fromDate) {
      conditions.push(`pta."OTAllocationDate" >= $${params.length + 1}::date`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`pta."OTAllocationDate" <= $${params.length + 1}::date`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY pta."OTAllocationDate" DESC, pta."OTStartTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientOTAllocationRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient OT allocations',
      error: error.message,
    });
  }
};

exports.getPatientOTAllocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const otAllocationId = parseInt(id, 10);
    if (isNaN(otAllocationId)) {
      return res.status(400).json({ success: false, message: 'Invalid PatientOTAllocationId. Must be an integer.' });
    }

    const { rows } = await db.query(
      `
      SELECT 
        pta.*,
        p."PatientName", p."PatientNo",
        ot."OTNo",
        sp."SurgeryName",
        ls."UserName" AS "LeadSurgeonName",
        ad."UserName" AS "AssistantDoctorName",
        an."UserName" AS "AnaesthetistName",
        n."UserName" AS "NurseName",
        b."BillNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientOTAllocation" pta
      LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
      LEFT JOIN "OT" ot ON pta."OTId" = ot."OTId"
      LEFT JOIN "SurgeryProcedure" sp ON pta."SurgeryId" = sp."SurgeryId"
      LEFT JOIN "Users" ls ON pta."LeadSurgeonId" = ls."UserId"
      LEFT JOIN "Users" ad ON pta."AssistantDoctorId" = ad."UserId"
      LEFT JOIN "Users" an ON pta."AnaesthetistId" = an."UserId"
      LEFT JOIN "Users" n ON pta."NurseId" = n."UserId"
      LEFT JOIN "Bills" b ON pta."BillId" = b."BillId"
      LEFT JOIN "Users" u ON pta."OTAllocationCreatedBy" = u."UserId"
      WHERE pta."PatientOTAllocationId" = $1
      `,
      [otAllocationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient OT allocation not found' });
    }

    res.status(200).json({ success: true, data: mapPatientOTAllocationRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient OT allocation',
      error: error.message,
    });
  }
};

const validatePatientOTAllocationPayload = (body, requireAll = true) => {
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


  if (body.PatientAppointmentId !== undefined && body.PatientAppointmentId !== null) {
    const appointmentIdInt = parseInt(body.PatientAppointmentId, 10);
    if (isNaN(appointmentIdInt)) {
      errors.push('PatientAppointmentId must be a valid integer');
    }
  }

  if (body.RoomAdmissionId !== undefined && body.RoomAdmissionId !== null) {
    const roomAdmissionIdInt = parseInt(body.RoomAdmissionId, 10);
    if (isNaN(roomAdmissionIdInt)) {
      errors.push('RoomAdmissionId must be a valid integer');
    }
  }

  if (body.EmergencyBedSlotId !== undefined && body.EmergencyBedSlotId !== null) {
    const emergencyBedSlotIdInt = parseInt(body.EmergencyBedSlotId, 10);
    if (isNaN(emergencyBedSlotIdInt)) {
      errors.push('EmergencyBedSlotId must be a valid integer');
    }
  }

  if (requireAll && body.OTId === undefined) {
    errors.push('OTId is required');
  }
  if (body.OTId !== undefined && body.OTId !== null) {
    const otIdInt = parseInt(body.OTId, 10);
    if (isNaN(otIdInt)) {
      errors.push('OTId must be a valid integer');
    }
  }

  if (body.OTSlotId !== undefined && body.OTSlotId !== null) {
    const otSlotIdInt = parseInt(body.OTSlotId, 10);
    if (isNaN(otSlotIdInt)) {
      errors.push('OTSlotId must be a valid integer');
    }
  }

  if (body.SurgeryId !== undefined && body.SurgeryId !== null) {
    const surgeryIdInt = parseInt(body.SurgeryId, 10);
    if (isNaN(surgeryIdInt)) {
      errors.push('SurgeryId must be a valid integer');
    }
  }

  if (requireAll && body.LeadSurgeonId === undefined) {
    errors.push('LeadSurgeonId is required');
  }
  if (body.LeadSurgeonId !== undefined && body.LeadSurgeonId !== null) {
    const leadSurgeonIdInt = parseInt(body.LeadSurgeonId, 10);
    if (isNaN(leadSurgeonIdInt)) {
      errors.push('LeadSurgeonId must be a valid integer');
    }
  }

  if (body.AssistantDoctorId !== undefined && body.AssistantDoctorId !== null) {
    const assistantDoctorIdInt = parseInt(body.AssistantDoctorId, 10);
    if (isNaN(assistantDoctorIdInt)) {
      errors.push('AssistantDoctorId must be a valid integer');
    }
  }

  if (body.AnaesthetistId !== undefined && body.AnaesthetistId !== null) {
    const anaesthetistIdInt = parseInt(body.AnaesthetistId, 10);
    if (isNaN(anaesthetistIdInt)) {
      errors.push('AnaesthetistId must be a valid integer');
    }
  }

  if (body.NurseId !== undefined && body.NurseId !== null) {
    const nurseIdInt = parseInt(body.NurseId, 10);
    if (isNaN(nurseIdInt)) {
      errors.push('NurseId must be a valid integer');
    }
  }

  if (requireAll && !body.OTAllocationDate) {
    errors.push('OTAllocationDate is required');
  }
  if (body.OTAllocationDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.OTAllocationDate)) {
    errors.push('OTAllocationDate must be in YYYY-MM-DD format');
  }

  if (body.OTStartTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.OTStartTime)) {
    errors.push('OTStartTime must be in HH:MM or HH:MM:SS format');
  }

  if (body.OTEndTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.OTEndTime)) {
    errors.push('OTEndTime must be in HH:MM or HH:MM:SS format');
  }

  if (body.OTActualStartTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.OTActualStartTime)) {
    errors.push('OTActualStartTime must be in HH:MM or HH:MM:SS format');
  }

  if (body.OTActualEndTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.OTActualEndTime)) {
    errors.push('OTActualEndTime must be in HH:MM or HH:MM:SS format');
  }

  if (body.OperationStatus && !allowedOperationStatus.includes(body.OperationStatus)) {
    errors.push(`OperationStatus must be one of: ${allowedOperationStatus.join(', ')}`);
  }

  if (body.BillId !== undefined && body.BillId !== null) {
    const billIdInt = parseInt(body.BillId, 10);
    if (isNaN(billIdInt)) {
      errors.push('BillId must be a valid integer');
    }
  }

  if (body.OTAllocationCreatedBy !== undefined && body.OTAllocationCreatedBy !== null) {
    const createdByInt = parseInt(body.OTAllocationCreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('OTAllocationCreatedBy must be a valid integer');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  return errors;
};

exports.createPatientOTAllocation = async (req, res) => {
  try {
    const errors = validatePatientOTAllocationPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientId,
      RoomAdmissionId,
      PatientAppointmentId,
      EmergencyBedSlotId,
      OTId,
      SurgeryId,
      LeadSurgeonId,
      AssistantDoctorId,
      AnaesthetistId,
      NurseId,
      OTAllocationDate,
      Duration,
      OTStartTime,
      OTEndTime,
      OTActualStartTime,
      OTActualEndTime,
      OperationDescription,
      OperationStatus = 'Scheduled',
      PreOperationNotes,
      PostOperationNotes,
      OTDocuments,
      BillId,
      OTAllocationCreatedBy,
      Status = 'Active',
    } = req.body;

    // Validate foreign key existence
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(PatientId)) {
      return res.status(400).json({ success: false, message: 'PatientId must be a valid UUID' });
    }
    const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
    if (patientExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'PatientId does not exist' });
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

    const otExists = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [parseInt(OTId, 10)]);
    if (otExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTId does not exist' });
    }

    if (SurgeryId !== undefined && SurgeryId !== null) {
      const surgeryExists = await db.query('SELECT "SurgeryId" FROM "SurgeryProcedure" WHERE "SurgeryId" = $1', [parseInt(SurgeryId, 10)]);
      if (surgeryExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'SurgeryId does not exist' });
      }
    }

    const leadSurgeonExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(LeadSurgeonId, 10)]);
    if (leadSurgeonExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'LeadSurgeonId does not exist' });
    }

    if (AssistantDoctorId !== undefined && AssistantDoctorId !== null) {
      const assistantDoctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AssistantDoctorId, 10)]);
      if (assistantDoctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AssistantDoctorId does not exist' });
      }
    }

    if (AnaesthetistId !== undefined && AnaesthetistId !== null) {
      const anaesthetistExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AnaesthetistId, 10)]);
      if (anaesthetistExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AnaesthetistId does not exist' });
      }
    }

    if (NurseId !== undefined && NurseId !== null) {
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(NurseId, 10)]);
      if (nurseExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'NurseId does not exist' });
      }
    }

    if (BillId !== undefined && BillId !== null) {
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [parseInt(BillId, 10)]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
    }

    let createdByValue = null;
    if (OTAllocationCreatedBy !== undefined && OTAllocationCreatedBy !== null && OTAllocationCreatedBy !== '') {
      const createdByInt = parseInt(OTAllocationCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'OTAllocationCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTAllocationCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    }

    const insertQuery = `
      INSERT INTO "PatientOTAllocation"
        ("PatientId", "RoomAdmissionId", "PatientAppointmentId", "EmergencyBedSlotId", "OTId", "SurgeryId",
         "LeadSurgeonId", "AssistantDoctorId", "AnaesthetistId", "NurseId",
         "OTAllocationDate", "Duration", "OTStartTime", "OTEndTime",
         "OTActualStartTime", "OTActualEndTime", "OperationDescription",
         "OperationStatus", "PreOperationNotes", "PostOperationNotes", "OTDocuments",
         "BillId", "OTAllocationCreatedBy", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      PatientId, // UUID
      RoomAdmissionId ? parseInt(RoomAdmissionId, 10) : null,
      PatientAppointmentId ? parseInt(PatientAppointmentId, 10) : null,
      EmergencyBedSlotId ? parseInt(EmergencyBedSlotId, 10) : null,
      parseInt(OTId, 10),
      SurgeryId ? parseInt(SurgeryId, 10) : null,
      parseInt(LeadSurgeonId, 10),
      AssistantDoctorId ? parseInt(AssistantDoctorId, 10) : null,
      AnaesthetistId ? parseInt(AnaesthetistId, 10) : null,
      NurseId ? parseInt(NurseId, 10) : null,
      OTAllocationDate,
      Duration || null,
      OTStartTime || null,
      OTEndTime || null,
      OTActualStartTime || null,
      OTActualEndTime || null,
      OperationDescription || null,
      OperationStatus,
      PreOperationNotes || null,
      PostOperationNotes || null,
      OTDocuments || null,
      BillId ? parseInt(BillId, 10) : null,
      createdByValue,
      Status,
    ]);

    // Fetch the created record with joined data
    const { rows: joinedRows } = await db.query(
      `
      SELECT 
        pta.*,
        p."PatientName", p."PatientNo",
        ot."OTNo",
        sp."SurgeryName",
        ls."UserName" AS "LeadSurgeonName",
        ad."UserName" AS "AssistantDoctorName",
        an."UserName" AS "AnaesthetistName",
        n."UserName" AS "NurseName",
        b."BillNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientOTAllocation" pta
      LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
      LEFT JOIN "OT" ot ON pta."OTId" = ot."OTId"
      LEFT JOIN "SurgeryProcedure" sp ON pta."SurgeryId" = sp."SurgeryId"
      LEFT JOIN "Users" ls ON pta."LeadSurgeonId" = ls."UserId"
      LEFT JOIN "Users" ad ON pta."AssistantDoctorId" = ad."UserId"
      LEFT JOIN "Users" an ON pta."AnaesthetistId" = an."UserId"
      LEFT JOIN "Users" n ON pta."NurseId" = n."UserId"
      LEFT JOIN "Bills" b ON pta."BillId" = b."BillId"
      LEFT JOIN "Users" u ON pta."OTAllocationCreatedBy" = u."UserId"
      WHERE pta."PatientOTAllocationId" = $1
      `,
      [rows[0].PatientOTAllocationId]
    );

    res.status(201).json({
      success: true,
      message: 'Patient OT allocation created successfully',
      data: mapPatientOTAllocationRow(joinedRows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure all referenced IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating patient OT allocation',
      error: error.message,
    });
  }
};

exports.updatePatientOTAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const otAllocationId = parseInt(id, 10);
    if (isNaN(otAllocationId)) {
      return res.status(400).json({ success: false, message: 'Invalid PatientOTAllocationId. Must be an integer.' });
    }

    const errors = validatePatientOTAllocationPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      PatientId,
      PatientAppointmentId,
      EmergencyBedSlotId,
      OTId,
      OTSlotId,
      SurgeryId,
      LeadSurgeonId,
      AssistantDoctorId,
      AnaesthetistId,
      NurseId,
      OTAllocationDate,
      Duration,
      OTStartTime,
      OTEndTime,
      OTActualStartTime,
      OTActualEndTime,
      OperationDescription,
      OperationStatus,
      PreOperationNotes,
      PostOperationNotes,
      OTDocuments,
      BillId,
      OTAllocationCreatedBy,
      Status,
    } = req.body;

    // Validate foreign key existence if provided
    if (PatientId !== undefined && PatientId !== null) {
      const patientIdInt = parseInt(PatientId, 10);
      if (isNaN(patientIdInt)) {
        return res.status(400).json({ success: false, message: 'PatientId must be a valid integer' });
      }
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1', [patientIdInt]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
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

    if (OTId !== undefined && OTId !== null) {
      const otExists = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [parseInt(OTId, 10)]);
      if (otExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTId does not exist' });
      }
    }

    if (OTSlotId !== undefined && OTSlotId !== null) {
      const otSlotIdInt = parseInt(OTSlotId, 10);
      if (isNaN(otSlotIdInt)) {
        return res.status(400).json({ success: false, message: 'OTSlotId must be a valid integer' });
      }
      // Validate OTSlot exists
      const otSlotExists = await db.query(
        'SELECT "OTSlotId", "OTId" FROM "OTSlot" WHERE "OTSlotId" = $1',
        [otSlotIdInt]
      );
      if (otSlotExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTSlotId does not exist' });
      }
      // If OTId is also being updated, verify OTSlot belongs to the new OT
      // Otherwise, get current OTId and verify
      if (OTId !== undefined && OTId !== null) {
        if (otSlotExists.rows[0].OTId !== parseInt(OTId, 10)) {
          return res.status(400).json({
            success: false,
            message: 'OTSlotId does not belong to the specified OTId',
          });
        }
      } else {
        // Get current OTId from the record
        const currentRecord = await db.query(
          'SELECT "OTId" FROM "PatientOTAllocation" WHERE "PatientOTAllocationId" = $1',
          [otAllocationId]
        );
        if (currentRecord.rows.length > 0 && otSlotExists.rows[0].OTId !== currentRecord.rows[0].OTId) {
          return res.status(400).json({
            success: false,
            message: 'OTSlotId does not belong to the current OTId',
          });
        }
      }
    }

    if (SurgeryId !== undefined && SurgeryId !== null) {
      const surgeryExists = await db.query('SELECT "SurgeryId" FROM "SurgeryProcedure" WHERE "SurgeryId" = $1', [parseInt(SurgeryId, 10)]);
      if (surgeryExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'SurgeryId does not exist' });
      }
    }

    if (LeadSurgeonId !== undefined && LeadSurgeonId !== null) {
      const leadSurgeonExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(LeadSurgeonId, 10)]);
      if (leadSurgeonExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'LeadSurgeonId does not exist' });
      }
    }

    if (AssistantDoctorId !== undefined && AssistantDoctorId !== null) {
      const assistantDoctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AssistantDoctorId, 10)]);
      if (assistantDoctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AssistantDoctorId does not exist' });
      }
    }

    if (AnaesthetistId !== undefined && AnaesthetistId !== null) {
      const anaesthetistExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AnaesthetistId, 10)]);
      if (anaesthetistExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AnaesthetistId does not exist' });
      }
    }

    if (NurseId !== undefined && NurseId !== null) {
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(NurseId, 10)]);
      if (nurseExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'NurseId does not exist' });
      }
    }

    if (BillId !== undefined && BillId !== null) {
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [parseInt(BillId, 10)]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
    }

    let createdByValue = null;
    if (OTAllocationCreatedBy !== undefined && OTAllocationCreatedBy !== null && OTAllocationCreatedBy !== '') {
      const createdByInt = parseInt(OTAllocationCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'OTAllocationCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTAllocationCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    } else if (OTAllocationCreatedBy === null) {
      createdByValue = null;
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (PatientId !== undefined) {
      updates.push(`"PatientId" = $${paramIndex++}`);
      params.push(PatientId !== null ? parseInt(PatientId, 10) : null); // INTEGER
    }
    if (PatientAppointmentId !== undefined) {
      updates.push(`"PatientAppointmentId" = $${paramIndex++}`);
      params.push(PatientAppointmentId !== null ? parseInt(PatientAppointmentId, 10) : null);
    }
    if (EmergencyBedSlotId !== undefined) {
      updates.push(`"EmergencyBedSlotId" = $${paramIndex++}`);
      params.push(EmergencyBedSlotId !== null ? parseInt(EmergencyBedSlotId, 10) : null);
    }
    if (OTId !== undefined) {
      updates.push(`"OTId" = $${paramIndex++}`);
      params.push(OTId !== null ? parseInt(OTId, 10) : null);
    }
    if (OTSlotId !== undefined) {
      updates.push(`"OTSlotId" = $${paramIndex++}`);
      params.push(OTSlotId !== null ? parseInt(OTSlotId, 10) : null);
    }
    if (SurgeryId !== undefined) {
      updates.push(`"SurgeryId" = $${paramIndex++}`);
      params.push(SurgeryId !== null ? parseInt(SurgeryId, 10) : null);
    }
    if (LeadSurgeonId !== undefined) {
      updates.push(`"LeadSurgeonId" = $${paramIndex++}`);
      params.push(LeadSurgeonId !== null ? parseInt(LeadSurgeonId, 10) : null);
    }
    if (AssistantDoctorId !== undefined) {
      updates.push(`"AssistantDoctorId" = $${paramIndex++}`);
      params.push(AssistantDoctorId !== null ? parseInt(AssistantDoctorId, 10) : null);
    }
    if (AnaesthetistId !== undefined) {
      updates.push(`"AnaesthetistId" = $${paramIndex++}`);
      params.push(AnaesthetistId !== null ? parseInt(AnaesthetistId, 10) : null);
    }
    if (NurseId !== undefined) {
      updates.push(`"NurseId" = $${paramIndex++}`);
      params.push(NurseId !== null ? parseInt(NurseId, 10) : null);
    }
    if (OTAllocationDate !== undefined) {
      updates.push(`"OTAllocationDate" = $${paramIndex++}::date`);
      params.push(OTAllocationDate);
    }
    if (Duration !== undefined) {
      updates.push(`"Duration" = $${paramIndex++}`);
      params.push(Duration);
    }
    if (OTStartTime !== undefined) {
      updates.push(`"OTStartTime" = $${paramIndex++}::time`);
      params.push(OTStartTime);
    }
    if (OTEndTime !== undefined) {
      updates.push(`"OTEndTime" = $${paramIndex++}::time`);
      params.push(OTEndTime);
    }
    if (OTActualStartTime !== undefined) {
      updates.push(`"OTActualStartTime" = $${paramIndex++}::time`);
      params.push(OTActualStartTime);
    }
    if (OTActualEndTime !== undefined) {
      updates.push(`"OTActualEndTime" = $${paramIndex++}::time`);
      params.push(OTActualEndTime);
    }
    if (OperationDescription !== undefined) {
      updates.push(`"OperationDescription" = $${paramIndex++}`);
      params.push(OperationDescription);
    }
    if (OperationStatus !== undefined) {
      updates.push(`"OperationStatus" = $${paramIndex++}`);
      params.push(OperationStatus);
    }
    if (PreOperationNotes !== undefined) {
      updates.push(`"PreOperationNotes" = $${paramIndex++}`);
      params.push(PreOperationNotes);
    }
    if (PostOperationNotes !== undefined) {
      updates.push(`"PostOperationNotes" = $${paramIndex++}`);
      params.push(PostOperationNotes);
    }
    if (OTDocuments !== undefined) {
      updates.push(`"OTDocuments" = $${paramIndex++}`);
      params.push(OTDocuments);
    }
    if (BillId !== undefined) {
      updates.push(`"BillId" = $${paramIndex++}`);
      params.push(BillId !== null ? parseInt(BillId, 10) : null);
    }
    if (OTAllocationCreatedBy !== undefined) {
      updates.push(`"OTAllocationCreatedBy" = $${paramIndex++}`);
      params.push(createdByValue);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(otAllocationId);
    const updateQuery = `
      UPDATE "PatientOTAllocation"
      SET ${updates.join(', ')}
      WHERE "PatientOTAllocationId" = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient OT allocation not found' });
    }

    // Fetch the updated record with joined data
    const { rows: joinedRows } = await db.query(
      `
      SELECT 
        pta.*,
        p."PatientName", p."PatientNo",
        ot."OTNo",
        sp."SurgeryName",
        ls."UserName" AS "LeadSurgeonName",
        ad."UserName" AS "AssistantDoctorName",
        an."UserName" AS "AnaesthetistName",
        n."UserName" AS "NurseName",
        b."BillNo",
        u."UserName" AS "CreatedByName"
      FROM "PatientOTAllocation" pta
      LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
      LEFT JOIN "OT" ot ON pta."OTId" = ot."OTId"
      LEFT JOIN "SurgeryProcedure" sp ON pta."SurgeryId" = sp."SurgeryId"
      LEFT JOIN "Users" ls ON pta."LeadSurgeonId" = ls."UserId"
      LEFT JOIN "Users" ad ON pta."AssistantDoctorId" = ad."UserId"
      LEFT JOIN "Users" an ON pta."AnaesthetistId" = an."UserId"
      LEFT JOIN "Users" n ON pta."NurseId" = n."UserId"
      LEFT JOIN "Bills" b ON pta."BillId" = b."BillId"
      LEFT JOIN "Users" u ON pta."OTAllocationCreatedBy" = u."UserId"
      WHERE pta."PatientOTAllocationId" = $1
      `,
      [otAllocationId]
    );

    res.status(200).json({
      success: true,
      message: 'Patient OT allocation updated successfully',
      data: mapPatientOTAllocationRow(joinedRows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure all referenced IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient OT allocation',
      error: error.message,
    });
  }
};


/**
 * Get count of today's OT scheduled records (Scheduled or In Progress) and In Progress OTs count
 * Returns both counts in a single response
 */
exports.getTodayOTScheduledAndInProgressCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Query to get both counts
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE "OTAllocationDate"::date = $1::date 
          AND ("OperationStatus" = 'Scheduled' OR "OperationStatus" = 'In Progress')) AS scheduled_count,
        COUNT(*) FILTER (WHERE "OperationStatus" = 'In Progress') AS in_progress_count
      FROM "PatientOTAllocation"
    `;

    const { rows } = await db.query(query, [today]);

    const scheduledCount = parseInt(rows[0].scheduled_count, 10) || 0;
    const inProgressCount = parseInt(rows[0].in_progress_count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Today\'s OT scheduled and In Progress counts retrieved successfully',
      date: today,
      counts: {
        todayScheduled: scheduledCount,
        inProgress: inProgressCount
      },
      data: {
        date: today,
        todayScheduledCount: scheduledCount,
        inProgressCount: inProgressCount,
        todayScheduledStatus: ['Scheduled', 'In Progress'],
        inProgressStatus: 'In Progress'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s OT scheduled and In Progress counts',
      error: error.message,
    });
  }
};

/**
 * Get count of OT scheduled records (Scheduled or In Progress) and In Progress OTs count for a specific date
 * Query parameter: ?date=YYYY-MM-DD (required)
 * Returns both counts in a single response
 */
exports.getOTScheduledAndInProgressCountByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required. Please provide date in YYYY-MM-DD format (e.g., ?date=2025-12-03)',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-03)',
      });
    }

    // Query to get both counts for the specified date
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE "OTAllocationDate"::date = $1::date 
          AND ("OperationStatus" = 'Scheduled' OR "OperationStatus" = 'In Progress')) AS scheduled_count,
        COUNT(*) FILTER (WHERE "OTAllocationDate"::date = $1::date 
          AND "OperationStatus" = 'In Progress') AS in_progress_count
      FROM "PatientOTAllocation"
    `;

    const { rows } = await db.query(query, [date]);

    const scheduledCount = parseInt(rows[0].scheduled_count, 10) || 0;
    const inProgressCount = parseInt(rows[0].in_progress_count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'OT scheduled and In Progress counts retrieved successfully',
      date: date,
      counts: {
        scheduled: scheduledCount,
        inProgress: inProgressCount
      },
      data: {
        date: date,
        scheduledCount: scheduledCount,
        inProgressCount: inProgressCount,
        scheduledStatus: ['Scheduled', 'In Progress'],
        inProgressStatus: 'In Progress'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OT scheduled and In Progress counts',
      error: error.message,
    });
  }
};

exports.deletePatientOTAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const otAllocationId = parseInt(id, 10);
    if (isNaN(otAllocationId)) {
      return res.status(400).json({ success: false, message: 'Invalid PatientOTAllocationId. Must be an integer.' });
    }

    const { rows } = await db.query(
      'DELETE FROM "PatientOTAllocation" WHERE "PatientOTAllocationId" = $1 RETURNING *;',
      [otAllocationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient OT allocation not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient OT allocation deleted successfully',
      data: mapPatientOTAllocationRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient OT allocation',
      error: error.message,
    });
  }
};

/**
 * Create OT Allocation for a RoomAdmission (Admitted Patient)
 * This function automatically fetches PatientId from RoomAdmission and creates the OT Allocation
 * It also updates the RoomAdmission to link it with the OT Allocation
 * 
 * Required in body:
 * - RoomAdmissionId (integer) - The RoomAdmissionId for the admitted patient
 * - OTId (integer) - The OT ID
 * - LeadSurgeonId (integer) - The lead surgeon ID
 * - OTAllocationDate (date, YYYY-MM-DD) - The date for OT allocation
 * 
 * Optional fields: All other fields from createPatientOTAllocation
 */
exports.createOTAllocationForRoomAdmission = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'This endpoint has been removed. RoomAdmission functionality is no longer available.',
  });
};

// Old function body removed - RoomAdmission functionality no longer exists
const _old_createOTAllocationForRoomAdmission = async (req, res) => {
  try {
    const { RoomAdmissionId, ...otAllocationData } = req.body;

    // Validate RoomAdmissionId is provided
    if (!RoomAdmissionId) {
      return res.status(400).json({
        success: false,
        message: 'RoomAdmissionId is required',
      });
    }

    const roomAdmissionIdInt = parseInt(RoomAdmissionId, 10);
    if (isNaN(roomAdmissionIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'RoomAdmissionId must be a valid integer',
      });
    }

    // Fetch RoomAdmission details to get PatientId
    const roomAdmissionResult = await db.query(
      'SELECT "PatientId", "Status", "AdmissionStatus" FROM "RoomAdmission" WHERE "RoomAdmissionId" = $1',
      [roomAdmissionIdInt]
    );

    if (roomAdmissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'RoomAdmission not found',
      });
    }

    const roomAdmission = roomAdmissionResult.rows[0];
    // Convert PatientId to INTEGER if it's not already
    let patientId = roomAdmission.PatientId;
    if (typeof patientId === 'string' && !/^\d+$/.test(patientId)) {
      // If it's a UUID string, we need to find the corresponding INTEGER PatientId
      // This assumes PatientRegistration has been migrated to INTEGER
      const patientMapping = await db.query(
        'SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId"::text = $1',
        [patientId]
      );
      if (patientMapping.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Could not find INTEGER PatientId for the UUID from RoomAdmission. Please ensure PatientRegistration.PatientId is INTEGER.',
        });
      }
      patientId = patientMapping.rows[0].PatientId;
    }
    const patientIdInt = parseInt(patientId, 10);
    if (isNaN(patientIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PatientId from RoomAdmission. PatientId must be an integer.',
      });
    }

    // Check if RoomAdmission is active
    if (roomAdmission.Status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'RoomAdmission is not active. Cannot create OT allocation for inactive admission.',
      });
    }

    // Prepare the payload for validation
    const payload = {
      ...otAllocationData,
      PatientId: patientIdInt,
      RoomAdmissionId: roomAdmissionIdInt,
    };

    // Validate the payload (excluding PatientId requirement since we're setting it)
    const errors = validatePatientOTAllocationPayload(payload, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      OTId,
      OTSlotId,
      SurgeryId,
      LeadSurgeonId,
      AssistantDoctorId,
      AnaesthetistId,
      NurseId,
      OTAllocationDate,
      Duration,
      OTStartTime,
      OTEndTime,
      OTActualStartTime,
      OTActualEndTime,
      OperationDescription,
      OperationStatus = 'Scheduled',
      PreOperationNotes,
      PostOperationNotes,
      OTDocuments,
      BillId,
      OTAllocationCreatedBy,
      Status = 'Active',
    } = payload;

    // Validate foreign key existence
    const otExists = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [parseInt(OTId, 10)]);
    if (otExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTId does not exist' });
    }

    if (OTSlotId !== undefined && OTSlotId !== null) {
      const otSlotIdInt = parseInt(OTSlotId, 10);
      if (isNaN(otSlotIdInt)) {
        return res.status(400).json({ success: false, message: 'OTSlotId must be a valid integer' });
      }
      // Validate OTSlot exists and belongs to the specified OT
      const otSlotExists = await db.query(
        'SELECT "OTSlotId", "OTId" FROM "OTSlot" WHERE "OTSlotId" = $1',
        [otSlotIdInt]
      );
      if (otSlotExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTSlotId does not exist' });
      }
      // Verify OTSlot belongs to the specified OT
      if (otSlotExists.rows[0].OTId !== parseInt(OTId, 10)) {
        return res.status(400).json({
          success: false,
          message: 'OTSlotId does not belong to the specified OTId',
        });
      }
    }

    if (SurgeryId !== undefined && SurgeryId !== null) {
      const surgeryExists = await db.query('SELECT "SurgeryId" FROM "SurgeryProcedure" WHERE "SurgeryId" = $1', [parseInt(SurgeryId, 10)]);
      if (surgeryExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'SurgeryId does not exist' });
      }
    }

    const leadSurgeonExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(LeadSurgeonId, 10)]);
    if (leadSurgeonExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'LeadSurgeonId does not exist' });
    }

    if (AssistantDoctorId !== undefined && AssistantDoctorId !== null) {
      const assistantDoctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AssistantDoctorId, 10)]);
      if (assistantDoctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AssistantDoctorId does not exist' });
      }
    }

    if (AnaesthetistId !== undefined && AnaesthetistId !== null) {
      const anaesthetistExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(AnaesthetistId, 10)]);
      if (anaesthetistExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'AnaesthetistId does not exist' });
      }
    }

    if (NurseId !== undefined && NurseId !== null) {
      const nurseExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [parseInt(NurseId, 10)]);
      if (nurseExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'NurseId does not exist' });
      }
    }

    if (BillId !== undefined && BillId !== null) {
      const billExists = await db.query('SELECT "BillId" FROM "Bills" WHERE "BillId" = $1', [parseInt(BillId, 10)]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
    }

    let createdByValue = null;
    if (OTAllocationCreatedBy !== undefined && OTAllocationCreatedBy !== null && OTAllocationCreatedBy !== '') {
      const createdByInt = parseInt(OTAllocationCreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'OTAllocationCreatedBy must be a valid integer.' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTAllocationCreatedBy user does not exist.' });
      }
      createdByValue = createdByInt;
    }

    // Start transaction to create OT Allocation and update RoomAdmission
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert OT Allocation
      const insertQuery = `
        INSERT INTO "PatientOTAllocation"
          ("PatientId", "RoomAdmissionId", "PatientAppointmentId", "OTId", "OTSlotId", "SurgeryId",
           "LeadSurgeonId", "AssistantDoctorId", "AnaesthetistId", "NurseId",
           "OTAllocationDate", "Duration", "OTStartTime", "OTEndTime",
           "OTActualStartTime", "OTActualEndTime", "OperationDescription",
           "OperationStatus", "PreOperationNotes", "PostOperationNotes", "OTDocuments",
           "BillId", "OTAllocationCreatedBy", "Status")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *;
      `;

      const insertParams = [
        patientIdInt, // INTEGER PatientId
        null, // PatientAppointmentId - can be added if needed
        parseInt(OTId, 10),
        OTSlotId ? parseInt(OTSlotId, 10) : null,
        SurgeryId ? parseInt(SurgeryId, 10) : null,
        parseInt(LeadSurgeonId, 10),
        AssistantDoctorId ? parseInt(AssistantDoctorId, 10) : null,
        AnaesthetistId ? parseInt(AnaesthetistId, 10) : null,
        NurseId ? parseInt(NurseId, 10) : null,
        OTAllocationDate,
        Duration || null,
        OTStartTime || null,
        OTEndTime || null,
        OTActualStartTime || null,
        OTActualEndTime || null,
        OperationDescription || null,
        OperationStatus,
        PreOperationNotes || null,
        PostOperationNotes || null,
        OTDocuments || null,
        BillId ? parseInt(BillId, 10) : null,
        createdByValue,
        Status,
      ];

      const insertResult = await client.query(insertQuery, insertParams);
      const otAllocation = insertResult.rows[0];
      const otAllocationId = otAllocation.PatientOTAllocationId;

      // RoomAdmission update removed - functionality no longer exists

      await client.query('COMMIT');

      // Fetch the created OT Allocation with joined data
      const { rows } = await db.query(
        `
        SELECT 
          pta.*,
          p."PatientName", p."PatientNo",
          ot."OTNo",
          os."OTSlotNo",
          sp."SurgeryName",
          ls."UserName" AS "LeadSurgeonName",
          ad."UserName" AS "AssistantDoctorName",
          an."UserName" AS "AnaesthetistName",
          n."UserName" AS "NurseName",
          b."BillNo",
          u."UserName" AS "CreatedByName"
        FROM "PatientOTAllocation" pta
        LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
        LEFT JOIN "OT" ot ON pta."OTId" = ot."OTId"
        LEFT JOIN "OTSlot" os ON pta."OTSlotId" = os."OTSlotId"
        LEFT JOIN "SurgeryProcedure" sp ON pta."SurgeryId" = sp."SurgeryId"
        LEFT JOIN "Users" ls ON pta."LeadSurgeonId" = ls."UserId"
        LEFT JOIN "Users" ad ON pta."AssistantDoctorId" = ad."UserId"
        LEFT JOIN "Users" an ON pta."AnaesthetistId" = an."UserId"
        LEFT JOIN "Users" n ON pta."NurseId" = n."UserId"
        LEFT JOIN "Bills" b ON pta."BillId" = b."BillId"
        LEFT JOIN "Users" u ON pta."OTAllocationCreatedBy" = u."UserId"
        WHERE pta."PatientOTAllocationId" = $1
        `,
        [otAllocationId]
      );

      res.status(201).json({
        success: true,
        message: 'OT Allocation created successfully for RoomAdmission and RoomAdmission updated',
        data: mapPatientOTAllocationRow(rows[0]),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure all referenced IDs exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating OT allocation for RoomAdmission',
      error: error.message,
    });
  }
};

