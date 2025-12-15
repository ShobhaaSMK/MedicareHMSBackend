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
  console.log('Creating Patient Appointments for Active Doctors...\n');
  
  // Get active doctors (all active doctors, not just OPD)
  const doctorsResult = await db.query(`
    SELECT 
      u."UserId", 
      u."UserName",
      u."OPDConsultation",
      dd."DepartmentName"
    FROM "Users" u
    LEFT JOIN "DoctorDepartment" dd ON u."DoctorDepartmentId" = dd."DoctorDepartmentId"
    WHERE u."Status" = 'Active'
      AND u."DoctorDepartmentId" IS NOT NULL
    ORDER BY u."UserId"
    LIMIT 20
  `);
  
  if (doctorsResult.rows.length === 0) {
    console.error('No active doctors found. Please create doctor records first.');
    await db.pool.end();
    process.exit(1);
  }
  
  // Get available patients
  const patientsResult = await db.query(`
    SELECT "PatientId", "PatientNo", "PatientName" 
    FROM "PatientRegistration" 
    WHERE "Status" = 'Active' 
    ORDER BY "PatientId" 
    LIMIT 30
  `);
  
  if (patientsResult.rows.length === 0) {
    console.error('No active patients found. Please create patient records first.');
    await db.pool.end();
    process.exit(1);
  }
  
  console.log('Available Doctors:');
  doctorsResult.rows.forEach((d, i) => {
    console.log(`  ${i + 1}. DoctorId: ${d.UserId}, Name: ${d.UserName}, Department: ${d.DepartmentName || 'N/A'}, OPD: ${d.OPDConsultation || 'N/A'}`);
  });
  
  console.log('\nAvailable Patients:');
  patientsResult.rows.forEach((p, i) => {
    console.log(`  ${i + 1}. PatientId: ${p.PatientId}, PatientNo: ${p.PatientNo}, Name: ${p.PatientName}`);
  });
  console.log('');
  
  // Generate dates for appointments (today, yesterday, tomorrow, and a few more days)
  const today = new Date();
  const dates = [];
  for (let i = -2; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Appointment times
  const appointmentTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', 
    '11:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30'
  ];
  
  // Appointment statuses
  const appointmentStatuses = ['Waiting', 'Consulting', 'Completed'];
  
  // Create appointments - distribute across doctors, dates, and times
  const appointments = [];
  const numAppointments = Math.min(50, patientsResult.rows.length * 2); // Create up to 50 appointments
  
  for (let i = 0; i < numAppointments; i++) {
    const patient = patientsResult.rows[i % patientsResult.rows.length];
    const doctor = doctorsResult.rows[i % doctorsResult.rows.length];
    const appointmentDate = dates[i % dates.length];
    const appointmentTime = appointmentTimes[i % appointmentTimes.length];
    const appointmentStatus = appointmentStatuses[i % appointmentStatuses.length];
    
    // Vary consultation charges
    const consultationCharge = 300 + (Math.floor(Math.random() * 700)); // Between 300 and 1000
    
    appointments.push({
      PatientId: patient.PatientId,
      DoctorId: doctor.UserId,
      AppointmentDate: appointmentDate,
      AppointmentTime: appointmentTime,
      AppointmentStatus: appointmentStatus,
      ConsultationCharge: consultationCharge,
      Diagnosis: appointmentStatus === 'Completed' ? 'General checkup completed. Patient advised to follow up if symptoms persist.' : null,
      ToBeAdmitted: Math.random() > 0.9 ? 'Yes' : 'No', // 10% chance
      Status: 'Active'
    });
  }
  
  console.log(`Creating ${appointments.length} appointments across ${dates.length} dates...\n`);
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];
    try {
      // Generate unique token number
      const tokenNo = await generateTokenNo();
      
      // Check if patient already has an appointment with this doctor on this date
      const existingAppointment = await db.query(
        'SELECT "PatientAppointmentId" FROM "PatientAppointment" WHERE "PatientId" = $1::uuid AND "DoctorId" = $2 AND "AppointmentDate" = $3',
        [appointment.PatientId, appointment.DoctorId, appointment.AppointmentDate]
      );
      
      if (existingAppointment.rows.length > 0) {
        console.log(`⚠ Skipping - Patient ${appointment.PatientId} already has an appointment with doctor ${appointment.DoctorId} on ${appointment.AppointmentDate}`);
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
      console.log(`  Date: ${appointment.AppointmentDate}, Time: ${appointment.AppointmentTime}`);
      console.log(`  Status: ${created.AppointmentStatus}, Charge: ₹${created.ConsultationCharge}`);
      console.log('');
      
      results.push(created);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation (TokenNo)
        console.log(`⚠ Token number conflict for appointment ${i + 1}, retrying...`);
        // Retry with new token
        i--; // Retry this appointment
        continue;
      } else {
        console.error(`✗ Error creating appointment ${i + 1}: ${error.message}`);
        errors.push({ appointment: appointment, error: error.message });
      }
    }
  }
  
  console.log('=== Summary ===');
  console.log(`Total attempted: ${appointments.length}`);
  console.log(`Successfully created: ${results.length} appointment(s)`);
  console.log(`Failed: ${errors.length}`);
  
  if (results.length > 0) {
    console.log('\nCreated Appointments by Date:');
    const appointmentsByDate = {};
    results.forEach((result) => {
      const date = result.AppointmentDate;
      if (!appointmentsByDate[date]) {
        appointmentsByDate[date] = [];
      }
      appointmentsByDate[date].push(result);
    });
    
    Object.keys(appointmentsByDate).sort().forEach(date => {
      console.log(`  ${date}: ${appointmentsByDate[date].length} appointment(s)`);
    });
    
    console.log('\nCreated Appointments by Doctor:');
    const appointmentsByDoctor = {};
    results.forEach((result) => {
      const doctorId = result.DoctorId;
      const doctorName = doctorsResult.rows.find(d => d.UserId === doctorId)?.UserName || 'Unknown';
      if (!appointmentsByDoctor[doctorName]) {
        appointmentsByDoctor[doctorName] = [];
      }
      appointmentsByDoctor[doctorName].push(result);
    });
    
    Object.keys(appointmentsByDoctor).sort().forEach(doctorName => {
      console.log(`  ${doctorName}: ${appointmentsByDoctor[doctorName].length} appointment(s)`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.error}`);
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

