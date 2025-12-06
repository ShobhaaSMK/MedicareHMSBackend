const db = require('../db');

const allowedRoomCategories = ['AC', 'Non AC'];
const allowedRoomTypes = ['Special', 'Special Shared', 'Regular'];
const allowedStatus = ['Active', 'Inactive'];

const mapRoomBedsRow = (row) => ({
  RoomBedsId: row.RoomBedsId || row.roombedsid,
  BedNo: row.BedNo || row.bedno,
  RoomNo: row.RoomNo || row.roomno,
  RoomCategory: row.RoomCategory || row.roomcategory,
  RoomType: row.RoomType || row.roomtype,
  ChargesPerDay: parseFloat(row.ChargesPerDay || row.chargesperday || 0),
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
  CreatedAt: row.CreatedAt || row.createdat,
});

/**
 * Generate BedNo in format B_001, B_002, etc.
 */
const generateBedNo = async () => {
  try {
    const result = await db.query(
      'SELECT MAX(CAST(SUBSTRING("BedNo" FROM 3) AS INTEGER)) AS max_num FROM "RoomBeds" WHERE "BedNo" ~ \'^B_\\d+$\''
    );
    
    const maxNum = result.rows[0]?.max_num || 0;
    const nextNum = maxNum + 1;
    return `B_${String(nextNum).padStart(3, '0')}`;
  } catch (error) {
    // If query fails, start from 1
    return 'B_001';
  }
};

exports.getAllRoomBeds = async (req, res) => {
  try {
    const { status, roomCategory, roomType, roomNo } = req.query;
    let query = 'SELECT * FROM "RoomBeds"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (roomCategory) {
      conditions.push(`"RoomCategory" = $${params.length + 1}`);
      params.push(roomCategory);
    }
    if (roomType) {
      conditions.push(`"RoomType" = $${params.length + 1}`);
      params.push(roomType);
    }
    if (roomNo) {
      conditions.push(`"RoomNo" = $${params.length + 1}`);
      params.push(roomNo);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRoomBedsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room beds',
      error: error.message,
    });
  }
};

exports.getRoomBedsById = async (req, res) => {
  try {
    const { id } = req.params;
    const roomBedsId = parseInt(id, 10);
    if (isNaN(roomBedsId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid RoomBedsId. Must be a valid integer.' 
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "RoomBeds" WHERE "RoomBedsId" = $1',
      [roomBedsId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room bed not found' });
    }
    res.status(200).json({ success: true, data: mapRoomBedsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room bed',
      error: error.message,
    });
  }
};

exports.getRoomBedsByBedNo = async (req, res) => {
  try {
    const { bedNo } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "RoomBeds" WHERE "BedNo" = $1',
      [bedNo]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room bed not found' });
    }
    res.status(200).json({ success: true, data: mapRoomBedsRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room bed by bed number',
      error: error.message,
    });
  }
};

exports.getRoomBedsByCategory = async (req, res) => {
  try {
    let { category } = req.params;
    category = decodeURIComponent(category);
    
    let normalizedCategory = category.trim();
    if (normalizedCategory.toLowerCase() === 'nonac' || normalizedCategory.toLowerCase() === 'non-ac' || normalizedCategory.toLowerCase() === 'non ac') {
      normalizedCategory = 'Non AC';
    } else if (normalizedCategory.toUpperCase() === 'AC') {
      normalizedCategory = 'AC';
    }
    
    if (!allowedRoomCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomCategory. Must be "AC" or "Non AC".',
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "RoomBeds" WHERE "RoomCategory" = $1 ORDER BY "BedNo" ASC',
      [normalizedCategory]
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRoomBedsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room beds by category',
      error: error.message,
    });
  }
};

/**
 * Get total count of Active beds from RoomBeds
 */
exports.getActiveBedsCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "RoomBeds"
      WHERE "Status" = 'Active'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Active beds count retrieved successfully',
      count: count,
      data: {
        count: count,
        status: 'Active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active beds count',
      error: error.message,
    });
  }
};

/**
 * Get IPD Room counts distribution by RoomType for pie chart report
 * Returns counts for 'Special', 'Special Shared', and 'Regular' room types
 * Only counts Active beds
 */
