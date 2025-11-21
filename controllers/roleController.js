const db = require('../db');
const { randomUUID } = require('crypto');

const mapRoleRow = (row) => ({
  RoleId: row.RoleId || row.roleid,
  RoleName: row.RoleName || row.rolename,
  RoleDescription: row.RoleDescription || row.roledescription,
  CreatedAt: row.CreatedAt || row.createdat,
  CreatedBy: row.CreatedBy || row.createdby,
});

exports.getAllRoles = async (req, res) => {
  try {
    console.log('getAllRoles');
    const query = 
      'SELECT * FROM "UserRoles" ORDER BY "CreatedAt" DESC';

    const { rows } = await db.query(query);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapRoleRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message,
    });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM "UserRoles" WHERE "RoleId" = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({ success: true, data: mapRoleRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching role',
      error: error.message,
    });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { RoleName, RoleDescription, CreatedBy } = req.body;
    if (!RoleName || !RoleName.trim()) {
      return res.status(400).json({ success: false, message: 'RoleName is required' });
    }

    // Generate random UUID for RoleId using Node.js crypto
    const roleId = randomUUID();
    
    // Ensure UUID is in correct format (should already be, but double-check)
    if (!roleId || typeof roleId !== 'string') {
      throw new Error('Failed to generate RoleId');
    }

    // Use PostgreSQL's uuid type casting to ensure proper format
    const insertQuery = `
      INSERT INTO "UserRoles" ("RoleId", "RoleName", "RoleDescription", "CreatedBy")
      VALUES ($1::uuid, $2, $3, $4)
      RETURNING *;
    `;
    
    const { rows } = await db.query(insertQuery, [
      roleId,
      RoleName.trim(),
      RoleDescription ? RoleDescription.trim() : null,
      CreatedBy || null,
    ]);
    
    console.log('Role inserted successfully. Rows returned:', rows.length);
    console.log('Inserted RoleId:', rows[0]?.RoleId);
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: mapRoleRow(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation (unlikely with UUID, but handle it)
      return res.status(400).json({
        success: false,
        message: 'Role ID already exists. Please try again.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message,
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { RoleName, RoleDescription } = req.body;

    const updateQuery = `
      UPDATE "UserRoles"
      SET "RoleName" = COALESCE($1, "RoleName"),
          "RoleDescription" = COALESCE($2, "RoleDescription")
      WHERE "RoleId" = $3
      RETURNING *;
    `;
    const { rows } = await db.query(updateQuery, [
      RoleName ? RoleName.trim() : null,
      RoleDescription ? RoleDescription.trim() : null,
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: mapRoleRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "UserRoles" WHERE "RoleId" = $1 RETURNING *;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: mapRoleRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message,
    });
  }
};

