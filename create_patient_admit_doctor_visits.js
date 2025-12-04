require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientAdmitDoctorVisits records for RoomAdmission (IPD) patients
// Required: RoomAdmissionId (integer), PatientId (UUID), DoctorId (integer), DoctorVisitedDateTime (YYYY-MM-DD HH:MM:SS)
const patientAdmitDoctorVisits = [
  {
    RoomAdmissionId: 7, // Priya - RoomAdmission ID 7
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya
    DoctorId: 15, // dr.davis
    DoctorVisitedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '), // Current date and time
    VisitsRemarks: "Morning rounds. Patient condition stable. Reviewed lab reports. Medication adjusted as per response.",
    PatientCondition: "Stable, responding well to treatment",
    Status: "Active"
  },
  {
    RoomAdmissionId: 7, // Priya - RoomAdmission ID 7 (second visit)
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya
    DoctorId: 16, // dr.miller
    DoctorVisitedDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // 4 hours later
    VisitsRemarks: "Afternoon follow-up visit. Patient progress satisfactory. Vital signs normal. Continue current treatment plan.",
    PatientCondition: "Stable, improving",
    Status: "Active"
  },
  {
    RoomAdmissionId: 10, // Vikram - RoomAdmission ID 10
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram
    DoctorId: 16, // dr.miller
    DoctorVisitedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    VisitsRemarks: "Initial visit after admission. Patient condition requires monitoring. Cardiac assessment completed.",
    PatientCondition: "Stable, under observation",
    Status: "Active"
  },
  {
    RoomAdmissionId: 9, // Meera - RoomAdmission ID 9
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera
    DoctorId: 17, // dr.wilson
    DoctorVisitedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    VisitsRemarks: "Routine visit. Patient recovering well. Wound healing progressing. No complications observed.",
    PatientCondition: "Stable, recovering",
    Status: "Active"
  },
  {
    RoomAdmissionId: 6, // Amit - RoomAdmission ID 6
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit
    DoctorId: 15, // dr.davis
    DoctorVisitedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    VisitsRemarks: "Post-operative visit. Patient stable post-surgery. Monitoring recovery. Pain management effective.",
    PatientCondition: "Stable, post-operative recovery",
    Status: "Active"
  },
  {
    RoomAdmissionId: 5, // Anjali - RoomAdmission ID 5
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali
    DoctorId: 16, // dr.miller
    DoctorVisitedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    VisitsRemarks: "Regular check-up. Patient condition stable. Treatment plan reviewed and adjusted. Patient responding well.",
    PatientCondition: "Stable, improving",
    Status: "Active"
  }
];

async function createPatientAdmitDoctorVisit(visitData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-admit-doctor-visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient Admit Doctor Visit:', result.data.PatientAdmitDoctorVisitsId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Doctor ID:', result.data.DoctorId);
      console.log('  Visit DateTime:', result.data.DoctorVisitedDateTime);
      console.log('  Patient Condition:', result.data.PatientCondition);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient Admit Doctor Visit:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient Admit Doctor Visit:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient Admit Doctor Visits records for RoomAdmission (IPD) patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-admit-doctor-visits\n`);
  
  const results = [];
  
  for (let i = 0; i < patientAdmitDoctorVisits.length; i++) {
    console.log(`Creating Patient Admit Doctor Visit ${i + 1}/${patientAdmitDoctorVisits.length}...`);
    const result = await createPatientAdmitDoctorVisit(patientAdmitDoctorVisits[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < patientAdmitDoctorVisits.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${patientAdmitDoctorVisits.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient Admit Doctor Visits:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientAdmitDoctorVisitsId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - Doctor ${result.DoctorId}`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createPatientAdmitDoctorVisitLegacy(visitData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(visitData);
      const url = new URL(`${BASE_URL}/api/patient-admit-doctor-visits`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };
      
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('✓ Created Patient Admit Doctor Visit:', result.data.PatientAdmitDoctorVisitsId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Doctor ID:', result.data.DoctorId);
              console.log('  Visit DateTime:', result.data.DoctorVisitedDateTime);
              console.log('  Patient Condition:', result.data.PatientCondition);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient Admit Doctor Visit:', result.message);
              if (result.error) {
                console.error('  Error:', result.error);
              }
              console.log('');
              resolve(null);
            }
          } catch (error) {
            console.error('✗ Error parsing response:', error.message);
            console.log('');
            resolve(null);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('✗ Error creating Patient Admit Doctor Visit:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient Admit Doctor Visits records for RoomAdmission (IPD) patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-admit-doctor-visits\n`);
    
    const results = [];
    
    for (let i = 0; i < patientAdmitDoctorVisits.length; i++) {
      console.log(`Creating Patient Admit Doctor Visit ${i + 1}/${patientAdmitDoctorVisits.length}...`);
      const result = await createPatientAdmitDoctorVisitLegacy(patientAdmitDoctorVisits[i]);
      results.push(result);
      
      if (i < patientAdmitDoctorVisits.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${patientAdmitDoctorVisits.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient Admit Doctor Visits:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientAdmitDoctorVisitsId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - Doctor ${result.DoctorId}`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