exports.getIPDRoomCountsByType = async (req, res) => {
  try {
    const query = `
      SELECT 
        "RoomType",
        COUNT(*) AS count
      FROM "RoomBeds"
      WHERE "Status" = 'Active'
      GROUP BY "RoomType"
      ORDER BY 
        CASE "RoomType"
          WHEN 'Special' THEN 1
          WHEN 'Special Shared' THEN 2
          WHEN 'Regular' THEN 3
          ELSE 4
        END
    `;

    const { rows } = await db.query(query);

    // Initialize counts for all room types
    const roomTypeCounts = {
      'Special': 0,
      'Special Shared': 0,
      'Regular': 0
    };

    // Populate counts from query results
    rows.forEach(row => {
      const roomType = row.RoomType || row.roomtype;
      const count = parseInt(row.count, 10) || 0;
      if (roomTypeCounts.hasOwnProperty(roomType)) {
        roomTypeCounts[roomType] = count;
      }
    });

    // Calculate total
    const totalCount = Object.values(roomTypeCounts).reduce((sum, count) => sum + count, 0);

    // Format data for pie chart
    const chartData = Object.entries(roomTypeCounts).map(([roomType, count]) => ({
      label: roomType,
      value: count,
      percentage: totalCount > 0 ? ((count / totalCount) * 100).toFixed(2) : '0.00'
    }));

    res.status(200).json({
      success: true,
      message: 'IPD Room counts by type retrieved successfully',
      totalCount: totalCount,
      data: roomTypeCounts,
      chartData: {
        labels: chartData.map(item => item.label),
        values: chartData.map(item => item.value),
        percentages: chartData.map(item => item.percentage),
        datasets: chartData
      },
      breakdown: chartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching IPD room counts by type',
      error: error.message,
    });
  }
};

exports.getRoomBedsByRoomType = async (req, res) => {
  try {
    const { roomType } = req.params;
    if (!allowedRoomTypes.includes(roomType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid RoomType. Must be "Special", "Special Shared", or "Regular".',
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "RoomBeds" WHERE "RoomType" = $1 ORDER BY "BedNo" ASC',
      [roomType]
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRoomBedsRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room beds by room type',
      error: error.message,
    });
  }
};

