require('dotenv').config();
const db = require('./db');

async function runQuery() {
  try {
    // Set parameters
    const status = 'Active';
    const startDate = '2025-12-11'; // Based on the appointments we just created
    const endDate = '2025-12-18';
    
    console.log('Running OPD Query...\n');
    console.log('Parameters:');
    console.log(`  Status: ${status}`);
    console.log(`  StartDate: ${startDate}`);
    console.log(`  EndDate: ${endDate}\n`);
    
    const query = `
      SELECT
        pa."DoctorId",
        u."UserName" AS "DoctorName",
        u."EmailId" AS "DoctorEmail",
        u."PhoneNo" AS "DoctorPhone",
        u."DoctorQualification",
        COALESCE(dd."DepartmentName", 'Unassigned') AS "Specialty",
        dd."DoctorDepartmentId",
        COUNT(DISTINCT pa."PatientId") AS "OPDPatientCount"
      FROM "PatientAppointment" pa
      INNER JOIN "Users" u ON pa."DoctorId" = u."UserId"
      LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
      WHERE pa."Status" = $1
        AND pa."AppointmentDate" >= $2::date 
        AND pa."AppointmentDate" <= $3::date
      GROUP BY pa."DoctorId", u."UserName", u."EmailId", u."PhoneNo", u."DoctorQualification", dd."DepartmentName", dd."DoctorDepartmentId"
      ORDER BY "OPDPatientCount" DESC, "DoctorName" ASC
    `;
    
    const { rows } = await db.query(query, [status, startDate, endDate]);
    
    console.log('Query Results:');
    console.log('='.repeat(100));
    console.log(`Total Records: ${rows.length}\n`);
    
    if (rows.length === 0) {
      console.log('No records found.');
    } else {
      // Display results in a formatted table
      console.log('DoctorId | DoctorName      | Specialty    | EmailId              | PhoneNo        | Qualification | OPDPatientCount');
      console.log('-'.repeat(100));
      
      rows.forEach((row, index) => {
        const doctorId = row.DoctorId || row.doctorid || 'N/A';
        const doctorName = (row.DoctorName || row.doctorname || 'Unknown').padEnd(15);
        const specialty = (row.Specialty || row.specialty || 'Unassigned').padEnd(12);
        const emailId = ((row.DoctorEmail || row.doctoremail || 'N/A') || 'N/A').padEnd(20);
        const phoneNo = ((row.DoctorPhone || row.doctorphone || 'N/A') || 'N/A').padEnd(14);
        const qualification = ((row.DoctorQualification || row.doctorqualification || 'N/A') || 'N/A').padEnd(13);
        const opdCount = row.OPDPatientCount || row.opdpatientcount || 0;
        
        console.log(`${String(doctorId).padEnd(8)} | ${doctorName} | ${specialty} | ${emailId} | ${phoneNo} | ${qualification} | ${opdCount}`);
      });
      
      console.log('\n' + '='.repeat(100));
      
      // Summary
      const totalOPD = rows.reduce((sum, row) => sum + parseInt(row.OPDPatientCount || row.opdpatientcount || 0, 10), 0);
      console.log(`\nSummary:`);
      console.log(`  Total Doctors: ${rows.length}`);
      console.log(`  Total OPD Patients: ${totalOPD}`);
      
      // Detailed JSON output
      console.log('\nDetailed JSON Output:');
      console.log(JSON.stringify(rows, null, 2));
    }
    
    await db.pool.end();
  } catch (error) {
    console.error('Error running query:', error.message);
    console.error(error);
    await db.pool.end();
    process.exit(1);
  }
}

runQuery()
  .then(() => {
    console.log('\nQuery execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

