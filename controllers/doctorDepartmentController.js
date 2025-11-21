const db = require('../db');
const { randomUUID } = require('crypto');

const mapDepartmentRow = (row) => ({
  DoctorDepartmentId: row.DoctorDepartmentId || row.doctordepartmentid,
  DepartmentName: row.DepartmentName || row.departmentname,
  SpecialisationDetails: row.SpecialisationDetails || row.specialisationdetails,
  NoOfDoctors: row.NoOfDoctors || row.noofdoctors || 0,
  Status: row.Status || row.status,
  CreatedAt: row.CreatedAt || row.createdat,
  CreatedBy: row.CreatedBy || row.createdby,
});

exports.getAllDepartments = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM "DoctorDepartment"';
    const params = [];
    if (status) {
      query += ' WHERE "Status" = $1';
      params.push(status);
    }
    query += ' ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapDepartmentRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor departments',
      error: error.message,
    });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "DoctorDepartment" WHERE "DoctorDepartmentId" = $1::uuid',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({ success: true, data: mapDepartmentRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message,
    });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { DepartmentName, SpecialisationDetails, NoOfDoctors, Status = 'Active', CreatedBy } = req.body;
    if (!DepartmentName || !DepartmentName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'DepartmentName is required' });
    }

    // Validate CreatedBy if provided (should be a valid UUID - UserId)
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(CreatedBy)) {
        return res
          .status(400)
          .json({ success: false, message: 'CreatedBy must be a valid UUID (UserId) if provided' });
      }
      createdByValue = CreatedBy;
    }

    // Generate random UUID for DoctorDepartmentId
    const doctorDepartmentId = randomUUID();
    
    if (!doctorDepartmentId || typeof doctorDepartmentId !== 'string') {
      throw new Error('Failed to generate DoctorDepartmentId');
    }

    // Use conditional casting for CreatedBy - only cast to UUID if value is provided
    const insertQuery = createdByValue
      ? `
        INSERT INTO "DoctorDepartment" ("DoctorDepartmentId", "DepartmentName", "SpecialisationDetails", "NoOfDoctors", "Status", "CreatedBy")
        VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid) RETURNING *;
      `
      : `
        INSERT INTO "DoctorDepartment" ("DoctorDepartmentId", "DepartmentName", "SpecialisationDetails", "NoOfDoctors", "Status", "CreatedBy")
        VALUES ($1::uuid, $2, $3, $4, $5, NULL) RETURNING *;
      `;

    const params = [
      doctorDepartmentId,
      DepartmentName.trim(),
      SpecialisationDetails ? SpecialisationDetails.trim() : null,
      NoOfDoctors || 0,
      Status,
    ];
    
    if (createdByValue) {
      params.push(createdByValue);
    }

    const { rows } = await db.query(insertQuery, params);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: mapDepartmentRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message,
    });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { DepartmentName, SpecialisationDetails, NoOfDoctors, Status } = req.body;

    const updateQuery = `
      UPDATE "DoctorDepartment"
      SET
        "DepartmentName" = COALESCE($1, "DepartmentName"),
        "SpecialisationDetails" = COALESCE($2, "SpecialisationDetails"),
        "NoOfDoctors" = COALESCE($3, "NoOfDoctors"),
        "Status" = COALESCE($4, "Status")
      WHERE "DoctorDepartmentId" = $5::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, [
      DepartmentName ? DepartmentName.trim() : null,
      SpecialisationDetails ? SpecialisationDetails.trim() : null,
      NoOfDoctors !== undefined ? NoOfDoctors : null,
      Status || null,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: mapDepartmentRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message,
    });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "DoctorDepartment" WHERE "DoctorDepartmentId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: mapDepartmentRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message,
    });
  }
};

