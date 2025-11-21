const db = require('../db');
const { randomUUID } = require('crypto');

const allowedStatus = ['Active', 'InActive'];

const mapLabTestRow = (row) => ({
  LabTestId: row.LabTestId || row.labtestid,
  DisplayTestId: row.DisplayTestId || row.displaytestid,
  TestName: row.TestName || row.testname,
  TestCategory: row.TestCategory || row.testcategory,
  Description: row.Description || row.description,
  Charges: row.Charges ? parseFloat(row.Charges) : row.charges ? parseFloat(row.charges) : 0,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
});

exports.getAllLabTests = async (req, res) => {
  try {
    const { status, testCategory } = req.query;
    let query = 'SELECT * FROM "LabTest"';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (testCategory) {
      conditions.push(`"TestCategory" = $${params.length + 1}`);
      params.push(testCategory);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapLabTestRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab tests',
      error: error.message,
    });
  }
};

exports.getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "LabTest" WHERE "LabTestId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }
    res.status(200).json({ success: true, data: mapLabTestRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lab test',
      error: error.message,
    });
  }
};

const validateLabTestPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && (!body.DisplayTestId || !body.DisplayTestId.trim())) {
    errors.push('DisplayTestId is required');
  }
  
  if (requireAll && (!body.TestName || !body.TestName.trim())) {
    errors.push('TestName is required');
  }
  
  if (requireAll && (!body.TestCategory || !body.TestCategory.trim())) {
    errors.push('TestCategory is required');
  }
  
  if (requireAll && body.Charges === undefined) {
    errors.push('Charges is required');
  }
  if (body.Charges !== undefined && (isNaN(body.Charges) || body.Charges < 0)) {
    errors.push('Charges must be a non-negative number');
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or InActive');
  }
  
  return errors;
};

exports.createLabTest = async (req, res) => {
  try {
    const errors = validateLabTestPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      DisplayTestId,
      TestName,
      TestCategory,
      Description,
      Charges,
      Status = 'Active',
    } = req.body;

    // Generate random UUID for LabTestId
    const labTestId = randomUUID();
    
    if (!labTestId || typeof labTestId !== 'string') {
      throw new Error('Failed to generate LabTestId');
    }

    const insertQuery = `
      INSERT INTO "LabTest"
        ("LabTestId", "DisplayTestId", "TestName", "TestCategory", "Description", "Charges", "Status")
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      labTestId,
      DisplayTestId.trim(),
      TestName.trim(),
      TestCategory.trim(),
      Description ? Description.trim() : null,
      parseFloat(Charges),
      Status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Lab test created successfully',
      data: mapLabTestRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'DisplayTestId already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating lab test',
      error: error.message,
    });
  }
};

exports.updateLabTest = async (req, res) => {
  try {
    const errors = validateLabTestPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const {
      DisplayTestId,
      TestName,
      TestCategory,
      Description,
      Charges,
      Status,
    } = req.body;

    const updateQuery = `
      UPDATE "LabTest"
      SET
        "DisplayTestId" = COALESCE($1, "DisplayTestId"),
        "TestName" = COALESCE($2, "TestName"),
        "TestCategory" = COALESCE($3, "TestCategory"),
        "Description" = COALESCE($4, "Description"),
        "Charges" = COALESCE($5, "Charges"),
        "Status" = COALESCE($6, "Status")
      WHERE "LabTestId" = $7::uuid
      RETURNING *;
    `;

    const updateParams = [
      DisplayTestId ? DisplayTestId.trim() : null,
      TestName ? TestName.trim() : null,
      TestCategory ? TestCategory.trim() : null,
      Description ? Description.trim() : null,
      Charges !== undefined ? parseFloat(Charges) : null,
      Status || null,
      id,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Lab test updated successfully',
      data: mapLabTestRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'DisplayTestId already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating lab test',
      error: error.message,
    });
  }
};

exports.deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "LabTest" WHERE "LabTestId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Lab test deleted successfully',
      data: mapLabTestRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting lab test',
      error: error.message,
    });
  }
};
