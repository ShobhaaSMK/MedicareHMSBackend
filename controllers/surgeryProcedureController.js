const db = require('../db');

const allowedStatus = ['Active', 'Inactive'];

const mapSurgeryProcedureRow = (row) => ({
  SurgeryId: row.SurgeryId || row.surgeryid,
  SurgeryType: row.SurgeryType || row.surgerytype || null,
  SurgeryName: row.SurgeryName || row.surgeryname,
  SurgeryDetails: row.SurgeryDetails || row.surgerydetails || null,
  PreSurgerySpecifications: row.PreSurgerySpecifications || row.presurgeryspecifications || null,
  PostSurgerySpecifications: row.PostSurgerySpecifications || row.postsurgeryspecifications || null,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby || null,
  CreatedAt: row.CreatedAt || row.createdat,
  CreatedByName: row.CreatedByName || row.createdbyname || null,
});

exports.getAllSurgeryProcedures = async (req, res) => {
  try {
    const { status, surgeryType, surgeryName } = req.query;
    let query = `
      SELECT 
        sp.*,
        u."UserName" AS "CreatedByName"
      FROM "SurgeryProcedure" sp
      LEFT JOIN "Users" u ON sp."CreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`sp."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (surgeryType) {
      conditions.push(`sp."SurgeryType" = $${params.length + 1}`);
      params.push(surgeryType);
    }
    if (surgeryName) {
      conditions.push(`sp."SurgeryName" ILIKE $${params.length + 1}`);
      params.push(`%${surgeryName}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY sp."CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapSurgeryProcedureRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching surgery procedures',
      error: error.message,
    });
  }
};

exports.getSurgeryProcedureById = async (req, res) => {
  try {
    const { id } = req.params;
    const surgeryId = parseInt(id, 10);
    if (isNaN(surgeryId)) {
      return res.status(400).json({ success: false, message: 'Invalid SurgeryId. Must be an integer.' });
    }
    const { rows } = await db.query(
      `
      SELECT 
        sp.*,
        u."UserName" AS "CreatedByName"
      FROM "SurgeryProcedure" sp
      LEFT JOIN "Users" u ON sp."CreatedBy" = u."UserId"
      WHERE sp."SurgeryId" = $1
      `,
      [surgeryId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Surgery procedure not found' });
    }
    res.status(200).json({ success: true, data: mapSurgeryProcedureRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching surgery procedure',
      error: error.message,
    });
  }
};

exports.getSurgeryProceduresByType = async (req, res) => {
  try {
    const { surgeryType } = req.params;
    if (!surgeryType || !surgeryType.trim()) {
      return res.status(400).json({ success: false, message: 'SurgeryType is required' });
    }
    const { rows } = await db.query(
      `
      SELECT 
        sp.*,
        u."UserName" AS "CreatedByName"
      FROM "SurgeryProcedure" sp
      LEFT JOIN "Users" u ON sp."CreatedBy" = u."UserId"
      WHERE sp."SurgeryType" = $1
      ORDER BY sp."CreatedAt" DESC
      `,
      [surgeryType.trim()]
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      surgeryType: surgeryType.trim(),
      data: rows.map(mapSurgeryProcedureRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching surgery procedures by type',
      error: error.message,
    });
  }
};

const validateSurgeryProcedurePayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && (!body.SurgeryName || !body.SurgeryName.trim())) {
    errors.push('SurgeryName is required');
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.CreatedBy !== undefined && body.CreatedBy !== null && body.CreatedBy !== '') {
    const createdByInt = parseInt(body.CreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('CreatedBy must be a valid integer');
    }
  }

  return errors;
};

exports.createSurgeryProcedure = async (req, res) => {
  try {
    const errors = validateSurgeryProcedurePayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      SurgeryType,
      SurgeryName,
      SurgeryDetails,
      PreSurgerySpecifications,
      PostSurgerySpecifications,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // Validate CreatedBy if provided
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid integer' });
      }
      // Check if user exists
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'CreatedBy user does not exist' });
      }
      createdByValue = createdByInt;
    }

    const insertQuery = `
      INSERT INTO "SurgeryProcedure"
        ("SurgeryType", "SurgeryName", "SurgeryDetails", "PreSurgerySpecifications",
         "PostSurgerySpecifications", "Status", "CreatedBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      SurgeryType ? SurgeryType.trim() : null,
      SurgeryName.trim(),
      SurgeryDetails ? SurgeryDetails.trim() : null,
      PreSurgerySpecifications ? PreSurgerySpecifications.trim() : null,
      PostSurgerySpecifications ? PostSurgerySpecifications.trim() : null,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'Surgery procedure created successfully',
      data: mapSurgeryProcedureRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating surgery procedure',
      error: error.message,
    });
  }
};

exports.updateSurgeryProcedure = async (req, res) => {
  try {
    const errors = validateSurgeryProcedurePayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const surgeryId = parseInt(id, 10);
    if (isNaN(surgeryId)) {
      return res.status(400).json({ success: false, message: 'Invalid SurgeryId. Must be an integer.' });
    }

    const {
      SurgeryType,
      SurgeryName,
      SurgeryDetails,
      PreSurgerySpecifications,
      PostSurgerySpecifications,
      Status,
      CreatedBy,
    } = req.body;

    // Validate CreatedBy if provided
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid integer' });
      }
      // Check if user exists
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'CreatedBy user does not exist' });
      }
      createdByValue = createdByInt;
    } else if (CreatedBy === null) {
      createdByValue = null;
    }

    const updateQuery = `
      UPDATE "SurgeryProcedure"
      SET
        "SurgeryType" = COALESCE($1, "SurgeryType"),
        "SurgeryName" = COALESCE($2, "SurgeryName"),
        "SurgeryDetails" = COALESCE($3, "SurgeryDetails"),
        "PreSurgerySpecifications" = COALESCE($4, "PreSurgerySpecifications"),
        "PostSurgerySpecifications" = COALESCE($5, "PostSurgerySpecifications"),
        "Status" = COALESCE($6, "Status"),
        "CreatedBy" = COALESCE($7, "CreatedBy")
      WHERE "SurgeryId" = $8
      RETURNING *;
    `;

    const updateParams = [
      SurgeryType ? SurgeryType.trim() : null,
      SurgeryName ? SurgeryName.trim() : null,
      SurgeryDetails ? SurgeryDetails.trim() : null,
      PreSurgerySpecifications ? PreSurgerySpecifications.trim() : null,
      PostSurgerySpecifications ? PostSurgerySpecifications.trim() : null,
      Status || null,
      createdByValue,
      surgeryId,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Surgery procedure not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Surgery procedure updated successfully',
      data: mapSurgeryProcedureRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating surgery procedure',
      error: error.message,
    });
  }
};

exports.deleteSurgeryProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const surgeryId = parseInt(id, 10);
    if (isNaN(surgeryId)) {
      return res.status(400).json({ success: false, message: 'Invalid SurgeryId. Must be an integer.' });
    }

    const { rows } = await db.query(
      'DELETE FROM "SurgeryProcedure" WHERE "SurgeryId" = $1 RETURNING *;',
      [surgeryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Surgery procedure not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Surgery procedure deleted successfully',
      data: mapSurgeryProcedureRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting surgery procedure',
      error: error.message,
    });
  }
};

