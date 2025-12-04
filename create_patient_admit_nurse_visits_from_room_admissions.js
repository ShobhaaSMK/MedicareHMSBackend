require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientAdmitNurseVisits records for RoomAdmission (IPD) patients
// Required: RoomAdmissionId (integer), PatientId (UUID), VisitDate (YYYY-MM-DD)
const patientAdmitNurseVisits = [
  {
    RoomAdmissionId: 7, // Priya - RoomAdmission ID 7
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: "08:00:00",
    PatientStatus: "Stable",
    SupervisionDetails: "Morning nursing rounds. Patient awake and alert. Administered medications as scheduled.",
    Remarks: "Patient comfortable. No complaints. Vital signs within normal range.",
    Status: "Active"
  },
  {
    RoomAdmissionId: 7, // Priya - RoomAdmission ID 7 (afternoon visit)
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: "14:00:00",
    PatientStatus: "Stable",
    SupervisionDetails: "Afternoon check. Patient resting comfortably. Wound dressing checked and changed.",
    Remarks: "Patient condition stable. Appetite good. No signs of infection.",
    Status: "Active"
  },
  {
    RoomAdmissionId: 10, // Vikram - RoomAdmission ID 10
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: "09:00:00",
    PatientStatus: "Stable",
    SupervisionDetails: "Morning assessment. Patient stable. Cardiac monitoring continued. Medications administered.",
    Remarks: "Patient responding well to treatment. No cardiac events observed.",
    Status: "Active"
  },
  {
    RoomAdmissionId: 9, // Meera - RoomAdmission ID 9
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: "10:00:00",
    PatientStatus: "Stable",
    SupervisionDetails: "Post-operative care. Wound site inspected. Drainage checked. Patient mobilizing well.",
    Remarks: "Recovery progressing as expected. Pain well controlled.",
    Status: "Active"
  },
  {
    RoomAdmissionId: 6, // Amit - RoomAdmission ID 6
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: "11:00:00",
    PatientStatus: "Stable",
    SupervisionDetails: "Routine nursing care. Patient stable. IV fluids monitored. Medications given on time.",
    Remarks: "Patient comfortable. Family informed of progress.",
    Status: "Active"
  },
  {
    RoomAdmissionId: 5, // Anjali - RoomAdmission ID 5
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: "12:00:00",
    PatientStatus: "Stable",
    SupervisionDetails: "Midday assessment. Patient stable. All vital parameters within normal limits.",
    Remarks: "Patient cooperative. Treatment plan followed. No concerns.",
    Status: "Active"
  }
];

async function createPatientAdmitNurseVisit(visitData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-admit-nurse-visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient Admit Nurse Visit:', result.data.PatientAdmitNurseVisitsId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Room Admission ID:', result.data.RoomAdmissionId || 'N/A');
      console.log('  Visit Date:', result.data.VisitDate);
      console.log('  Visit Time:', result.data.VisitTime);
      console.log('  Patient Status:', result.data.PatientStatus);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient Admit Nurse Visit:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient Admit Nurse Visit:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient Admit Nurse Visits records for RoomAdmission (IPD) patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-admit-nurse-visits\n`);
  
  const results = [];
  
  for (let i = 0; i < patientAdmitNurseVisits.length; i++) {
    console.log(`Creating Patient Admit Nurse Visit ${i + 1}/${patientAdmitNurseVisits.length}...`);
    const result = await createPatientAdmitNurseVisit(patientAdmitNurseVisits[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < patientAdmitNurseVisits.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${patientAdmitNurseVisits.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient Admit Nurse Visits:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientAdmitNurseVisitsId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - Visit Date ${result.VisitDate}`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createPatientAdmitNurseVisitLegacy(visitData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(visitData);
      const url = new URL(`${BASE_URL}/api/patient-admit-nurse-visits`);
      
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
              console.log('✓ Created Patient Admit Nurse Visit:', result.data.PatientAdmitNurseVisitsId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Room Admission ID:', result.data.RoomAdmissionId || 'N/A');
              console.log('  Visit Date:', result.data.VisitDate);
              console.log('  Visit Time:', result.data.VisitTime);
              console.log('  Patient Status:', result.data.PatientStatus);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient Admit Nurse Visit:', result.message);
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
        console.error('✗ Error creating Patient Admit Nurse Visit:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient Admit Nurse Visits records for RoomAdmission (IPD) patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-admit-nurse-visits\n`);
    
    const results = [];
    
    for (let i = 0; i < patientAdmitNurseVisits.length; i++) {
      console.log(`Creating Patient Admit Nurse Visit ${i + 1}/${patientAdmitNurseVisits.length}...`);
      const result = await createPatientAdmitNurseVisitLegacy(patientAdmitNurseVisits[i]);
      results.push(result);
      
      if (i < patientAdmitNurseVisits.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${patientAdmitNurseVisits.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient Admit Nurse Visits:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientAdmitNurseVisitsId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - Visit Date ${result.VisitDate}`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

