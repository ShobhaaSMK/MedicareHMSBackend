const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'Inactive'];

const mapEmergencyRow = (row) => ({
  EmergencyBedId: row.EmergencyBedId || row.emergencybedid,
  EmergencyBedNo: row.EmergencyBedNo || row.emergencybedno,
  EmergencyRoomNameNo: row.EmergencyRoomNameNo || row.emergencyroomnameno,
  EmergencyRoomDescription: row.EmergencyRoomDescription || row.emergencyroomdescription,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
});

exports.getAllEmergencyBeds = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM "Emergency"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapEmergencyRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency beds',
      error: error.message,
    });
  }
};

exports.getEmergencyBedById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "Emergency" WHERE "EmergencyBedId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }
    res.status(200).json({ success: true, data: mapEmergencyRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency bed',
      error: error.message,
    });
  }
};

const validateEmergencyPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && (!body.EmergencyBedNo || !body.EmergencyBedNo.trim())) {
    errors.push('EmergencyBedNo is required');
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }
  
  return errors;
};

exports.createEmergencyBed = async (req, res) => {
  try {
    const errors = validateEmergencyPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      EmergencyBedNo,
      EmergencyRoomNameNo,
      EmergencyRoomDescription,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for EmergencyBedId
    const emergencyBedId = randomUUID();
    
    if (!emergencyBedId || typeof emergencyBedId !== 'string') {
      throw new Error('Failed to generate EmergencyBedId');
    }

    const insertQuery = `
      INSERT INTO "Emergency"
        ("EmergencyBedId", "EmergencyBedNo", "EmergencyRoomNameNo", "EmergencyRoomDescription", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      emergencyBedId,
      EmergencyBedNo.trim(),
      EmergencyRoomNameNo ? EmergencyRoomNameNo.trim() : null,
      EmergencyRoomDescription ? EmergencyRoomDescription.trim() : null,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Emergency bed created successfully',
      data: mapEmergencyRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Emergency bed number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating emergency bed',
      error: error.message,
    });
  }
};

exports.updateEmergencyBed = async (req, res) => {
  try {
    const errors = validateEmergencyPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const {
      EmergencyBedNo,
      EmergencyRoomNameNo,
      EmergencyRoomDescription,
      Status,
    } = req.body;

    const updateQuery = `
      UPDATE "Emergency"
      SET
        "EmergencyBedNo" = COALESCE($1, "EmergencyBedNo"),
        "EmergencyRoomNameNo" = COALESCE($2, "EmergencyRoomNameNo"),
        "EmergencyRoomDescription" = COALESCE($3, "EmergencyRoomDescription"),
        "Status" = COALESCE($4, "Status")
      WHERE "EmergencyBedId" = $5::uuid
      RETURNING *;
    `;

    const updateParams = [
      EmergencyBedNo ? EmergencyBedNo.trim() : null,
      EmergencyRoomNameNo ? EmergencyRoomNameNo.trim() : null,
      EmergencyRoomDescription ? EmergencyRoomDescription.trim() : null,
      Status || null,
      id,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency bed updated successfully',
      data: mapEmergencyRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Emergency bed number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating emergency bed',
      error: error.message,
    });
  }
};

exports.deleteEmergencyBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "Emergency" WHERE "EmergencyBedId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency bed deleted successfully',
      data: mapEmergencyRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting emergency bed',
      error: error.message,
    });
  }
};

