const db = require('../db');

const allowedStatus = ['Active', 'InActive'];

const mapOTRow = (row) => ({
  OTId: row.OTId || row.otid,
  OTNo: row.OTNo || row.otno,
  OTType: row.OTType || row.ottype,
  OTName: row.OTName || row.otname,
  OTDescription: row.OTDescription || row.otdescription,
  OTStartTimeofDay: row.OTStartTimeofDay || row.otstarttimeofday || null,
  OTEndTimeofDay: row.OTEndTimeofDay || row.otendoftimeofday || null,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
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
    // Validate that id is an integer
    const otId = parseInt(id, 10);
    if (isNaN(otId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "OT" WHERE "OTId" = $1',
      [otId]
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

exports.getOTByNo = async (req, res) => {
  try {
    const { otNo } = req.params;
    
    if (!otNo || !otNo.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTNo is required' 
      });
    }

    const { rows } = await db.query(
      'SELECT * FROM "OT" WHERE "OTNo" = $1',
      [otNo.trim()]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Operation theater not found with the given OT number' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: mapOTRow(rows[0]) 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching operation theater by OT number',
      error: error.message,
    });
  }
};

exports.getOTByType = async (req, res) => {
  try {
    const { otType } = req.params;
    
    if (!otType || !otType.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTType is required' 
      });
    }

    const { rows } = await db.query(
      'SELECT * FROM "OT" WHERE "OTType" = $1 ORDER BY "CreatedAt" DESC',
      [otType.trim()]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No operation theaters found with the given type' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      count: rows.length,
      otType: otType.trim(),
      data: rows.map(mapOTRow)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching operation theaters by type',
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
      OTStartTimeofDay,
      OTEndTimeofDay,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // Validate CreatedBy if provided - must be a valid integer
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'CreatedBy must be a valid integer. Leave it empty or null if not needed.' 
        });
      }
      createdByValue = createdByInt;
    }

    // Proactive validation: Check if OTNo already exists
    const existingOT = await db.query(
      'SELECT "OTId" FROM "OT" WHERE "OTNo" = $1',
      [OTNo.trim()]
    );
    if (existingOT.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'OT number already exists',
      });
    }

    // OTId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "OT"
        ("OTNo", "OTType", "OTName", "OTDescription", "OTStartTimeofDay", "OTEndTimeofDay", "Status", "CreatedBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      OTNo.trim(),
      OTType ? OTType.trim() : null,
      OTName ? OTName.trim() : null,
      OTDescription ? OTDescription.trim() : null,
      OTStartTimeofDay || null,
      OTEndTimeofDay || null,
      Status,
      createdByValue,
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
    // Validate that id is an integer
    const otId = parseInt(id, 10);
    if (isNaN(otId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTId. Must be an integer.' 
      });
    }
    const {
      OTNo,
      OTType,
      OTName,
      OTDescription,
      OTStartTimeofDay,
      OTEndTimeofDay,
      Status,
      CreatedBy,
    } = req.body;

    // Validate CreatedBy if provided - must be a valid integer
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'CreatedBy must be a valid integer. Leave it empty or null if not needed.' 
        });
      }
      createdByValue = createdByInt;
    }

    // Proactive validation: If OTNo is being updated, check if it already exists (excluding current record)
    if (OTNo) {
      const existingOT = await db.query(
        'SELECT "OTId" FROM "OT" WHERE "OTNo" = $1 AND "OTId" != $2',
        [OTNo.trim(), otId]
      );
      if (existingOT.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'OT number already exists',
        });
      }
    }

    const updateQuery = `
      UPDATE "OT"
      SET
        "OTNo" = COALESCE($1, "OTNo"),
        "OTType" = COALESCE($2, "OTType"),
        "OTName" = COALESCE($3, "OTName"),
        "OTDescription" = COALESCE($4, "OTDescription"),
        "OTStartTimeofDay" = COALESCE($5, "OTStartTimeofDay"),
        "OTEndTimeofDay" = COALESCE($6, "OTEndTimeofDay"),
        "Status" = COALESCE($7, "Status"),
        "CreatedBy" = COALESCE($8, "CreatedBy")
      WHERE "OTId" = $9
      RETURNING *;
    `;

    const updateParams = [
      OTNo ? OTNo.trim() : null,
      OTType ? OTType.trim() : null,
      OTName ? OTName.trim() : null,
      OTDescription ? OTDescription.trim() : null,
      OTStartTimeofDay || null,
      OTEndTimeofDay || null,
      Status || null,
      createdByValue || null,
      otId,
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
    // Validate that id is an integer
    const otId = parseInt(id, 10);
    if (isNaN(otId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "OT" WHERE "OTId" = $1 RETURNING *;',
      [otId]
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

