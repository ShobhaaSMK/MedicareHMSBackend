require('dotenv').config();
const db = require('./db');

// Generate TokenNo in format T-0001, T-0002, etc.
async function generateTokenNo() {
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("TokenNo" FROM 3) AS INT)), 0) + 1 AS next_seq
    FROM "PatientAppointment"
    WHERE "TokenNo" LIKE 'T-%'
  `;
  const { rows } = await db.query(query);
  const nextSeq = rows[0].next_seq;
  const tokenNo = `T-${String(nextSeq).padStart(4, '0')}`;
  return tokenNo;
}

async function main() {
  console.log('Creating OPD Patient Appointments for Today...\n');
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  console.log(`Appointment Date: ${today}\n`);
  
  // Get available patients
  const patientsResult = await db.query(
    'SELECT "PatientId", "PatientNo", "PatientName" FROM "PatientRegistration" WHERE "Status" = \'Active\' ORDER BY "PatientId" LIMIT 10'
  );
  
  if (patientsResult.rows.length === 0) {
    console.error('No active patients found. Please create patient records first.');
    await db.pool.end();
    process.exit(1);
  }
  
  // Get available doctors with OPD consultation
  const doctorsResult = await db.query(
    'SELECT "UserId", "UserName" FROM "Users" WHERE "OPDConsultation" = \'Yes\' AND "Status" = \'Active\' ORDER BY "UserId" LIMIT 10'
  );
  
  if (doctorsResult.rows.length === 0) {
    console.error('No doctors with OPD consultation found. Please create doctor records first.');
    await db.pool.end();
    process.exit(1);
  }
  
  console.log('Available Patients:');
  patientsResult.rows.forEach((p, i) => {
    console.log(`  ${i + 1}. PatientId: ${p.PatientId}, PatientNo: ${p.PatientNo}, Name: ${p.PatientName}`);
  });
  
  console.log('\nAvailable Doctors (OPD):');
  doctorsResult.rows.forEach((d, i) => {
    console.log(`  ${i + 1}. DoctorId: ${d.UserId}, Name: ${d.UserName}`);
  });
  console.log('');
  
  // Create appointments - distribute patients across doctors and times
  const appointmentTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', 
    '11:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00'
  ];
  
  const appointments = [];
  const maxAppointments = Math.min(patientsResult.rows.length, appointmentTimes.length, 8); // Create up to 8 appointments
  
  for (let i = 0; i < maxAppointments; i++) {
    const patient = patientsResult.rows[i % patientsResult.rows.length];
    const doctor = doctorsResult.rows[i % doctorsResult.rows.length];
    const appointmentTime = appointmentTimes[i % appointmentTimes.length];
    
    appointments.push({
      PatientId: patient.PatientId,
      DoctorId: doctor.UserId,
      AppointmentDate: today,
      AppointmentTime: appointmentTime,
      AppointmentStatus: 'Waiting',
      ConsultationCharge: 500 + (i * 50), // Varying charges
      Diagnosis: null, // Will be filled during consultation
      ToBeAdmitted: 'No',
      Status: 'Active'
    });
  }
  
  console.log(`Creating ${appointments.length} appointments...\n`);
  
  const results = [];
  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];
    try {
      // Generate unique token number
      const tokenNo = await generateTokenNo();
      
      // Check if patient already has an appointment today
      const existingAppointment = await db.query(
        'SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientId" = $1::uuid AND "AppointmentDate" = $2',
        [appointment.PatientId, today]
      );
      
      if (existingAppointment.rows.length > 0) {
        console.log(`⚠ Skipping - Patient ${appointment.PatientId} already has an appointment today`);
        continue;
      }
      
      // Insert appointment
      const insertQuery = `
        INSERT INTO "PatientAppointment"
          ("PatientId", "DoctorId", "AppointmentDate", "AppointmentTime",
           "TokenNo", "AppointmentStatus", "ConsultationCharge", "Diagnosis", 
           "ToBeAdmitted", "Status")
        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      
      const { rows } = await db.query(insertQuery, [
        appointment.PatientId,
        appointment.DoctorId,
        appointment.AppointmentDate,
        appointment.AppointmentTime,
        tokenNo,
        appointment.AppointmentStatus,
        appointment.ConsultationCharge,
        appointment.Diagnosis,
        appointment.ToBeAdmitted,
        appointment.Status
      ]);
      
      const created = rows[0];
      const patientName = patientsResult.rows.find(p => p.PatientId === appointment.PatientId)?.PatientName || 'Unknown';
      const doctorName = doctorsResult.rows.find(d => d.UserId === appointment.DoctorId)?.UserName || 'Unknown';
      
      console.log(`✓ Created Appointment ${i + 1}/${appointments.length}`);
      console.log(`  PatientAppointmentId: ${created.PatientAppointmentId}`);
      console.log(`  TokenNo: ${created.TokenNo}`);
      console.log(`  Patient: ${patientName} (${appointment.PatientId})`);
      console.log(`  Doctor: ${doctorName} (${appointment.DoctorId})`);
      console.log(`  Time: ${appointment.AppointmentTime}`);
      console.log(`  Status: ${created.AppointmentStatus}`);
      console.log('');
      
      results.push(created);
    } catch (error) {
      if (error.code === '23505') {
        console.log(`⚠ Token number conflict for appointment ${i + 1}, retrying...`);
        // Retry with new token
        i--; // Retry this appointment
        continue;
      } else {
        console.error(`✗ Error creating appointment ${i + 1}: ${error.message}`);
      }
    }
  }
  
  console.log('=== Summary ===');
  console.log(`Total attempted: ${appointments.length}`);
  console.log(`Successfully created: ${results.length} appointment(s)`);
  console.log(`Failed: ${appointments.length - results.length}`);
  
  if (results.length > 0) {
    console.log('\nCreated Appointments:');
    results.forEach((result, index) => {
      const appointment = appointments.find(a => 
        a.PatientId === result.PatientId && 
        a.AppointmentTime === result.AppointmentTime
      );
      const patientName = patientsResult.rows.find(p => p.PatientId === result.PatientId)?.PatientName || 'Unknown';
      console.log(`  ${index + 1}. TokenNo: ${result.TokenNo}, Patient: ${patientName}, Time: ${result.AppointmentTime}, Status: ${result.AppointmentStatus}`);
    });
  }
  
  await db.pool.end();
}

main()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
