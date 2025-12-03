const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];

const mapOTSlotRow = (row) => ({
  OTSlotId: row.OTSlotId || row.otslotid,
  OTId: row.OTId || row.otid,
  OTSlotNo: row.OTSlotNo || row.otslotno,
  SlotStartTime: row.SlotStartTime || row.slotstarttime,
  SlotEndTime: row.SlotEndTime || row.slotendtime,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
  // Joined fields
  OTNo: row.OTNo || row.otno || null,
  OTName: row.OTName || row.otname || null,
  OTType: row.OTType || row.ottype || null,
});

/**
 * Generate OTSlotNo in format OTNo_01, OTNo_02, etc.
 * Example: If OTNo is "OT001", slots will be "OT001_01", "OT001_02", etc.
 */
const generateOTSlotNo = async (otId) => {
  // Get OTNo from OT table
  const otResult = await db.query('SELECT "OTNo" FROM "OT" WHERE "OTId" = $1', [otId]);
  if (otResult.rows.length === 0) {
    throw new Error('OT not found');
  }
  const otNo = otResult.rows[0].OTNo;

  // Find the highest slot number for this OT
  // Pattern: OTNo_XX where XX is a number
  const pattern = `${otNo}_%`;
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("OTSlotNo" FROM LENGTH($1) + 2) AS INT)), 0) + 1 AS next_seq
    FROM "OTSlot"
    WHERE "OTSlotNo" LIKE $2
      AND SUBSTRING("OTSlotNo" FROM LENGTH($1) + 2) ~ '^[0-9]+$'
  `;
  const { rows } = await db.query(query, [otNo, pattern]);
  const nextSeq = parseInt(rows[0].next_seq, 10) || 1;

  // Format as OTNo_XX (2 digits with leading zeros)
  const otSlotNo = `${otNo}_${String(nextSeq).padStart(2, '0')}`;
  return otSlotNo;
};

exports.getAllOTSlots = async (req, res) => {
  try {
    const { status, otId } = req.query;
    let query = `
      SELECT 
        os.*,
        ot."OTNo",
        ot."OTName",
        ot."OTType"
      FROM "OTSlot" os
      LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
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
      conditions.push(`os."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (otId) {
      const otIdInt = parseInt(otId, 10);
      if (!isNaN(otIdInt)) {
        conditions.push(`os."OTId" = $${params.length + 1}`);
        params.push(otIdInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY os."OTId" ASC, os."SlotStartTime" ASC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapOTSlotRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OT slots',
      error: error.message,
    });
  }
};

exports.getOTSlotById = async (req, res) => {
  try {
    const { id } = req.params;
    const otSlotId = parseInt(id, 10);
    if (isNaN(otSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTSlotId. Must be an integer.',
      });
    }

    const { rows } = await db.query(
      `
      SELECT 
        os.*,
        ot."OTNo",
        ot."OTName",
        ot."OTType"
      FROM "OTSlot" os
      LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
      WHERE os."OTSlotId" = $1
      `,
      [otSlotId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'OT slot not found' });
    }

    res.status(200).json({ success: true, data: mapOTSlotRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OT slot',
      error: error.message,
    });
  }
};

exports.getOTSlotsByOTId = async (req, res) => {
  try {
    const { otId } = req.params;
    const otIdInt = parseInt(otId, 10);
    if (isNaN(otIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTId. Must be an integer.',
      });
    }

    // Verify OT exists
    const otExists = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [otIdInt]);
    if (otExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'OT not found' });
    }

    const { rows } = await db.query(
      `
      SELECT 
        os.*,
        ot."OTNo",
        ot."OTName",
        ot."OTType"
      FROM "OTSlot" os
      LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
      WHERE os."OTId" = $1
      ORDER BY os."SlotStartTime" ASC
      `,
      [otIdInt]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapOTSlotRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OT slots by OT ID',
      error: error.message,
    });
  }
};

const validateOTSlotPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && body.OTId === undefined) {
    errors.push('OTId is required');
  }
  if (body.OTId !== undefined && body.OTId !== null) {
    const otIdInt = parseInt(body.OTId, 10);
    if (isNaN(otIdInt)) {
      errors.push('OTId must be a valid integer');
    }
  }

  if (requireAll && !body.SlotStartTime) {
    errors.push('SlotStartTime is required');
  }
  if (body.SlotStartTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.SlotStartTime)) {
    errors.push('SlotStartTime must be in HH:MM or HH:MM:SS format');
  }

  if (requireAll && !body.SlotEndTime) {
    errors.push('SlotEndTime is required');
  }
  if (body.SlotEndTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(body.SlotEndTime)) {
    errors.push('SlotEndTime must be in HH:MM or HH:MM:SS format');
  }

  // Validate that SlotEndTime is after SlotStartTime
  if (body.SlotStartTime && body.SlotEndTime) {
    const startTime = new Date(`2000-01-01T${body.SlotStartTime}`);
    const endTime = new Date(`2000-01-01T${body.SlotEndTime}`);
    if (endTime <= startTime) {
      errors.push('SlotEndTime must be after SlotStartTime');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  return errors;
};

exports.createOTSlot = async (req, res) => {
  try {
    const errors = validateOTSlotPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      OTId,
      SlotStartTime,
      SlotEndTime,
      Status = 'Active',
    } = req.body;

    const otIdInt = parseInt(OTId, 10);

    // Validate OT exists
    const otExists = await db.query('SELECT "OTId", "OTNo" FROM "OT" WHERE "OTId" = $1', [otIdInt]);
    if (otExists.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTId does not exist' });
    }

    // Generate OTSlotNo
    let otSlotNo;
    try {
      otSlotNo = await generateOTSlotNo(otIdInt);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Check if OTSlotNo already exists (shouldn't happen, but just in case)
    const existingSlot = await db.query(
      'SELECT "OTSlotId" FROM "OTSlot" WHERE "OTSlotNo" = $1',
      [otSlotNo]
    );
    if (existingSlot.rows.length > 0) {
      // Retry with next number
      otSlotNo = await generateOTSlotNo(otIdInt);
    }

    // Check for overlapping time slots for the same OT
    const overlapCheck = await db.query(
      `
      SELECT "OTSlotId", "OTSlotNo", "SlotStartTime", "SlotEndTime"
      FROM "OTSlot"
      WHERE "OTId" = $1
        AND "Status" = 'Active'
        AND (
          ($2::time >= "SlotStartTime" AND $2::time < "SlotEndTime")
          OR ($3::time > "SlotStartTime" AND $3::time <= "SlotEndTime")
          OR ($2::time <= "SlotStartTime" AND $3::time >= "SlotEndTime")
        )
      `,
      [otIdInt, SlotStartTime, SlotEndTime]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Time slot overlaps with existing slot ${overlapCheck.rows[0].OTSlotNo} (${overlapCheck.rows[0].SlotStartTime} - ${overlapCheck.rows[0].SlotEndTime})`,
      });
    }

    const insertQuery = `
      INSERT INTO "OTSlot"
        ("OTId", "OTSlotNo", "SlotStartTime", "SlotEndTime", "Status")
      VALUES ($1, $2, $3::time, $4::time, $5)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      otIdInt,
      otSlotNo,
      SlotStartTime,
      SlotEndTime,
      Status,
    ]);

    // Fetch with joined OT data
    const { rows: joinedRows } = await db.query(
      `
      SELECT 
        os.*,
        ot."OTNo",
        ot."OTName",
        ot."OTType"
      FROM "OTSlot" os
      LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
      WHERE os."OTSlotId" = $1
      `,
      [rows[0].OTSlotId]
    );

    res.status(201).json({
      success: true,
      message: 'OT slot created successfully',
      data: mapOTSlotRow(joinedRows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'OT slot number already exists. Please try again.',
        error: error.message,
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTId. Please verify the OT ID exists.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating OT slot',
      error: error.message,
    });
  }
};

exports.updateOTSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const otSlotId = parseInt(id, 10);
    if (isNaN(otSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTSlotId. Must be an integer.',
      });
    }

    const errors = validateOTSlotPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      OTId,
      SlotStartTime,
      SlotEndTime,
      Status,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (OTId !== undefined) {
      const otIdInt = parseInt(OTId, 10);
      if (isNaN(otIdInt)) {
        return res.status(400).json({ success: false, message: 'OTId must be a valid integer' });
      }
      // Validate OT exists
      const otExists = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [otIdInt]);
      if (otExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'OTId does not exist' });
      }
      updates.push(`"OTId" = $${paramIndex++}`);
      params.push(otIdInt);
    }

    if (SlotStartTime !== undefined) {
      updates.push(`"SlotStartTime" = $${paramIndex++}::time`);
      params.push(SlotStartTime);
    }

    if (SlotEndTime !== undefined) {
      updates.push(`"SlotEndTime" = $${paramIndex++}::time`);
      params.push(SlotEndTime);
    }

    if (Status !== undefined) {
      if (!allowedStatus.includes(Status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be Active or Inactive',
        });
      }
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Check for overlapping time slots if time is being updated
    if (SlotStartTime !== undefined || SlotEndTime !== undefined) {
      // Get current slot data
      const currentSlot = await db.query(
        'SELECT "OTId", "SlotStartTime", "SlotEndTime" FROM "OTSlot" WHERE "OTSlotId" = $1',
        [otSlotId]
      );

      if (currentSlot.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'OT slot not found' });
      }

      const finalOTId = OTId !== undefined ? parseInt(OTId, 10) : currentSlot.rows[0].OTId;
      const finalStartTime = SlotStartTime || currentSlot.rows[0].SlotStartTime;
      const finalEndTime = SlotEndTime || currentSlot.rows[0].SlotEndTime;

      const overlapCheck = await db.query(
        `
        SELECT "OTSlotId", "OTSlotNo", "SlotStartTime", "SlotEndTime"
        FROM "OTSlot"
        WHERE "OTId" = $1
          AND "OTSlotId" != $2
          AND "Status" = 'Active'
          AND (
            ($3::time >= "SlotStartTime" AND $3::time < "SlotEndTime")
            OR ($4::time > "SlotStartTime" AND $4::time <= "SlotEndTime")
            OR ($3::time <= "SlotStartTime" AND $4::time >= "SlotEndTime")
          )
        `,
        [finalOTId, otSlotId, finalStartTime, finalEndTime]
      );

      if (overlapCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Time slot overlaps with existing slot ${overlapCheck.rows[0].OTSlotNo} (${overlapCheck.rows[0].SlotStartTime} - ${overlapCheck.rows[0].SlotEndTime})`,
        });
      }
    }

    params.push(otSlotId);
    const updateQuery = `
      UPDATE "OTSlot"
      SET ${updates.join(', ')}
      WHERE "OTSlotId" = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'OT slot not found' });
    }

    // Fetch with joined OT data
    const { rows: joinedRows } = await db.query(
      `
      SELECT 
        os.*,
        ot."OTNo",
        ot."OTName",
        ot."OTType"
      FROM "OTSlot" os
      LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
      WHERE os."OTSlotId" = $1
      `,
      [otSlotId]
    );

    res.status(200).json({
      success: true,
      message: 'OT slot updated successfully',
      data: mapOTSlotRow(joinedRows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTId. Please verify the OT ID exists.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating OT slot',
      error: error.message,
    });
  }
};

exports.deleteOTSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const otSlotId = parseInt(id, 10);
    if (isNaN(otSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTSlotId. Must be an integer.',
      });
    }

    const { rows } = await db.query(
      'DELETE FROM "OTSlot" WHERE "OTSlotId" = $1 RETURNING *;',
      [otSlotId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'OT slot not found' });
    }

    res.status(200).json({
      success: true,
      message: 'OT slot deleted successfully',
      data: mapOTSlotRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete OT slot. It is referenced by other records.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting OT slot',
      error: error.message,
    });
  }
};

