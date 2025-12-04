const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];
const allowedTimeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/;

const mapEmergencyBedSlotRow = (row) => ({
  EmergencyBedSlotId: row.EmergencyBedSlotId || row.emergencybedslotid,
  EmergencyBedId: row.EmergencyBedId || row.emergencybedid,
  EBedSlotNo: row.EBedSlotNo || row.ebedslotno,
  ESlotStartTime: row.ESlotStartTime || row.eslotstarttime,
  ESlotEndTime: row.ESlotEndTime || row.eslotendtime,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
  // Joined fields
  EmergencyBedNo: row.EmergencyBedNo || row.emergencybedno || null,
  EmergencyRoomDescription: row.EmergencyRoomDescription || row.emergencyroomdescription || null,
});

/**
 * Generate EBedSlotNo in format EB_SL_01, EB_SL_02, etc.
 * Example: EB_SL_01, EB_SL_02, EB_SL_03, ..., EB_SL_10, EB_SL_11, etc.
 */
const generateEBedSlotNo = async () => {
  const prefix = 'EB_SL_';
  const pattern = 'EB_SL_%';

  // Find the highest sequence number
  // Extract number after "EB_SL_"
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("EBedSlotNo" FROM 7) AS INT)), 0) + 1 AS next_seq
    FROM "EmergencyBedSlot"
    WHERE "EBedSlotNo" LIKE $1
      AND SUBSTRING("EBedSlotNo" FROM 7) ~ '^[0-9]+$'
  `;

  const { rows } = await db.query(query, [pattern]);
  const nextSeq = parseInt(rows[0].next_seq, 10) || 1;

  // Format as EB_SL_XX (2 digits with leading zeros)
  const eBedSlotNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;
  return eBedSlotNo;
};

exports.getAllEmergencyBedSlots = async (req, res) => {
  try {
    const { status, emergencyBedId } = req.query;
    let query = `
      SELECT 
        ebs.*,
        e."EmergencyBedNo",
        e."EmergencyRoomDescription"
      FROM "EmergencyBedSlot" ebs
      LEFT JOIN "EmergencyBed" e ON ebs."EmergencyBedId" = e."EmergencyBedId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Active or Inactive.',
        });
      }
      conditions.push(`ebs."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (emergencyBedId) {
      const emergencyBedIdInt = parseInt(emergencyBedId, 10);
      if (!isNaN(emergencyBedIdInt)) {
        conditions.push(`ebs."EmergencyBedId" = $${params.length + 1}`);
        params.push(emergencyBedIdInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY ebs."EmergencyBedId" ASC, ebs."ESlotStartTime" ASC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapEmergencyBedSlotRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency bed slots',
      error: error.message,
    });
  }
};

exports.getEmergencyBedSlotById = async (req, res) => {
  try {
    const { id } = req.params;
    const emergencyBedSlotId = parseInt(id, 10);
    if (isNaN(emergencyBedSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyBedSlotId. Must be an integer.',
      });
    }

    const query = `
      SELECT 
        ebs.*,
        e."EmergencyBedNo",
        e."EmergencyRoomDescription"
      FROM "EmergencyBedSlot" ebs
      LEFT JOIN "EmergencyBed" e ON ebs."EmergencyBedId" = e."EmergencyBedId"
      WHERE ebs."EmergencyBedSlotId" = $1
    `;

    const { rows } = await db.query(query, [emergencyBedSlotId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed slot not found' });
    }
    res.status(200).json({ success: true, data: mapEmergencyBedSlotRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency bed slot',
      error: error.message,
    });
  }
};

exports.getEmergencyBedSlotsByEmergencyBedId = async (req, res) => {
  try {
    const { emergencyBedId } = req.params;
    const emergencyBedIdInt = parseInt(emergencyBedId, 10);
    if (isNaN(emergencyBedIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyBedId. Must be an integer.',
      });
    }

    // Verify Emergency Bed exists
    const emergencyBedExists = await db.query('SELECT "EmergencyBedId" FROM "EmergencyBed" WHERE "EmergencyBedId" = $1', [emergencyBedIdInt]);
    if (emergencyBedExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }

    const query = `
      SELECT 
        ebs.*,
        e."EmergencyBedNo",
        e."EmergencyRoomDescription"
      FROM "EmergencyBedSlot" ebs
      LEFT JOIN "EmergencyBed" e ON ebs."EmergencyBedId" = e."EmergencyBedId"
      WHERE ebs."EmergencyBedId" = $1
      ORDER BY ebs."ESlotStartTime" ASC
    `;

    const { rows } = await db.query(query, [emergencyBedIdInt]);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapEmergencyBedSlotRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency bed slots',
      error: error.message,
    });
  }
};

const validateEmergencyBedSlotPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && body.EmergencyBedId === undefined) {
    errors.push('EmergencyBedId is required');
  }
  if (body.EmergencyBedId !== undefined && body.EmergencyBedId !== null) {
    const emergencyBedIdInt = parseInt(body.EmergencyBedId, 10);
    if (isNaN(emergencyBedIdInt)) {
      errors.push('EmergencyBedId must be a valid integer');
    }
  }

  if (requireAll && body.ESlotStartTime === undefined) {
    errors.push('ESlotStartTime is required');
  }
  if (body.ESlotStartTime !== undefined && body.ESlotStartTime !== null) {
    if (!allowedTimeRegex.test(body.ESlotStartTime)) {
      errors.push('ESlotStartTime must be in HH:MM or HH:MM:SS format');
    }
  }

  if (requireAll && body.ESlotEndTime === undefined) {
    errors.push('ESlotEndTime is required');
  }
  if (body.ESlotEndTime !== undefined && body.ESlotEndTime !== null) {
    if (!allowedTimeRegex.test(body.ESlotEndTime)) {
      errors.push('ESlotEndTime must be in HH:MM or HH:MM:SS format');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  return errors;
};

const checkDuplicateTiming = async (emergencyBedId, startTime, endTime, excludeSlotId = null) => {
  // Check if there's an exact duplicate timing (same start and end time) for the same Emergency Bed
  let query = `
    SELECT "EmergencyBedSlotId", "EBedSlotNo", "ESlotStartTime", "ESlotEndTime"
    FROM "EmergencyBedSlot"
    WHERE "EmergencyBedId" = $1
      AND "ESlotStartTime" = $2::TIME
      AND "ESlotEndTime" = $3::TIME
  `;
  const params = [emergencyBedId, startTime, endTime];

  if (excludeSlotId) {
    query += ' AND "EmergencyBedSlotId" != $4';
    params.push(excludeSlotId);
  }

  const { rows } = await db.query(query, params);
  return rows.length > 0 ? rows[0] : null;
};

const checkSlotOverlap = async (emergencyBedId, startTime, endTime, excludeSlotId = null) => {
  // Check if there's an overlapping slot for the same Emergency Bed
  let query = `
    SELECT "EmergencyBedSlotId", "EBedSlotNo", "ESlotStartTime", "ESlotEndTime"
    FROM "EmergencyBedSlot"
    WHERE "EmergencyBedId" = $1
      AND "Status" = 'Active'
      AND (
        ($2::TIME, $3::TIME) OVERLAPS ("ESlotStartTime", "ESlotEndTime")
      )
  `;
  const params = [emergencyBedId, startTime, endTime];

  if (excludeSlotId) {
    query = query.replace('WHERE', 'WHERE "EmergencyBedSlotId" != $4 AND');
    params.push(excludeSlotId);
  }

  const { rows } = await db.query(query, params);
  return rows.length > 0 ? rows[0] : null;
};

exports.createEmergencyBedSlot = async (req, res) => {
  try {
    const errors = validateEmergencyBedSlotPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      EmergencyBedId,
      ESlotStartTime,
      ESlotEndTime,
      Status = 'Active',
    } = req.body;

    const emergencyBedIdInt = parseInt(EmergencyBedId, 10);

    // Validate Emergency Bed exists
    const emergencyBedExists = await db.query('SELECT "EmergencyBedId" FROM "EmergencyBed" WHERE "EmergencyBedId" = $1', [emergencyBedIdInt]);
    if (emergencyBedExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'EmergencyBedId does not exist' });
    }

    // Validate time format
    const startTime = ESlotStartTime.length === 5 ? `${ESlotStartTime}:00` : ESlotStartTime;
    const endTime = ESlotEndTime.length === 5 ? `${ESlotEndTime}:00` : ESlotEndTime;

    // Validate end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'ESlotEndTime must be after ESlotStartTime',
      });
    }

    // Check for duplicate/exact repeat timings first
    const duplicate = await checkDuplicateTiming(emergencyBedIdInt, startTime, endTime);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A slot with the exact same timing already exists: ${duplicate.EBedSlotNo} (${duplicate.ESlotStartTime} - ${duplicate.ESlotEndTime})`,
      });
    }

    // Check for overlapping slots
    const overlap = await checkSlotOverlap(emergencyBedIdInt, startTime, endTime);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `Time slot overlaps with existing slot ${overlap.EBedSlotNo} (${overlap.ESlotStartTime} - ${overlap.ESlotEndTime})`,
      });
    }

    // Generate EBedSlotNo automatically
    const eBedSlotNo = await generateEBedSlotNo();

    const insertQuery = `
      INSERT INTO "EmergencyBedSlot"
        ("EmergencyBedId", "EBedSlotNo", "ESlotStartTime", "ESlotEndTime", "Status")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      emergencyBedIdInt,
      eBedSlotNo,
      startTime,
      endTime,
      Status,
    ]);

    // Fetch with joined data
    const selectQuery = `
      SELECT 
        ebs.*,
        e."EmergencyBedNo",
        e."EmergencyRoomDescription"
      FROM "EmergencyBedSlot" ebs
      LEFT JOIN "EmergencyBed" e ON ebs."EmergencyBedId" = e."EmergencyBedId"
      WHERE ebs."EmergencyBedSlotId" = $1
    `;
    const { rows: fullRows } = await db.query(selectQuery, [rows[0].EmergencyBedSlotId]);

    res.status(201).json({
      success: true,
      message: 'Emergency bed slot created successfully',
      data: mapEmergencyBedSlotRow(fullRows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Emergency bed slot number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating emergency bed slot',
      error: error.message,
    });
  }
};

exports.updateEmergencyBedSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const emergencyBedSlotId = parseInt(id, 10);
    if (isNaN(emergencyBedSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyBedSlotId. Must be an integer.',
      });
    }

    const errors = validateEmergencyBedSlotPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      EmergencyBedId,
      ESlotStartTime,
      ESlotEndTime,
      Status,
    } = req.body;

    // Check if slot exists
    const existingSlot = await db.query(
      'SELECT * FROM "EmergencyBedSlot" WHERE "EmergencyBedSlotId" = $1',
      [emergencyBedSlotId]
    );
    if (existingSlot.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed slot not found' });
    }

    const currentEmergencyBedId = EmergencyBedId ? parseInt(EmergencyBedId, 10) : existingSlot.rows[0].EmergencyBedId;
    const currentStartTime = ESlotStartTime || existingSlot.rows[0].ESlotStartTime;
    const currentEndTime = ESlotEndTime || existingSlot.rows[0].ESlotEndTime;

    // Validate Emergency Bed exists if being updated
    if (EmergencyBedId) {
      const emergencyBedExists = await db.query('SELECT "EmergencyBedId" FROM "EmergencyBed" WHERE "EmergencyBedId" = $1', [currentEmergencyBedId]);
      if (emergencyBedExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'EmergencyBedId does not exist' });
      }
    }

    // Validate time format and order
    const startTime = currentStartTime.length === 5 ? `${currentStartTime}:00` : currentStartTime;
    const endTime = currentEndTime.length === 5 ? `${currentEndTime}:00` : currentEndTime;

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'ESlotEndTime must be after ESlotStartTime',
      });
    }

    // Check for duplicate/exact repeat timings (excluding current slot)
    const duplicate = await checkDuplicateTiming(currentEmergencyBedId, startTime, endTime, emergencyBedSlotId);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `A slot with the exact same timing already exists: ${duplicate.EBedSlotNo} (${duplicate.ESlotStartTime} - ${duplicate.ESlotEndTime})`,
      });
    }

    // Check for overlapping slots (excluding current slot)
    const overlap = await checkSlotOverlap(currentEmergencyBedId, startTime, endTime, emergencyBedSlotId);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `Time slot overlaps with existing slot ${overlap.EBedSlotNo} (${overlap.ESlotStartTime} - ${overlap.ESlotEndTime})`,
      });
    }

    const updateQuery = `
      UPDATE "EmergencyBedSlot"
      SET
        "EmergencyBedId" = COALESCE($1, "EmergencyBedId"),
        "ESlotStartTime" = COALESCE($2, "ESlotStartTime"),
        "ESlotEndTime" = COALESCE($3, "ESlotEndTime"),
        "Status" = COALESCE($4, "Status")
      WHERE "EmergencyBedSlotId" = $5
      RETURNING *;
    `;

    const updateParams = [
      EmergencyBedId ? parseInt(EmergencyBedId, 10) : null,
      startTime,
      endTime,
      Status || null,
      emergencyBedSlotId,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    // Fetch with joined data
    const selectQuery = `
      SELECT 
        ebs.*,
        e."EmergencyBedNo",
        e."EmergencyRoomDescription"
      FROM "EmergencyBedSlot" ebs
      LEFT JOIN "EmergencyBed" e ON ebs."EmergencyBedId" = e."EmergencyBedId"
      WHERE ebs."EmergencyBedSlotId" = $1
    `;
    const { rows: fullRows } = await db.query(selectQuery, [rows[0].EmergencyBedSlotId]);

    res.status(200).json({
      success: true,
      message: 'Emergency bed slot updated successfully',
      data: mapEmergencyBedSlotRow(fullRows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating emergency bed slot',
      error: error.message,
    });
  }
};

exports.deleteEmergencyBedSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const emergencyBedSlotId = parseInt(id, 10);
    if (isNaN(emergencyBedSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid EmergencyBedSlotId. Must be an integer.',
      });
    }

    const { rows } = await db.query(
      'DELETE FROM "EmergencyBedSlot" WHERE "EmergencyBedSlotId" = $1 RETURNING *;',
      [emergencyBedSlotId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed slot not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency bed slot deleted successfully',
      data: mapEmergencyBedSlotRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting emergency bed slot',
      error: error.message,
    });
  }
};

