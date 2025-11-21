const db = require('../db');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const mapUserRow = (row) => ({
  UserId: row.UserId || row.userid,
  RoleId: row.RoleId || row.roleid,
  UserName: row.UserName || row.username,
  PhoneNo: row.PhoneNo || row.phoneno,
  EmailId: row.EmailId || row.emailid,
  DoctorDepartmentId: row.DoctorDepartmentId || row.doctordepartmentid,
  DoctorQualification: row.DoctorQualification || row.doctorqualification,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
  CreatedAt: row.CreatedAt || row.createdat,
  RoleName: row.RoleName || row.rolename || null,
  DepartmentName: row.DepartmentName || row.departmentname || null,
});

exports.getAllUsers = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let query = `
      SELECT u.*, r."RoleName", d."DepartmentName"
      FROM "Users" u
      LEFT JOIN "UserRoles" r ON u."RoleId" = r."RoleId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
    `;
    if (status) {
      params.push(status);
      query += ' WHERE u."Status" = $1';
    }
    query += ' ORDER BY u."CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapUserRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT u.*, r."RoleName", d."DepartmentName"
      FROM "Users" u
      LEFT JOIN "UserRoles" r ON u."RoleId" = r."RoleId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
      WHERE u."UserId" = $1::uuid
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: mapUserRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      RoleId,
      UserName,
      Password,
      PhoneNo,
      EmailId,
      DoctorDepartmentId,
      DoctorQualification,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    if (!RoleId) {
      return res.status(400).json({ success: false, message: 'RoleId is required' });
    }
    if (!UserName || !UserName.trim()) {
      return res.status(400).json({ success: false, message: 'UserName is required' });
    }
    if (!Password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    // Validate CreatedBy if provided (should be a valid UUID)
    let createdByValue = null;
    if (CreatedBy) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(CreatedBy)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid UUID (UserId) if provided' });
      }
      createdByValue = CreatedBy;
    }

    // Generate random UUID for UserId
    const userId = randomUUID();
    
    // Ensure UUID is in correct format
    if (!userId || typeof userId !== 'string') {
      throw new Error('Failed to generate UserId');
    }
    
    // If CreatedBy is not provided, allow NULL (for first user) or use self-reference
    // For self-reference, we'll use the same userId
    if (!createdByValue) {
      // Allow NULL for first user, or use self-reference
      // Using self-reference for consistency
      createdByValue = userId;
    }

    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    const insertQuery = `
      INSERT INTO "Users"
        ("UserId", "RoleId","UserName","Password","PhoneNo","EmailId","DoctorDepartmentId",
         "DoctorQualification","Status","CreatedBy")
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::uuid, $8, $9, $10::uuid)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      userId,
      RoleId,
      UserName.trim(),
      hashedPassword,
      PhoneNo || null,
      EmailId || null,
      DoctorDepartmentId || null,
      DoctorQualification || null,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: mapUserRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      RoleId,
      UserName,
      Password,
      PhoneNo,
      EmailId,
      DoctorDepartmentId,
      DoctorQualification,
      Status,
      CreatedBy,
    } = req.body;

    // Validate CreatedBy if provided (should be a UUID)
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(CreatedBy)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid UUID (UserId)' });
      }
      createdByValue = CreatedBy;
    }

    // Hash password if provided
    let hashedPassword = null;
    if (Password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(Password, saltRounds);
    }

    const updateQuery = `
      UPDATE "Users"
      SET
        "RoleId" = COALESCE($1::uuid, "RoleId"),
        "UserName" = COALESCE($2, "UserName"),
        "Password" = COALESCE($3, "Password"),
        "PhoneNo" = COALESCE($4, "PhoneNo"),
        "EmailId" = COALESCE($5, "EmailId"),
        "DoctorDepartmentId" = COALESCE($6::uuid, "DoctorDepartmentId"),
        "DoctorQualification" = COALESCE($7, "DoctorQualification"),
        "Status" = COALESCE($8, "Status"),
        "CreatedBy" = COALESCE($9::uuid, "CreatedBy")
      WHERE "UserId" = $10::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, [
      RoleId || null,
      UserName ? UserName.trim() : null,
      hashedPassword || null,
      PhoneNo || null,
      EmailId || null,
      DoctorDepartmentId || null,
      DoctorQualification || null,
      Status || null,
      createdByValue || null,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: mapUserRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "Users" WHERE "UserId" = $1::uuid RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: mapUserRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

