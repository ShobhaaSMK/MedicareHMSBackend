const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'InActive'];

const mapOTRow = (row) => ({
  OTId: row.OTId || row.otid,
  OTNo: row.OTNo || row.otno,
  OTType: row.OTType || row.ottype,
  OTName: row.OTName || row.otname,
  OTDescription: row.OTDescription || row.otdescription,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
});

exports.getAllOTs = async (req, res) => {
  try {
    const { status, otType } = req.query;
    let query = 'SELECT * FROM "OT"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (otType) {
      conditions.push(`"OTType" = $${params.length + 1}`);
      params.push(otType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapOTRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching operation theaters',
      error: error.message,
    });
  }
};

exports.getOTById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "OT" WHERE "OTId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Operation theater not found' });
    }
    res.status(200).json({ success: true, data: mapOTRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching operation theater',
      error: error.message,
    });
  }
};

const validateOTPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && (!body.OTNo || !body.OTNo.trim())) {
    errors.push('OTNo is required');
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or InActive');
  }
  
  return errors;
};

exports.createOT = async (req, res) => {
  try {
    const errors = validateOTPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      OTNo,
      OTType,
      OTName,
      OTDescription,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for OTId
    const otId = randomUUID();
    
    if (!otId || typeof otId !== 'string') {
      throw new Error('Failed to generate OTId');
    }

    const insertQuery = `
      INSERT INTO "OT"
        ("OTId", "OTNo", "OTType", "OTName", "OTDescription", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      otId,
      OTNo.trim(),
      OTType ? OTType.trim() : null,
      OTName ? OTName.trim() : null,
      OTDescription ? OTDescription.trim() : null,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Operation theater created successfully',
      data: mapOTRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'OT number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating operation theater',
      error: error.message,
    });
  }
};

exports.updateOT = async (req, res) => {
  try {
    const errors = validateOTPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const {
      OTNo,
      OTType,
      OTName,
      OTDescription,
      Status,
    } = req.body;

    const updateQuery = `
      UPDATE "OT"
      SET
        "OTNo" = COALESCE($1, "OTNo"),
        "OTType" = COALESCE($2, "OTType"),
        "OTName" = COALESCE($3, "OTName"),
        "OTDescription" = COALESCE($4, "OTDescription"),
        "Status" = COALESCE($5, "Status")
      WHERE "OTId" = $6::uuid
      RETURNING *;
    `;

    const updateParams = [
      OTNo ? OTNo.trim() : null,
      OTType ? OTType.trim() : null,
      OTName ? OTName.trim() : null,
      OTDescription ? OTDescription.trim() : null,
      Status || null,
      id,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Operation theater not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Operation theater updated successfully',
      data: mapOTRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'OT number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating operation theater',
      error: error.message,
    });
  }
};

exports.deleteOT = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "OT" WHERE "OTId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Operation theater not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Operation theater deleted successfully',
      data: mapOTRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting operation theater',
      error: error.message,
    });
  }
};

