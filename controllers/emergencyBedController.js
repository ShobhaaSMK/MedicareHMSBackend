const db = require('../db');

const allowedStatus = ['Active', 'Inactive', 'Occupied', 'Unoccupied'];

/**
 * Generate EmergencyBedNo in format ER-01, ER-02, etc.
 * Example: ER-01, ER-02, ER-03, ..., ER-10, ER-11, etc.
 */
const generateEmergencyBedNo = async () => {
  const prefix = 'ER-';
  const pattern = 'ER-%';

  // Find the highest sequence number
  // Extract number after "ER-"
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("EmergencyBedNo" FROM 4) AS INT)), 0) + 1 AS next_seq
    FROM "EmergencyBed"
    WHERE "EmergencyBedNo" LIKE $1
      AND SUBSTRING("EmergencyBedNo" FROM 4) ~ '^[0-9]+$'
  `;

  const { rows } = await db.query(query, [pattern]);
  const nextSeq = parseInt(rows[0].next_seq, 10) || 1;

  // Format as ER-XX (2 digits with leading zeros)
  const emergencyBedNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;
  return emergencyBedNo;
};

const mapEmergencyBedRow = (row) => ({
  EmergencyBedId: row.EmergencyBedId || row.emergencybedid,
  EmergencyBedNo: row.EmergencyBedNo || row.emergencybedno,
  EmergencyRoomNameNo: row.EmergencyRoomNameNo || row.emergencyroomnameno || null,
  EmergencyRoomDescription: row.EmergencyRoomDescription || row.emergencyroomdescription,
  ChargesPerDay: row.ChargesPerDay !== undefined && row.ChargesPerDay !== null ? parseFloat(row.ChargesPerDay) : null,
  Status: row.Status || row.status,
  CreatedBy: row.CreatedBy || row.createdby,
  CreatedAt: row.CreatedAt || row.createdat,
});

exports.getAllEmergencyBeds = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM "EmergencyBed"';
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
      data: rows.map(mapEmergencyBedRow),
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
    // Validate that id is an integer
    const emergencyBedId = parseInt(id, 10);
    if (isNaN(emergencyBedId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyBedId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'SELECT * FROM "EmergencyBed" WHERE "EmergencyBedId" = $1',
      [emergencyBedId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }
    res.status(200).json({ success: true, data: mapEmergencyBedRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency bed',
      error: error.message,
    });
  }
};

exports.getEmergencyBedByBedNo = async (req, res) => {
  try {
    const { bedNo } = req.params;
    
    if (!bedNo || !bedNo.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'EmergencyBedNo is required' 
      });
    }

    const { rows } = await db.query(
      'SELECT * FROM "EmergencyBed" WHERE "EmergencyBedNo" = $1',
      [bedNo.trim()]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Emergency bed not found with the given bed number' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: mapEmergencyBedRow(rows[0]) 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency bed by bed number',
      error: error.message,
    });
  }
};

const validateEmergencyBedPayload = (body, requireAll = true) => {
  const errors = [];
  
  // EmergencyBedNo is auto-generated, so it's not required in request
  
  if (body.EmergencyRoomNameNo !== undefined && body.EmergencyRoomNameNo !== null && body.EmergencyRoomNameNo !== '') {
    const roomNameNo = String(body.EmergencyRoomNameNo).trim();
    if (roomNameNo.length > 100) {
      errors.push('EmergencyRoomNameNo must not exceed 100 characters');
    }
  }
  
  if (body.ChargesPerDay !== undefined && body.ChargesPerDay !== null) {
    const charges = parseFloat(body.ChargesPerDay);
    if (isNaN(charges) || charges < 0) {
      errors.push('ChargesPerDay must be a valid positive number');
    }
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active, Inactive, Occupied, or Unoccupied');
  }
  
  if (body.CreatedBy !== undefined && body.CreatedBy !== null && body.CreatedBy !== '') {
    const createdByInt = parseInt(body.CreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('CreatedBy must be a valid integer');
    }
  }
  
  return errors;
};

exports.createEmergencyBed = async (req, res) => {
  try {
    const errors = validateEmergencyBedPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      EmergencyRoomNameNo,
      EmergencyRoomDescription,
      ChargesPerDay,
      Status = 'Unoccupied',
      CreatedBy,
    } = req.body;

    // Generate EmergencyBedNo automatically
    let emergencyBedNo = await generateEmergencyBedNo();

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
      // Validate user exists
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'CreatedBy user does not exist.' 
        });
      }
      createdByValue = createdByInt;
    }

    // Proactive validation: Check if generated EmergencyBedNo already exists (shouldn't happen, but safety check)
    let existingBed = await db.query(
      'SELECT "EmergencyBedId" FROM "EmergencyBed" WHERE "EmergencyBedNo" = $1',
      [emergencyBedNo]
    );
    // Retry up to 3 times if number already exists
    let retryCount = 0;
    while (existingBed.rows.length > 0 && retryCount < 3) {
      emergencyBedNo = await generateEmergencyBedNo();
      existingBed = await db.query(
        'SELECT "EmergencyBedId" FROM "EmergencyBed" WHERE "EmergencyBedNo" = $1',
        [emergencyBedNo]
      );
      retryCount++;
    }
    if (existingBed.rows.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Error generating unique emergency bed number. Please try again.',
      });
    }

    // EmergencyBedId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "EmergencyBed"
        ("EmergencyBedNo", "EmergencyRoomNameNo", "EmergencyRoomDescription", "ChargesPerDay", "Status", "CreatedBy")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const chargesValue = ChargesPerDay !== undefined && ChargesPerDay !== null ? parseFloat(ChargesPerDay) : null;

    const { rows } = await db.query(insertQuery, [
      emergencyBedNo,
      EmergencyRoomNameNo ? EmergencyRoomNameNo.trim() : null,
      EmergencyRoomDescription ? EmergencyRoomDescription.trim() : null,
      chargesValue,
      Status,
      createdByValue,
    ]);

    res.status(201).json({
      success: true,
      message: 'Emergency bed created successfully',
      data: mapEmergencyBedRow(rows[0]),
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
    const errors = validateEmergencyBedPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    // Validate that id is an integer
    const emergencyBedId = parseInt(id, 10);
    if (isNaN(emergencyBedId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyBedId. Must be an integer.' 
      });
    }
    const {
      EmergencyRoomNameNo,
      EmergencyRoomDescription,
      ChargesPerDay,
      Status,
      CreatedBy,
    } = req.body;

    // DEBUG: Log PUT request details
    console.log('\n=== DEBUG: EmergencyBed UPDATE Request ===');
    console.log('PUT /api/emergency-beds/' + emergencyBedId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('EmergencyBedId:', emergencyBedId);

    // DEBUG: Get all occupied beds (by status and by admission)
    const allOccupiedBedsByStatus = await db.query(`
      SELECT "EmergencyBedId", "EmergencyBedNo", "Status"
      FROM "EmergencyBed"
      WHERE "Status" = 'Occupied'
      ORDER BY "EmergencyBedId"
    `);
    
    const allOccupiedBedsByAdmission = await db.query(`
      SELECT 
        eb."EmergencyBedId",
        eb."EmergencyBedNo",
        eb."Status" AS "BedStatus",
        ea."EmergencyAdmissionId",
        ea."PatientId",
        ea."EmergencyStatus",
        ea."Status" AS "AdmissionStatus",
        ea."TransferTo"
      FROM "EmergencyBed" eb
      INNER JOIN "EmergencyAdmission" ea ON eb."EmergencyBedId" = ea."EmergencyBedId"
      WHERE ea."Status" = 'Active'
        AND ea."EmergencyStatus" = 'Admitted'
        AND (ea."TransferTo" IS NULL OR ea."TransferTo" = '')
      ORDER BY eb."EmergencyBedId"
    `);

    console.log('\n--- All Beds with Status = "Occupied" ---');
    console.log(JSON.stringify(allOccupiedBedsByStatus.rows, null, 2));
    
    console.log('\n--- All Beds Occupied by Active Admissions ---');
    console.log(JSON.stringify(allOccupiedBedsByAdmission.rows, null, 2));

    // Check if the bed is currently occupied by an active admission
    const occupiedCheck = await db.query(`
      SELECT 
        "EmergencyAdmissionId", 
        "PatientId", 
        "EmergencyStatus",
        "Status" AS "AdmissionStatus",
        "TransferTo"
      FROM "EmergencyAdmission"
      WHERE "EmergencyBedId" = $1
        AND "Status" = 'Active'
        AND "EmergencyStatus" = 'Admitted'
        AND ("TransferTo" IS NULL OR "TransferTo" = '')
    `, [emergencyBedId]);

    console.log('\n--- Occupancy Check for Bed ID ' + emergencyBedId + ' ---');
    console.log('Query Results:', JSON.stringify(occupiedCheck.rows, null, 2));
    console.log('Number of matching admissions:', occupiedCheck.rows.length);

    // Also check if bed status itself is "Occupied"
    const bedStatusCheck = await db.query(`
      SELECT "EmergencyBedId", "EmergencyBedNo", "Status"
      FROM "EmergencyBed"
      WHERE "EmergencyBedId" = $1
    `, [emergencyBedId]);

    if (bedStatusCheck.rows.length > 0) {
      const bedStatus = bedStatusCheck.rows[0].Status || bedStatusCheck.rows[0].status;
      console.log('Current Bed Status:', bedStatus);
      
      // If bed status is "Occupied", also block the update
      if (bedStatus === 'Occupied') {
        console.log('⚠ BLOCKED: Bed status is "Occupied"');
        return res.status(400).json({
          success: false,
          message: 'Cannot update emergency bed. The bed status is currently "Occupied". Please discharge or transfer the patient first, or change the bed status manually.',
          error: 'Bed is occupied',
          debug: {
            bedId: emergencyBedId,
            bedNo: bedStatusCheck.rows[0].EmergencyBedNo || bedStatusCheck.rows[0].emergencybedno,
            currentStatus: bedStatus,
            activeAdmissions: occupiedCheck.rows
          }
        });
      }
    }

    if (occupiedCheck.rows.length > 0) {
      console.log('⚠ BLOCKED: Active admission found for this bed');
      return res.status(400).json({
        success: false,
        message: 'Cannot update emergency bed. The bed is currently occupied by an active patient admission. Please discharge or transfer the patient first.',
        error: 'Bed is occupied',
        debug: {
          bedId: emergencyBedId,
          activeAdmissions: occupiedCheck.rows
        }
      });
    }

    console.log('✓ Bed is not occupied, proceeding with update...\n');

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
      // Validate user exists
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'CreatedBy user does not exist.' 
        });
      }
      createdByValue = createdByInt;
    }

    // Note: EmergencyBedNo is auto-generated and should not be updated
    // If user wants to update it, they should delete and create a new one

    const updateQuery = `
      UPDATE "EmergencyBed"
      SET
        "EmergencyRoomNameNo" = COALESCE($1, "EmergencyRoomNameNo"),
        "EmergencyRoomDescription" = COALESCE($2, "EmergencyRoomDescription"),
        "ChargesPerDay" = COALESCE($3, "ChargesPerDay"),
        "Status" = COALESCE($4, "Status"),
        "CreatedBy" = COALESCE($5, "CreatedBy")
      WHERE "EmergencyBedId" = $6
      RETURNING *;
    `;

    const chargesValue = ChargesPerDay !== undefined && ChargesPerDay !== null ? parseFloat(ChargesPerDay) : null;

    const updateParams = [
      EmergencyRoomNameNo ? EmergencyRoomNameNo.trim() : null,
      EmergencyRoomDescription ? EmergencyRoomDescription.trim() : null,
      chargesValue,
      Status || null,
      createdByValue,
      emergencyBedId,
    ];

    const { rows } = await db.query(updateQuery, updateParams);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }

    console.log('✓ Update completed successfully');
    console.log('Updated Bed Data:', JSON.stringify(mapEmergencyBedRow(rows[0]), null, 2));
    console.log('=== END DEBUG ===\n');

    res.status(200).json({
      success: true,
      message: 'Emergency bed updated successfully',
      data: mapEmergencyBedRow(rows[0]),
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
    // Validate that id is an integer
    const emergencyBedId = parseInt(id, 10);
    if (isNaN(emergencyBedId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid EmergencyBedId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "EmergencyBed" WHERE "EmergencyBedId" = $1 RETURNING *;',
      [emergencyBedId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency bed not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency bed deleted successfully',
      data: mapEmergencyBedRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting emergency bed',
      error: error.message,
    });
  }
};

