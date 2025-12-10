require('dotenv').config();
const db = require('./db');
const { randomUUID } = require('crypto');

// Function to get existing PatientICUAdmission records
async function getExistingICUAdmissions() {
  try {
    const query = `
      SELECT 
        pica."PatientICUAdmissionId",
        pica."PatientId",
        pica."ICUAllocationFromDate",
        pica."ICUAllocationToDate",
        pica."ICUPatientStatus",
        pica."PatientCondition",
        p."PatientName",
        p."PatientNo"
      FROM "PatientICUAdmission" pica
      INNER JOIN "PatientRegistration" p ON pica."PatientId" = p."PatientId"
      WHERE pica."Status" = 'Active'
        AND pica."ICUAdmissionStatus" = 'Occupied'
      ORDER BY pica."ICUAllocationFromDate" DESC
      LIMIT 10
    `;
    
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching ICU admissions:', error.message);
    throw error;
  }
}

// Function to get available doctors (Users with ICUVisits = 'Yes' or any active doctors)
async function getAvailableDoctors() {
  try {
    const query = `
      SELECT 
        u."UserId",
        u."UserName",
        u."ICUVisits"
      FROM "Users" u
      WHERE u."Status" = 'Active'
        AND (u."ICUVisits" = 'Yes' OR u."DoctorDepartmentId" IS NOT NULL)
      ORDER BY u."UserId"
      LIMIT 20
    `;
    
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching doctors:', error.message);
    throw error;
  }
}

