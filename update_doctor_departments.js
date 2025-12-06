require('dotenv').config();
const db = require('./db');

/**
 * Script to update DoctorDepartmentId for users with Doctor role
 * 
 * Usage options:
 * 1. Update all doctors to a default department
 * 2. Update specific doctors based on mapping
 * 3. Show current status without updating
 */

// Configuration: Map UserId or UserName to DepartmentId
// Leave empty to assign all doctors to a default department
const doctorDepartmentMapping = {
  // Example mappings (uncomment and modify as needed):
  // 15: 1,  // UserId 15 -> DepartmentId 1
  // 16: 2,  // UserId 16 -> DepartmentId 2
  // 'dr.davis': 1,  // UserName 'dr.davis' -> DepartmentId 1
};

// Default department ID to assign if no mapping is provided
// Set to null to skip updates for doctors without mapping
const defaultDepartmentId = null;

async function updateDoctorDepartments() {
  try {
    console.log('Updating DoctorDepartmentId for Doctor role users...\n');

    // Get Doctor role
    const roleResult = await db.query(
      'SELECT "RoleId", "RoleName" FROM "Roles" WHERE "RoleName" ILIKE \'%doctor%\' OR "RoleName" ILIKE \'%dr%\' LIMIT 1'
    );

    if (roleResult.rows.length === 0) {
      console.log('No Doctor role found. Please check your Roles table.');
      await db.pool.end();
      return;
    }

    const doctorRoleId = roleResult.rows[0].RoleId;
    console.log(`Found Doctor Role: ${roleResult.rows[0].RoleName} (${doctorRoleId})\n`);

    // Get all doctor users
    const doctorsResult = await db.query(
      `SELECT u."UserId", u."UserName", u."DoctorDepartmentId", 
              r."RoleName", dd."DepartmentName"
       FROM "Users" u
       INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
       LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
       WHERE u."RoleId" = $1::uuid
       ORDER BY u."UserName"`,
      [doctorRoleId]
    );

    if (doctorsResult.rows.length === 0) {
      console.log('No users found with Doctor role.');
      await db.pool.end();
      return;
    }

    console.log(`Found ${doctorsResult.rows.length} doctor user(s):\n`);
    doctorsResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. UserId: ${doc.UserId}, UserName: ${doc.UserName}`);
      console.log(`   Current DepartmentId: ${doc.DoctorDepartmentId || 'NULL'}, Department: ${doc.DepartmentName || 'N/A'}`);
    });

    // Get available departments
    const deptsResult = await db.query(
      'SELECT "DoctorDepartmentId", "DepartmentName" FROM "DoctorDepartment" WHERE "Status" = \'Active\' ORDER BY "DepartmentName"'
    );

    console.log('\nAvailable Departments:');
    deptsResult.rows.forEach((dept, index) => {
      console.log(`${index + 1}. DepartmentId: ${dept.DoctorDepartmentId}, Name: ${dept.DepartmentName}`);
    });

    if (deptsResult.rows.length === 0) {
      console.log('\nNo active departments found. Please create departments first.');
      await db.pool.end();
      return;
    }

    // Determine which department to assign
    const updates = [];
    for (const doctor of doctorsResult.rows) {
      let departmentId = null;

      // Check if there's a specific mapping for this doctor
      if (doctorDepartmentMapping[doctor.UserId]) {
        departmentId = doctorDepartmentMapping[doctor.UserId];
      } else if (doctorDepartmentMapping[doctor.UserName]) {
        departmentId = doctorDepartmentMapping[doctor.UserName];
      } else if (defaultDepartmentId) {
        departmentId = defaultDepartmentId;
      }

      // Only update if departmentId is determined and different from current
      if (departmentId && doctor.DoctorDepartmentId !== departmentId) {
        // Verify department exists
        const deptExists = deptsResult.rows.find(d => d.DoctorDepartmentId === departmentId);
        if (!deptExists) {
          console.log(`\n⚠ Skipping UserId ${doctor.UserId} - DepartmentId ${departmentId} does not exist`);
          continue;
        }

        updates.push({
          userId: doctor.UserId,
          userName: doctor.UserName,
          oldDepartmentId: doctor.DoctorDepartmentId,
          newDepartmentId: departmentId,
          departmentName: deptExists.DepartmentName
        });
      }
    }

    if (updates.length === 0) {
      console.log('\n\nNo updates needed. All doctors already have departments assigned or no mapping/default provided.');
      await db.pool.end();
      return;
    }

    console.log(`\n\nUpdating ${updates.length} doctor(s)...\n`);

    const results = [];
    for (const update of updates) {
      try {
        const updateResult = await db.query(
          'UPDATE "Users" SET "DoctorDepartmentId" = $1 WHERE "UserId" = $2 RETURNING "UserId", "UserName", "DoctorDepartmentId"',
          [update.newDepartmentId, update.userId]
        );

        console.log(`✓ Updated UserId ${update.userId} (${update.userName})`);
        console.log(`  Old DepartmentId: ${update.oldDepartmentId || 'NULL'} -> New DepartmentId: ${update.newDepartmentId} (${update.departmentName})`);

        results.push({
          success: true,
          userId: update.userId,
          userName: update.userName,
          newDepartmentId: update.newDepartmentId
        });
      } catch (error) {
        console.error(`✗ Error updating UserId ${update.userId}: ${error.message}`);
        results.push({
          success: false,
          userId: update.userId,
          userName: update.userName,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n=== Summary ===`);
    console.log(`Total updates attempted: ${updates.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${updates.length - successCount}`);

    await db.pool.end();
  } catch (error) {
    console.error('Fatal error:', error);
    await db.pool.end();
    process.exit(1);
  }
}

// Run the script
updateDoctorDepartments()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
