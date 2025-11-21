const db = require('../db');
const { randomUUID } = require('crypto');

const allowedRoomCategories = ['Ac', 'NonAc'];
const allowedRoomTypes = ['Special', 'Special Shared', 'Regular'];
const allowedStatus = ['Active', 'Inactive'];

const mapRoomRow = (row) => ({
  RoomId: row.RoomId || row.roomid,
  RoomNo: row.RoomNo || row.roomno,
  RoomCategory: row.RoomCategory || row.roomcategory,
  RoomType: row.RoomType || row.roomtype,
  NumberOfBeds: row.NumberOfBeds || row.numberofbeds,
  ChargesPerDay: row.ChargesPerDay ? parseFloat(row.ChargesPerDay) : row.chargesperday ? parseFloat(row.chargesperday) : 0,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
});

exports.getAllRooms = async (req, res) => {
  try {
    const { status, roomCategory, roomType } = req.query;
    let query = 'SELECT * FROM "AdmissionRoom"';
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

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "RoomNo" ASC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRoomRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admission rooms',
      error: error.message,
    });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "AdmissionRoom" WHERE "RoomId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data: mapRoomRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room',
      error: error.message,
    });
  }
};

const validateRoomPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && body.RoomNo === undefined) {
    errors.push('RoomNo is required');
  }
  if (body.RoomNo !== undefined && (isNaN(body.RoomNo) || body.RoomNo <= 0)) {
    errors.push('RoomNo must be a positive integer');
  }
  
  if (requireAll && !body.RoomCategory) {
    errors.push('RoomCategory is required');
  }
  if (body.RoomCategory && !allowedRoomCategories.includes(body.RoomCategory)) {
    errors.push('RoomCategory must be Ac or NonAc');
  }
  
  if (requireAll && !body.RoomType) {
    errors.push('RoomType is required');
  }
  if (body.RoomType && !allowedRoomTypes.includes(body.RoomType)) {
    errors.push('RoomType must be Special, Special Shared, or Regular');
  }
  
  if (requireAll && body.NumberOfBeds === undefined) {
    errors.push('NumberOfBeds is required');
  }
  if (body.NumberOfBeds !== undefined && (isNaN(body.NumberOfBeds) || body.NumberOfBeds <= 0)) {
    errors.push('NumberOfBeds must be a positive integer');
  }
  
  if (requireAll && body.ChargesPerDay === undefined) {
    errors.push('ChargesPerDay is required');
  }
  if (body.ChargesPerDay !== undefined && (isNaN(body.ChargesPerDay) || body.ChargesPerDay < 0)) {
    errors.push('ChargesPerDay must be a non-negative number');
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }
  
  return errors;
};

exports.createRoom = async (req, res) => {
  try {
    const errors = validateRoomPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      RoomNo,
      RoomCategory,
      RoomType,
      NumberOfBeds,
      ChargesPerDay,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for RoomId
    const roomId = randomUUID();
    
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Failed to generate RoomId');
    }

    const insertQuery = `
      INSERT INTO "AdmissionRoom"
        ("RoomId", "RoomNo", "RoomCategory", "RoomType", "NumberOfBeds", "ChargesPerDay", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      roomId,
      parseInt(RoomNo, 10),
      RoomCategory,
      RoomType,
      parseInt(NumberOfBeds, 10),
      parseFloat(ChargesPerDay),
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: mapRoomRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Room number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message,
    });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const errors = validateRoomPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const {
      RoomNo,
      RoomCategory,
      RoomType,
      NumberOfBeds,
      ChargesPerDay,
      Status,
    } = req.body;

    const updateQuery = `
      UPDATE "AdmissionRoom"
      SET
        "RoomNo" = COALESCE($1, "RoomNo"),
        "RoomCategory" = COALESCE($2, "RoomCategory"),
        "RoomType" = COALESCE($3, "RoomType"),
        "NumberOfBeds" = COALESCE($4, "NumberOfBeds"),
        "ChargesPerDay" = COALESCE($5, "ChargesPerDay"),
        "Status" = COALESCE($6, "Status")
      WHERE "RoomId" = $7::uuid
      RETURNING *;
    `;

    const updateParams = [
      RoomNo !== undefined ? parseInt(RoomNo, 10) : null,
      RoomCategory || null,
      RoomType || null,
      NumberOfBeds !== undefined ? parseInt(NumberOfBeds, 10) : null,
      ChargesPerDay !== undefined ? parseFloat(ChargesPerDay) : null,
      Status || null,
      id,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: mapRoomRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Room number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating room',
      error: error.message,
    });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "AdmissionRoom" WHERE "RoomId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: mapRoomRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting room',
      error: error.message,
    });
  }
};

