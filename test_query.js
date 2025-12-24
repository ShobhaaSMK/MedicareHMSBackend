require('dotenv').config();
const db = require('./db');

/**
 * Simple script to test/execute SQL queries
 * Usage: node test_query.js
 * 
 * Modify the query variable below to test your queries
 */

async function testQuery() {
  try {
    // ============================================
    // MODIFY THIS QUERY TO TEST YOUR QUERIES
    // ============================================
    const query = `
       SELECT 
        u."UserId" AS "DoctorId",
        u."UserName" AS "Doctor",
        dd."DepartmentName",
        u."DoctorType",
        COUNT(*) FILTER (
          WHERE pa."AppointmentStatus" = 'Waiting' 
          AND pa."Status" = 'Active'
        ) AS "Waiting",
        COUNT(*) FILTER (
          WHERE pa."AppointmentStatus" = 'Consulting' 
          AND pa."Status" = 'Active'
        ) AS "Consulting",
        COUNT(*) FILTER (
          WHERE pa."AppointmentStatus" = 'Completed' 
          AND pa."Status" = 'Active'
        ) AS "Completed",
        COUNT(*) FILTER (
          WHERE pa."AppointmentDate" = '2025-12-23'::date 
          AND pa."Status" = 'Active'
        ) AS "Today",
        u."Status"
      FROM "PatientAppointment" pa
      INNER JOIN "Users" u ON pa."DoctorId" = u."UserId"
      INNER JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE pa."Status" = 'Active'
      GROUP BY 
        u."UserId",
        u."UserName",
        dd."DepartmentName",
        u."DoctorType",
        u."Status"
      ORDER BY u."UserName" ASC
    `;

    console.log('Executing query...');
    console.log('Query:', query);
    console.log('');

    const { rows } = await db.query(query);

    console.log(`Query returned ${rows.length} row(s):`);
    console.log('='.repeat(80));
    
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
      console.log('');
      rows.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
        console.log('');
      });
    } else {
      console.log('No rows returned');
    }

    console.log('='.repeat(80));
    console.log('Query executed successfully!');

  } catch (error) {
    console.error('Error executing query:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Detail:', error.detail);
    console.error('Error Position:', error.position);
  } finally {
    await db.pool.end();
    process.exit(0);
  }
}

// Run the test
testQuery();

