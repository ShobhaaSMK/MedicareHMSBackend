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
        icu."ICUId",
        icu."ICUBedNo",
        icu."ICUType",
        icu."ICURoomNameNo",
        icu."ICUDescription",
        icu."IsVentilatorAttached",
        icu."ICUStartTimeofDay",
        icu."ICUEndTimeofDay",
        icu."Status" AS "ICUStatus",
        icu."CreatedBy" AS "ICUCreatedBy",
        icu."CreatedAt" AS "ICUCreatedAt",
        pica.*,
        pica."Status" AS "AdmissionStatus",
        p."PatientName",
        p."PatientNo",
        p."Age",
        p."Gender",
        p."PhoneNo" AS "PatientPhoneNo",
        pa."TokenNo" AS "AppointmentTokenNo",
        u."UserName" AS "CreatedByName",
        attendingDoctor."UserName" AS "AttendingDoctorName",
        TO_CHAR(pica."ICUAllocationFromDate", 'DD-MM-YYYY HH24:MI') AS "ICUAllocationFromDate",
        pica."PatientType"
      FROM "PatientICUAdmission" pica
      LEFT JOIN "ICU" icu ON icu."ICUId" = pica."ICUId"
        AND pica."Status" = 'Active'
        AND pica."ICUAdmissionStatus" = 'Occupied'
        AND pica."ICUAllocationFromDate" IS NOT NULL
        AND (
          (pica."ICUAllocationToDate" IS NOT NULL
           AND $1::date >= pica."ICUAllocationFromDate"
           AND $1::date <= pica."ICUAllocationToDate")
          OR
          (pica."ICUAllocationToDate" IS NULL
           AND $1::date >= pica."ICUAllocationFromDate")
        )
      LEFT JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      LEFT JOIN "PatientAppointment" pa ON pica."PatientAppointmentId" = pa."PatientAppointmentId"
      LEFT JOIN "Users" u ON pica."ICUAllocationCreatedBy" = u."UserId"
      LEFT JOIN "Users" attendingDoctor ON pica."AttendingDoctorId" = attendingDoctor."UserId"
      WHERE icu."Status" = 'Active'
      ORDER BY icu."ICUBedNo" ASC
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