const validateRoomBedsPayload = (body, requireAll = true) => {
  const errors = [];

  if (body.BedNo !== undefined && body.BedNo !== null && typeof body.BedNo !== 'string') {
    errors.push('BedNo must be a string');
  }

  if (body.RoomNo !== undefined && body.RoomNo !== null && typeof body.RoomNo !== 'string') {
    errors.push('RoomNo must be a string');
  }

  if (requireAll && !body.RoomCategory) {
    errors.push('RoomCategory is required');
  }
  if (body.RoomCategory && !allowedRoomCategories.includes(body.RoomCategory)) {
    errors.push('RoomCategory must be "AC" or "Non AC"');
  }

  if (requireAll && !body.RoomType) {
    errors.push('RoomType is required');
  }
  if (body.RoomType && !allowedRoomTypes.includes(body.RoomType)) {
    errors.push('RoomType must be "Special", "Special Shared", or "Regular"');
  }

  if (requireAll && body.ChargesPerDay === undefined) {
    errors.push('ChargesPerDay is required');
  }
  if (body.ChargesPerDay !== undefined && body.ChargesPerDay !== null) {
    const chargesPerDayFloat = parseFloat(body.ChargesPerDay);
    if (isNaN(chargesPerDayFloat) || chargesPerDayFloat < 0) {
      errors.push('ChargesPerDay must be a non-negative number');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be "Active" or "Inactive"');
  }

  if (body.CreatedBy !== undefined && body.CreatedBy !== null) {
    const createdByInt = parseInt(body.CreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('CreatedBy must be a valid integer');
    }
  }

  return errors;
};

exports.createRoomBeds = async (req, res) => {
  try {
    const errors = validateRoomBedsPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BedNo,
      RoomNo,
      RoomCategory,
      RoomType,
      ChargesPerDay,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // Generate BedNo if not provided
    let bedNoValue = BedNo;
    if (!bedNoValue) {
      bedNoValue = await generateBedNo();
    }

    // Check if BedNo already exists
    const existingBed = await db.query(
      'SELECT "RoomBedsId" FROM "RoomBeds" WHERE "BedNo" = $1',
      [bedNoValue]
    );
    if (existingBed.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'BedNo already exists. Bed numbers must be unique.',
      });
    }

    // Validate CreatedBy if provided
    if (CreatedBy !== undefined && CreatedBy !== null) {
      const createdByInt = parseInt(CreatedBy, 10);
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'CreatedBy UserId does not exist',
        });
      }
    }

    const insertQuery = `
      INSERT INTO "RoomBeds"
        ("BedNo", "RoomNo", "RoomCategory", "RoomType", "ChargesPerDay", "Status", "CreatedBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      bedNoValue,
      RoomNo || null,
      RoomCategory,
      RoomType,
      parseFloat(ChargesPerDay),
      Status,
      CreatedBy ? parseInt(CreatedBy, 10) : null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Room bed created successfully',
      data: mapRoomBedsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'BedNo already exists. Bed numbers must be unique.',
        error: error.message,
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid CreatedBy. Please ensure the user exists.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating room bed',
      error: error.message,
    });
  }
};

exports.updateRoomBeds = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateRoomBedsPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BedNo,
      RoomNo,
      RoomCategory,
      RoomType,
      ChargesPerDay,
      Status,
      CreatedBy,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (BedNo !== undefined) {
      // Check if the new BedNo already exists (excluding current bed)
      const roomBedsId = parseInt(id, 10);
      if (isNaN(roomBedsId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid RoomBedsId. Must be a valid integer.' 
        });
      }
      const existingBed = await db.query(
        'SELECT "RoomBedsId" FROM "RoomBeds" WHERE "BedNo" = $1 AND "RoomBedsId" != $2',
        [BedNo, roomBedsId]
      );
      if (existingBed.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'BedNo already exists. Bed numbers must be unique.',
        });
      }
      updates.push(`"BedNo" = $${paramIndex++}`);
      params.push(BedNo);
    }
    if (RoomNo !== undefined) {
      updates.push(`"RoomNo" = $${paramIndex++}`);
      params.push(RoomNo || null);
    }
    if (RoomCategory !== undefined) {
      updates.push(`"RoomCategory" = $${paramIndex++}`);
      params.push(RoomCategory);
    }
    if (RoomType !== undefined) {
      updates.push(`"RoomType" = $${paramIndex++}`);
      params.push(RoomType);
    }
    if (ChargesPerDay !== undefined) {
      updates.push(`"ChargesPerDay" = $${paramIndex++}`);
      params.push(parseFloat(ChargesPerDay));
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }
    if (CreatedBy !== undefined) {
      if (CreatedBy !== null) {
        const createdByInt = parseInt(CreatedBy, 10);
        const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
        if (userExists.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'CreatedBy UserId does not exist',
          });
        }
      }
      updates.push(`"CreatedBy" = $${paramIndex++}`);
      params.push(CreatedBy !== null ? parseInt(CreatedBy, 10) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const roomBedsId = parseInt(id, 10);
    if (isNaN(roomBedsId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid RoomBedsId. Must be a valid integer.' 
      });
    }
    params.push(roomBedsId);
    const updateQuery = `
      UPDATE "RoomBeds"
      SET ${updates.join(', ')}
      WHERE "RoomBedsId" = $${paramIndex}
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room bed updated successfully',
      data: mapRoomBedsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'BedNo already exists. Bed numbers must be unique.',
        error: error.message,
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid CreatedBy. Please ensure the user exists.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating room bed',
      error: error.message,
    });
  }
};

exports.deleteRoomBeds = async (req, res) => {
  try {
    const { id } = req.params;
    const roomBedsId = parseInt(id, 10);
    if (isNaN(roomBedsId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid RoomBedsId. Must be a valid integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "RoomBeds" WHERE "RoomBedsId" = $1 RETURNING *',
      [roomBedsId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room bed deleted successfully',
      data: mapRoomBedsRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room bed. It is referenced by other records.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting room bed',
      error: error.message,
    });
  }
};

