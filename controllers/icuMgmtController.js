const db = require('../db');
const { randomUUID } = require('crypto');

const allowedVentilatorStatus = ['Yes', 'No'];
const allowedStatus = ['Active', 'Inactive'];

const mapICURow = (row) => ({
  ICUId: row.ICUId || row.icuid,
  ICUBedNo: row.ICUBedNo || row.icubedno,
  ICUType: row.ICUType || row.icutype,
  ICURoomNameNo: row.ICURoomNameNo || row.icuroomnameno,
  ICUDescription: row.ICUDescription || row.icudescription,
  IsVentilatorAttached: row.IsVentilatorAttached || row.isventilatorattached,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
});

exports.getAllICUs = async (req, res) => {
  try {
    const { status, icuType, isVentilatorAttached } = req.query;
    let query = 'SELECT * FROM "ICU"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (icuType) {
      conditions.push(`"ICUType" = $${params.length + 1}`);
      params.push(icuType);
    }
    if (isVentilatorAttached) {
      conditions.push(`"IsVentilatorAttached" = $${params.length + 1}`);
      params.push(isVentilatorAttached);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapICURow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU beds',
      error: error.message,
    });
  }
};

exports.getICUById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "ICU" WHERE "ICUId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU bed not found' });
    }
    res.status(200).json({ success: true, data: mapICURow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU bed',
      error: error.message,
    });
  }
};

const validateICUPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && (!body.ICUBedNo || !body.ICUBedNo.trim())) {
    errors.push('ICUBedNo is required');
  }
  
  if (requireAll && !body.IsVentilatorAttached) {
    errors.push('IsVentilatorAttached is required');
  }
  if (body.IsVentilatorAttached && !allowedVentilatorStatus.includes(body.IsVentilatorAttached)) {
    errors.push('IsVentilatorAttached must be Yes or No');
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }
  
  return errors;
};

exports.createICU = async (req, res) => {
  try {
    const errors = validateICUPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      ICUBedNo,
      ICUType,
      ICURoomNameNo,
      ICUDescription,
      IsVentilatorAttached,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for ICUId
    const icuId = randomUUID();
    
    if (!icuId || typeof icuId !== 'string') {
      throw new Error('Failed to generate ICUId');
    }

    const insertQuery = `
      INSERT INTO "ICU"
        ("ICUId", "ICUBedNo", "ICUType", "ICURoomNameNo", "ICUDescription", "IsVentilatorAttached", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      icuId,
      ICUBedNo.trim(),
      ICUType ? ICUType.trim() : null,
      ICURoomNameNo ? ICURoomNameNo.trim() : null,
      ICUDescription ? ICUDescription.trim() : null,
      IsVentilatorAttached,
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'ICU bed created successfully',
      data: mapICURow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'ICU bed number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating ICU bed',
      error: error.message,
    });
  }
};

exports.updateICU = async (req, res) => {
  try {
    const errors = validateICUPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const {
      ICUBedNo,
      ICUType,
      ICURoomNameNo,
      ICUDescription,
      IsVentilatorAttached,
      Status,
    } = req.body;

    const updateQuery = `
      UPDATE "ICU"
      SET
        "ICUBedNo" = COALESCE($1, "ICUBedNo"),
        "ICUType" = COALESCE($2, "ICUType"),
        "ICURoomNameNo" = COALESCE($3, "ICURoomNameNo"),
        "ICUDescription" = COALESCE($4, "ICUDescription"),
        "IsVentilatorAttached" = COALESCE($5, "IsVentilatorAttached"),
        "Status" = COALESCE($6, "Status")
      WHERE "ICUId" = $7::uuid
      RETURNING *;
    `;

    const updateParams = [
      ICUBedNo ? ICUBedNo.trim() : null,
      ICUType ? ICUType.trim() : null,
      ICURoomNameNo ? ICURoomNameNo.trim() : null,
      ICUDescription ? ICUDescription.trim() : null,
      IsVentilatorAttached || null,
      Status || null,
      id,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU bed updated successfully',
      data: mapICURow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'ICU bed number already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating ICU bed',
      error: error.message,
    });
  }
};

exports.deleteICU = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "ICU" WHERE "ICUId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ICU bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'ICU bed deleted successfully',
      data: mapICURow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ICU bed',
      error: error.message,
    });
  }
};

