require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientICUAdmission records for RoomAdmission (IPD) patients
// Required: PatientId (UUID), ICUId (integer), ICUAllocationFromDate (YYYY-MM-DD)
const patientICUAdmissions = [
  {
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit - from RoomAdmission ID 6
    RoomAdmissionId: 6, // Link to RoomAdmission
    ICUId: 6, // Neuro ICU
    ICUPatientStatus: "Critical",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null, // Ongoing
    NumberOfDays: null,
    Diagnosis: "Patient transferred from IPD to ICU due to deteriorating neurological condition. Requires intensive monitoring.",
    TreatementDetails: "Continuous neurological monitoring. Ventilator support. Medication adjustments for neurological symptoms.",
    PatientCondition: "Critical neurological condition requiring intensive care",
    Status: "Active"
  },
  {
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya - from RoomAdmission ID 7
    RoomAdmissionId: 7,
    ICUId: 7, // NICU-001
    ICUPatientStatus: "Serious",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Post-operative complications. Patient transferred from IPD to ICU for specialized care.",
    TreatementDetails: "Post-surgical monitoring. Wound care management. Pain management protocol.",
    PatientCondition: "Post-operative recovery with complications",
    Status: "Active"
  },
  {
    PatientId: "f7b276b9-b8e4-4dbc-b628-353bdd66c0bf", // Rajesh - from RoomAdmission ID 8
    RoomAdmissionId: 8,
    ICUId: 8, // NICU-002
    ICUPatientStatus: "Stable",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Pre-operative preparation. Patient moved to ICU for pre-surgery monitoring and stabilization.",
    TreatementDetails: "Pre-operative assessment and stabilization. Vital signs monitoring. Preparation for scheduled surgery.",
    PatientCondition: "Stable, pre-operative preparation",
    Status: "Active"
  },
  {
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera - from RoomAdmission ID 9
    RoomAdmissionId: 9,
    ICUId: 9, // SICU-001
    ICUPatientStatus: "Serious",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Respiratory distress. Patient condition worsened in IPD, transferred to ICU for intensive respiratory support.",
    TreatementDetails: "Respiratory support and monitoring. Oxygen therapy. Continuous vital signs monitoring.",
    PatientCondition: "Respiratory distress requiring intensive care",
    Status: "Active"
  },
  {
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram - from RoomAdmission ID 10
    RoomAdmissionId: 10,
    ICUId: 10, // SICU-002
    ICUPatientStatus: "Critical",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Cardiac complications. Patient transferred from IPD to ICU due to cardiac instability.",
    TreatementDetails: "Cardiac monitoring and support. Medication adjustments. Continuous ECG monitoring.",
    PatientCondition: "Critical cardiac condition",
    Status: "Active"
  }
];

async function createPatientICUAdmission(admissionData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-icu-admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(admissionData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient ICU Admission:', result.data.PatientICUAdmissionId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Room Admission ID:', result.data.RoomAdmissionId || 'N/A');
      console.log('  ICU ID:', result.data.ICUId);
      console.log('  ICU Patient Status:', result.data.ICUPatientStatus);
      console.log('  Allocation From Date:', result.data.ICUAllocationFromDate);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient ICU Admission:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient ICU Admission:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient ICU Admission records for RoomAdmission (IPD) patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-icu-admissions\n`);
  
  const results = [];
  
  for (let i = 0; i < patientICUAdmissions.length; i++) {
    console.log(`Creating Patient ICU Admission ${i + 1}/${patientICUAdmissions.length}...`);
    const result = await createPatientICUAdmission(patientICUAdmissions[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < patientICUAdmissions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${patientICUAdmissions.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient ICU Admissions:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientICUAdmissionId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - ICU ${result.ICUId} (${result.ICUPatientStatus})`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createPatientICUAdmissionLegacy(admissionData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(admissionData);
      const url = new URL(`${BASE_URL}/api/patient-icu-admissions`);
      
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
              console.log('✓ Created Patient ICU Admission:', result.data.PatientICUAdmissionId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Room Admission ID:', result.data.RoomAdmissionId || 'N/A');
              console.log('  ICU ID:', result.data.ICUId);
              console.log('  ICU Patient Status:', result.data.ICUPatientStatus);
              console.log('  Allocation From Date:', result.data.ICUAllocationFromDate);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient ICU Admission:', result.message);
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
        console.error('✗ Error creating Patient ICU Admission:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient ICU Admission records for RoomAdmission (IPD) patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-icu-admissions\n`);
    
    const results = [];
    
    for (let i = 0; i < patientICUAdmissions.length; i++) {
      console.log(`Creating Patient ICU Admission ${i + 1}/${patientICUAdmissions.length}...`);
      const result = await createPatientICUAdmissionLegacy(patientICUAdmissions[i]);
      results.push(result);
      
      if (i < patientICUAdmissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${patientICUAdmissions.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient ICU Admissions:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientICUAdmissionId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - ICU ${result.ICUId} (${result.ICUPatientStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