// Function to create ICU doctor visit record
async function createICUDoctorVisit(visitData) {
  try {
    const icuDoctorVisitsId = randomUUID();
    
    // Note: PatientId in ICUDoctorVisits is UUID, but the controller expects it as a number
    // However, based on the schema, PatientId is UUID. We'll use the UUID directly.
    const insertQuery = `
      INSERT INTO "ICUDoctorVisits"
        ("ICUDoctorVisitsId", "ICUAdmissionId", "PatientId", "DoctorId", "DoctorVisitedDateTime",
         "VisitsDetails", "PatientCondition", "Status", "VisitCreatedBy")
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::timestamp, $6, $7, $8, $9)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      icuDoctorVisitsId,
      visitData.ICUAdmissionId,
      visitData.PatientId,
      visitData.DoctorId,
      visitData.DoctorVisitedDateTime,
      visitData.VisitsDetails || null,
      visitData.PatientCondition || null,
      visitData.Status || 'Active',
      visitData.VisitCreatedBy || null,
    ]);

    return rows[0];
  } catch (error) {
    console.error('Error creating ICU doctor visit:', error.message);
    throw error;
  }
}

// Sample visit details templates
const visitDetailsTemplates = [
  "Morning rounds completed. Patient condition reviewed. Vital signs stable. Medication adjusted as per response.",
  "Afternoon follow-up visit. Patient progress satisfactory. Monitoring continues. No immediate concerns.",
  "Evening rounds. Patient condition stable. Treatment plan reviewed. Continue current medication regimen.",
  "Initial assessment completed. Patient admitted to ICU. Baseline vitals recorded. Treatment plan initiated.",
  "Routine check-up. Patient responding well to treatment. Recovery progressing as expected.",
  "Critical care review. Patient condition monitored closely. Adjustments made to treatment protocol.",
  "Post-operative ICU visit. Patient stable post-surgery. Monitoring recovery. Pain management effective.",
  "Follow-up visit. Patient condition improving. Continue current treatment plan. Next review scheduled.",
];

const patientConditionTemplates = [
  "Stable, responding well to treatment",
  "Stable, under close observation",
  "Stable, improving",
  "Critical, requires continuous monitoring",
  "Serious, condition being closely watched",
  "Stable, post-operative recovery",
  "Stable, treatment progressing as expected",
  "Stable, vital signs normal",
];

// Main function
async function main() {
  console.log('Creating ICU Doctor Visits records for existing PatientICUAdmission records...\n');

  try {
    // Get existing ICU admissions
    console.log('Fetching existing PatientICUAdmission records...');
    const admissions = await getExistingICUAdmissions();
    
    if (admissions.length === 0) {
      console.log('No active ICU admissions found. Please create some PatientICUAdmission records first.');
      return;
    }
    
    console.log(`Found ${admissions.length} active ICU admission(s).\n`);

    // Get available doctors
    console.log('Fetching available doctors...');
    const doctors = await getAvailableDoctors();
    
    if (doctors.length === 0) {
      console.log('No available doctors found. Please ensure there are active doctors in the system.');
      return;
    }
    
    console.log(`Found ${doctors.length} available doctor(s).\n`);

    // Create visit records
    const visitRecords = [];
    const now = new Date();
    
    // Create 2-3 visits per admission
    for (let i = 0; i < admissions.length; i++) {
      const admission = admissions[i];
      const numVisits = Math.floor(Math.random() * 2) + 2; // 2-3 visits per admission
      
      for (let j = 0; j < numVisits; j++) {
        // Select a random doctor
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        
        // Calculate visit datetime (spread over the admission period or recent dates)
        let visitDateTime;
        if (admission.ICUAllocationFromDate) {
          const fromDate = new Date(admission.ICUAllocationFromDate);
          const toDate = admission.ICUAllocationToDate 
            ? new Date(admission.ICUAllocationToDate) 
            : new Date();
          
          // Random date between fromDate and toDate (or now if toDate is in future)
          const maxDate = toDate > now ? now : toDate;
          const timeDiff = maxDate.getTime() - fromDate.getTime();
          const randomTime = fromDate.getTime() + Math.random() * timeDiff;
          visitDateTime = new Date(randomTime);
        } else {
          // If no fromDate, use recent dates
          const hoursAgo = Math.floor(Math.random() * 72); // Last 72 hours
          visitDateTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        }
        
        // Select random visit details and condition
        const visitDetails = visitDetailsTemplates[Math.floor(Math.random() * visitDetailsTemplates.length)];
        const patientCondition = patientConditionTemplates[Math.floor(Math.random() * patientConditionTemplates.length)];
        
        const visitData = {
          ICUAdmissionId: admission.PatientICUAdmissionId,
          PatientId: admission.PatientId,
          DoctorId: doctor.UserId,
          DoctorVisitedDateTime: visitDateTime.toISOString().slice(0, 19).replace('T', ' '),
          VisitsDetails: visitDetails,
          PatientCondition: patientCondition || admission.PatientCondition || null,
          Status: 'Active',
          VisitCreatedBy: null, // Can be set to a user ID if needed
        };
        
        visitRecords.push(visitData);
      }
    }

    console.log(`Creating ${visitRecords.length} ICU doctor visit record(s)...\n`);

    const results = [];
    for (let i = 0; i < visitRecords.length; i++) {
      const visitData = visitRecords[i];
      try {
        const result = await createICUDoctorVisit(visitData);
        results.push({ success: true, data: result });
        
        const admission = admissions.find(a => a.PatientICUAdmissionId === visitData.ICUAdmissionId);
        const doctor = doctors.find(d => d.UserId === visitData.DoctorId);
        
        console.log(`✓ Created ICU Doctor Visit ${i + 1}/${visitRecords.length}:`);
        console.log(`  Visit ID: ${result.ICUDoctorVisitsId}`);
        console.log(`  Patient: ${admission?.PatientName || 'N/A'} (${admission?.PatientNo || 'N/A'})`);
        console.log(`  Doctor: ${doctor?.UserName || 'N/A'} (ID: ${visitData.DoctorId})`);
        console.log(`  Visit DateTime: ${visitData.DoctorVisitedDateTime}`);
        console.log(`  Patient Condition: ${visitData.PatientCondition || 'N/A'}`);
        console.log('');
      } catch (error) {
        results.push({ success: false, error: error.message });
        console.error(`✗ Failed to create ICU Doctor Visit ${i + 1}/${visitRecords.length}:`, error.message);
        console.log('');
      }
      
      // Small delay between inserts
      if (i < visitRecords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log('\n=== Summary ===');
    console.log(`Total: ${visitRecords.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    if (successCount > 0) {
      console.log('\nSuccessfully created ICU Doctor Visits:');
      results.forEach((result, index) => {
        if (result.success) {
          console.log(`  ${index + 1}. Visit ID: ${result.data.ICUDoctorVisitsId}`);
        }
      });
    }

  } catch (error) {
    console.error('Error in main function:', error.message);
    console.error(error.stack);
  } finally {
    // Close database connection
    await db.pool.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
main().catch(console.error);

