const db = require('../db');

const allowedStatus = ['Active', 'InActive'];

// Helper function to get today's date
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return {
    dbFormat: `${year}-${month}-${day}`, // YYYY-MM-DD for database
    displayFormat: `${day}-${month}-${year}` // DD-MM-YYYY for display
  };
};

// Helper function to convert DD-MM-YYYY to YYYY-MM-DD for database
const convertToDBDate = (dateStr) => {
  if (!dateStr) return null;
  // Check if it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Check if it's in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  return null;
};

// Helper function to convert YYYY-MM-DD to DD-MM-YYYY for API response
const convertToDisplayDate = (dateStr) => {
  if (!dateStr) return null;
  // Check if it's in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }
  // Already in DD-MM-YYYY format
  return dateStr;
};

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
  // Availability field (only when checking PatientOTAllocation)
  IsAvailable: row.IsAvailable !== undefined ? row.IsAvailable : undefined,
  // Patient information (only when slot is occupied)
  OccupiedByPatientId: row.OccupiedByPatientId || row.occupiedbypatientid || null,
  OccupiedByPatientNo: row.OccupiedByPatientNo || row.occupiedbypatientno || null,
  // OT Allocation Date (from PatientOTAllocationSlots)
  OTAllocationDate: row.OTAllocationDate || row.otallocationdate || null,
});

/**
 * Generate OTSlotNo as integer for the given OT
 * Returns the next available slot number (1, 2, 3, etc.) for the specified OT
 */
const generateOTSlotNo = async (otId) => {
  // Verify OT exists
  const otResult = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [otId]);
  if (otResult.rows.length === 0) {
    throw new Error('OT not found');
  }

  // Find the highest slot number for this OT
  const query = `
    SELECT COALESCE(MAX("OTSlotNo"), 0) + 1 AS next_seq
    FROM "OTSlot"
    WHERE "OTId" = $1
  `;
  const { rows } = await db.query(query, [otId]);
  const nextSeq = parseInt(rows[0].next_seq, 10) || 1;

  return nextSeq;
};

