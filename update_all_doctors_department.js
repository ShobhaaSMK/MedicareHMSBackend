require('dotenv').config();
const db = require('./db');

/**
 * Simple script to update all Doctor role users to a specific department
 * 
 * Modify the departmentIdToAssign variable below to set the target department
 */

// Set the DepartmentId you want to assign to all doctors
// Set to null to skip the update
const departmentIdToAssign = null; // Change this to the desired DepartmentId

async function updateAllDoctorsDepartment() {
  try {
    if (!departmentIdToAssign) {
      console.log('Please set departmentIdToAssign variable in the script first.');
      console.log('Example: const departmentIdToAssign = 1; // Assign all doctors to department ID 1\n');
      
      // Show available departments
      const deptsResult = await db.query(
        'SELECT "DoctorDepartmentId", "DepartmentName" FROM "DoctorDepartment" WHERE "Status" = \'Active\' ORDER BY "DepartmentName"'
      );
      
      console.log('Available Departments:');
      deptsResult.rows.forEach(dept => {
        console.log(`  DepartmentId: ${dept.DoctorDepartmentId}, Name: ${dept.DepartmentName}`);
      });
      
      await db.pool.end();
      return;
    }

    console.log('Updating all Doctor role users...\n');

    // Verify department exists
    const deptCheck = await db.query(
      'SELECT "DoctorDepartmentId", "DepartmentName" FROM "DoctorDepartment" WHERE "DoctorDepartmentId" = $1 AND "Status" = \'Active\'',
      [departmentIdToAssign]
    );

    if (deptCheck.rows.length === 0) {
      console.error(`Error: DepartmentId ${departmentIdToAssign} does not exist or is not active.`);
      await db.pool.end();
      return;
    }

    console.log(`Target Department: ${deptCheck.rows[0].DepartmentName} (ID: ${departmentIdToAssign})\n`);

    // Get Doctor role
    const roleResult = await db.query(
      'SELECT "RoleId", "RoleName" FROM "Roles" WHERE "RoleName" ILIKE \'%doctor%\' OR "RoleName" ILIKE \'%dr%\' LIMIT 1'
    );

    if (roleResult.rows.length === 0) {
      console.log('No Doctor role found.');
      await db.pool.end();
      return;
    }

    const doctorRoleId = roleResult.rows[0].RoleId;
    console.log(`Doctor Role: ${roleResult.rows[0].RoleName}\n`);

    // Get current doctor users
    const doctorsBefore = await db.query(
      `SELECT u."UserId", u."UserName", u."DoctorDepartmentId", dd."DepartmentName"
       FROM "Users" u
       LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
       WHERE u."RoleId" = $1::uuid
       ORDER BY u."UserName"`,
      [doctorRoleId]
    );

    console.log(`Found ${doctorsBefore.rows.length} doctor user(s):`);
    doctorsBefore.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.UserName} (UserId: ${doc.UserId}) - Current Dept: ${doc.DepartmentName || 'NULL'}`);
    });

    // Update all doctors to the specified department
    const updateResult = await db.query(
      `UPDATE "Users" 
       SET "DoctorDepartmentId" = $1 
       WHERE "RoleId" = $2::uuid
       RETURNING "UserId", "UserName", "DoctorDepartmentId"`,
      [departmentIdToAssign, doctorRoleId]
    );

    console.log(`\n✓ Successfully updated ${updateResult.rows.length} doctor(s) to DepartmentId ${departmentIdToAssign}`);

    // Show updated results
    console.log('\nUpdated Doctors:');
    updateResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.UserName} (UserId: ${doc.UserId}) - New DeptId: ${doc.DoctorDepartmentId}`);
    });

    await db.pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await db.pool.end();
    process.exit(1);
  }
}

updateAllDoctorsDepartment()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
