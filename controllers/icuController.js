const db = require('../db');

const allowedVentilatorStatus = ['Yes', 'No'];
const allowedStatus = ['Active', 'Inactive'];

const mapICURow = (row) => ({
  ICUId: row.ICUId || row.icuid,
  ICUBedNo: row.ICUBedNo || row.icubedno,
  ICUType: row.ICUType || row.icutype,
  ICURoomNameNo: row.ICURoomNameNo || row.icuroomnameno,
  ICUDescription: row.ICUDescription || row.icudescription,
  IsVentilatorAttached: row.IsVentilatorAttached || row.isventilatorattached,
  ICUStartTimeofDay: row.ICUStartTimeofDay || row.icustarttimeofday || null,
  ICUEndTimeofDay: row.ICUEndTimeofDay || row.icuendoftimeofday || null,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
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
    // Validate that id is an integer
    const icuId = parseInt(id, 10);
    if (isNaN(icuId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ICUId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "ICU" WHERE "ICUId" = $1',
      [icuId]
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

exports.getICUByBedNo = async (req, res) => {
  try {
    const { bedNo } = req.params;
    
    if (!bedNo || !bedNo.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICUBedNo is required' 
      });
    }

    const { rows } = await db.query(
      'SELECT * FROM "ICU" WHERE "ICUBedNo" = $1',
      [bedNo.trim()]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'ICU bed not found with the given bed number' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: mapICURow(rows[0]) 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU bed by bed number',
      error: error.message,
    });
  }
};

const validateICUPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && (!body.ICUBedNo || !body.ICUBedNo.trim())) {
    errors.push('ICUBedNo is required');
  }
  
  if (requireAll && (body.IsVentilatorAttached === undefined || body.IsVentilatorAttached === null || body.IsVentilatorAttached === '')) {
    errors.push('IsVentilatorAttached is required');
  }
  if (body.IsVentilatorAttached !== undefined && body.IsVentilatorAttached !== null && body.IsVentilatorAttached !== '') {
    if (!allowedVentilatorStatus.includes(body.IsVentilatorAttached)) {
      errors.push('IsVentilatorAttached must be "Yes" or "No"');
    }
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
      ICUStartTimeofDay,
      ICUEndTimeofDay,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // Proactive validation: Check if ICUBedNo already exists
    const existingBed = await db.query(
      'SELECT "ICUId" FROM "ICU" WHERE "ICUBedNo" = $1',
      [ICUBedNo.trim()]
    );
    if (existingBed.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ICU bed number already exists',
      });
    }

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

    // ICUId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "ICU"
        ("ICUBedNo", "ICUType", "ICURoomNameNo", "ICUDescription", "IsVentilatorAttached", "ICUStartTimeofDay", "ICUEndTimeofDay", "Status", "CreatedBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      ICUBedNo.trim(),
      ICUType ? ICUType.trim() : null,
      ICURoomNameNo ? ICURoomNameNo.trim() : null,
      ICUDescription ? ICUDescription.trim() : null,
      IsVentilatorAttached,
      ICUStartTimeofDay || null,
      ICUEndTimeofDay || null,
      Status,
      createdByValue,
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
    // Validate that id is an integer
    const icuId = parseInt(id, 10);
    if (isNaN(icuId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ICUId. Must be an integer.' 
      });
    }
    console.log("***********req.body*******", req.body);
    const {
      ICUBedNo,
      ICUType,
      ICURoomNameNo,
      ICUDescription,
      IsVentilatorAttached,
      ICUStartTimeofDay,
      ICUEndTimeofDay,
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

    const updateQuery = `
      UPDATE "ICU"
      SET
        "ICUBedNo" = COALESCE($1, "ICUBedNo"),
        "ICUType" = COALESCE($2, "ICUType"),
        "ICURoomNameNo" = COALESCE($3, "ICURoomNameNo"),
        "ICUDescription" = COALESCE($4, "ICUDescription"),
        "IsVentilatorAttached" = COALESCE($5, "IsVentilatorAttached"),
        "ICUStartTimeofDay" = COALESCE($6, "ICUStartTimeofDay"),
        "ICUEndTimeofDay" = COALESCE($7, "ICUEndTimeofDay"),
        "Status" = COALESCE($8, "Status"),
        "CreatedBy" = COALESCE($9, "CreatedBy")
      WHERE "ICUId" = $10
      RETURNING *;
    `;

    // Proactive validation: If ICUBedNo is being updated, check if it already exists (excluding current record)
    if (ICUBedNo) {
      const existingBed = await db.query(
        'SELECT "ICUId" FROM "ICU" WHERE "ICUBedNo" = $1 AND "ICUId" != $2',
        [ICUBedNo.trim(), icuId]
      );
      if (existingBed.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'ICU bed number already exists',
        });
      }
    }

    // Handle IsVentilatorAttached - if provided, use it; if not provided (undefined), keep existing value
    let isVentilatorAttachedValue = null;
    if (IsVentilatorAttached !== undefined && IsVentilatorAttached !== null && IsVentilatorAttached !== '') {
      isVentilatorAttachedValue = IsVentilatorAttached;
    }

    const updateParams = [
      ICUBedNo ? ICUBedNo.trim() : null,
      ICUType ? ICUType.trim() : null,
      ICURoomNameNo ? ICURoomNameNo.trim() : null,
      ICUDescription ? ICUDescription.trim() : null,
      isVentilatorAttachedValue,
      ICUStartTimeofDay || null,
      ICUEndTimeofDay || null,
      Status || null,
      createdByValue || null,
      icuId,
    ];

    console.log("***********updateQuery*******", updateQuery,updateParams);
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
    // Validate that id is an integer
    const icuId = parseInt(id, 10);
    if (isNaN(icuId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ICUId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "ICU" WHERE "ICUId" = $1 RETURNING *;',
      [icuId]
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