exports.getAllOTSlots = async (req, res) => {
  try {
    const { status, otId, date } = req.query;
    
    // Default to today's date if not provided
    let checkDate = date;
    let displayDate = date;
    if (!checkDate) {
      const todayDate = getTodayDate();
      checkDate = todayDate.dbFormat; // YYYY-MM-DD for database
      displayDate = todayDate.displayFormat; // DD-MM-YYYY for display
    } else {
      // Validate and convert date format
      const dateRegex = /^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})$/;
      if (!dateRegex.test(checkDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use DD-MM-YYYY format (e.g., 15-12-2024)',
        });
      }
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for database queries
      const dbDate = convertToDBDate(checkDate);
      if (!dbDate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use DD-MM-YYYY format (e.g., 15-12-2024)',
        });
      }
      checkDate = dbDate; // Use YYYY-MM-DD for database
      displayDate = convertToDisplayDate(dbDate); // Use DD-MM-YYYY for display
    }
    
    // If otId is provided, include availability check from PatientOTAllocation
    const includeAvailability = otId !== undefined;
    
    let query;
    const params = [];
    const conditions = [];

    if (includeAvailability) {
      // Add date parameter first
      params.push(checkDate);
      const dateParamIndex = params.length;
      
      // Efficient query using LEFT JOINs to check all PatientOTAllocation records
      // Check availability based on OTAllocationDate from PatientOTAllocationSlots
      // A slot is occupied if OTAllocationDate matches the query date OR OTAllocationDate is NULL (treats NULL as matching query date/today)
      query = `
        SELECT DISTINCT ON (os."OTSlotId")
          os.*,
          ot."OTNo",
          ot."OTName",
          ot."OTType",
          CASE 
            WHEN pta."PatientOTAllocationId" IS NOT NULL 
              AND (pas."OTAllocationDate"::date = $${dateParamIndex}::date 
                   OR pas."OTAllocationDate" IS NULL) THEN false
            ELSE true
          END AS "IsAvailable",
          p."PatientId" AS "OccupiedByPatientId",
          p."PatientNo" AS "OccupiedByPatientNo",
          COALESCE(pas."OTAllocationDate"::date, $${dateParamIndex}::date) AS "OTAllocationDate"
        FROM "OTSlot" os
        LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
        LEFT JOIN "PatientOTAllocationSlots" pas ON os."OTSlotId" = pas."OTSlotId"
          AND (pas."OTAllocationDate"::date = $${dateParamIndex}::date OR pas."OTAllocationDate" IS NULL)
        LEFT JOIN "PatientOTAllocation" pta ON pas."PatientOTAllocationId" = pta."PatientOTAllocationId"
          AND pta."Status" = 'Active'
          AND pta."OperationStatus" NOT IN ('Completed', 'Cancelled')
        LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
      `;
    } else {
      query = `
        SELECT 
          os.*,
          ot."OTNo",
          ot."OTName",
          ot."OTType"
        FROM "OTSlot" os
        LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
      `;
    }

    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Active or InActive.',
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
    query += ' ORDER BY os."OTSlotId" ASC, os."SlotStartTime" ASC';

    const { rows } = await db.query(query, params);
    
    // Process rows to get the first occupied patient if multiple allocations exist
    const processedRows = includeAvailability ? rows.reduce((acc, row) => {
      const slotId = row.OTSlotId || row.otslotid;
      if (!acc[slotId]) {
        acc[slotId] = {
          ...row,
          IsAvailable: row.IsAvailable !== false, // If any allocation exists, it's false
          OccupiedByPatientId: row.OccupiedByPatientId || null,
          OccupiedByPatientNo: row.OccupiedByPatientNo || null,
        };
      } else {
        // If slot is already marked as unavailable, keep it that way
        if (!acc[slotId].IsAvailable) {
          return acc;
        }
        // Update if we found an occupied allocation
        if (row.OccupiedByPatientId) {
          acc[slotId].IsAvailable = false;
          acc[slotId].OccupiedByPatientId = row.OccupiedByPatientId;
          acc[slotId].OccupiedByPatientNo = row.OccupiedByPatientNo;
        }
      }
      return acc;
    }, {}) : rows;

    const finalRows = includeAvailability ? Object.values(processedRows) : processedRows;
    
    // Convert OTAllocationDate in response to DD-MM-YYYY format
    const formattedRows = finalRows.map(row => {
      const mapped = mapOTSlotRow(row);
      if (mapped.OTAllocationDate) {
        mapped.OTAllocationDate = convertToDisplayDate(mapped.OTAllocationDate);
      }
      return mapped;
    });
    
    res.status(200).json({
      success: true,
      count: formattedRows.length,
      date: displayDate, // Include the date being checked in DD-MM-YYYY format
      data: formattedRows,
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
    const { date } = req.query;
    const otIdInt = parseInt(otId, 10);
    if (isNaN(otIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTId. Must be an integer.',
      });
    }

    // Default to today's date if not provided
    let checkDate = date;
    let displayDate = date;
    if (!checkDate) {
      const todayDate = getTodayDate();
      checkDate = todayDate.dbFormat; // YYYY-MM-DD for database
      displayDate = todayDate.displayFormat; // DD-MM-YYYY for display
    } else {
      // Validate and convert date format
      const dateRegex = /^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})$/;
      if (!dateRegex.test(checkDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use DD-MM-YYYY format (e.g., 15-12-2024)',
        });
      }
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for database queries
      const dbDate = convertToDBDate(checkDate);
      if (!dbDate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use DD-MM-YYYY format (e.g., 15-12-2024)',
        });
      }
      checkDate = dbDate; // Use YYYY-MM-DD for database
      displayDate = convertToDisplayDate(dbDate); // Use DD-MM-YYYY for display
    }

    // Verify OT exists
    const otExists = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [otIdInt]);
    if (otExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'OT not found' });
    }

    // Efficient query using LEFT JOINs to check all PatientOTAllocation records
    // Check availability based on OTAllocationDate from PatientOTAllocationSlots
    // A slot is occupied if OTAllocationDate matches the query date OR OTAllocationDate is NULL (treats NULL as matching query date/today)
    const { rows } = await db.query(
      `
      SELECT DISTINCT ON (os."OTSlotId")
        os.*,
        ot."OTNo",
        ot."OTName",
        ot."OTType",
        CASE 
          WHEN pta."PatientOTAllocationId" IS NOT NULL 
            AND (pas."OTAllocationDate"::date = $2::date 
                 OR pas."OTAllocationDate" IS NULL) THEN false
          ELSE true
        END AS "IsAvailable",
        p."PatientId" AS "OccupiedByPatientId",
        p."PatientNo" AS "OccupiedByPatientNo",
        COALESCE(pas."OTAllocationDate"::date, $2::date) AS "OTAllocationDate"
      FROM "OTSlot" os
      LEFT JOIN "OT" ot ON os."OTId" = ot."OTId"
      LEFT JOIN "PatientOTAllocationSlots" pas ON os."OTSlotId" = pas."OTSlotId"
        AND (pas."OTAllocationDate"::date = $2::date OR pas."OTAllocationDate" IS NULL)
      LEFT JOIN "PatientOTAllocation" pta ON pas."PatientOTAllocationId" = pta."PatientOTAllocationId"
        AND pta."Status" = 'Active'
        AND pta."OperationStatus" NOT IN ('Completed', 'Cancelled')
      LEFT JOIN "PatientRegistration" p ON pta."PatientId" = p."PatientId"
      WHERE os."OTId" = $1
      ORDER BY os."OTSlotId" ASC, os."SlotStartTime" ASC, pta."PatientOTAllocationId" ASC
      `,
      [otIdInt, checkDate]
    );
    
    // Process rows to get the first occupied patient if multiple allocations exist
    const processedRows = rows.reduce((acc, row) => {
      const slotId = row.OTSlotId || row.otslotid;
      if (!acc[slotId]) {
        acc[slotId] = {
          ...row,
          IsAvailable: row.IsAvailable !== false,
          OccupiedByPatientId: row.OccupiedByPatientId || null,
          OccupiedByPatientNo: row.OccupiedByPatientNo || null,
        };
      } else {
        // If slot is already marked as unavailable, keep it that way
        if (!acc[slotId].IsAvailable) {
          return acc;
        }
        // Update if we found an occupied allocation
        if (row.OccupiedByPatientId) {
          acc[slotId].IsAvailable = false;
          acc[slotId].OccupiedByPatientId = row.OccupiedByPatientId;
          acc[slotId].OccupiedByPatientNo = row.OccupiedByPatientNo;
        }
      }
      return acc;
    }, {});
    
    const finalRows = Object.values(processedRows);
    
    // Convert OTAllocationDate in response to DD-MM-YYYY format
    const formattedRows = finalRows.map(row => {
      const mapped = mapOTSlotRow(row);
      if (mapped.OTAllocationDate) {
        mapped.OTAllocationDate = convertToDisplayDate(mapped.OTAllocationDate);
      }
      return mapped;
    });

    res.status(200).json({
      success: true,
      count: formattedRows.length,
      otId: otIdInt,
      date: displayDate, // Include the date being checked in DD-MM-YYYY format
      data: formattedRows,
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
    errors.push('Status must be Active or InActive');
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

    // Generate OTSlotNo (integer)
    let otSlotNo;
    try {
      otSlotNo = await generateOTSlotNo(otIdInt);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
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
          message: 'Status must be Active or InActive',
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

