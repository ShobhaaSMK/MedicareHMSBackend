require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientICUAdmission records for EmergencyAdmission (Emergency) patients
// Required: PatientId (UUID), EmergencyBedSlotId (integer), ICUId (integer), ICUAllocationFromDate (YYYY-MM-DD)
const patientICUAdmissions = [
  {
    PatientId: "b7b06427-a484-439f-9566-b5333ea718a9", // Arjun - from EmergencyAdmission ID 1
    EmergencyBedSlotId: 10, // Link to EmergencyBedSlot from EmergencyAdmission
    ICUId: 1, // ICU-001 General ICU
    ICUPatientStatus: "Critical",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null, // Ongoing
    NumberOfDays: null,
    Diagnosis: "Patient transferred from Emergency ward to ICU due to critical condition. Requires intensive monitoring and care.",
    TreatementDetails: "Emergency to ICU transfer. Critical care protocol initiated. Continuous monitoring. Ventilator support if needed.",
    PatientCondition: "Critical condition requiring intensive care after emergency admission",
    Status: "Active"
  },
  {
    PatientId: "5bccd6d7-0acc-4184-9d34-5ec0f940eb00", // Sneha - from EmergencyAdmission ID 2
    EmergencyBedSlotId: 11,
    ICUId: 2, // ICU-002 General ICU
    ICUPatientStatus: "Critical",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Severe cardiac event. Patient condition deteriorated in emergency ward, transferred to ICU for specialized cardiac care.",
    TreatementDetails: "Emergency to ICU transfer for cardiac care. Cardiac monitoring. Medication adjustments. Continuous ECG monitoring.",
    PatientCondition: "Critical cardiac condition requiring intensive care",
    Status: "Active"
  },
  {
    PatientId: "184ac63a-60dc-4558-8470-b2c2e2a6b817", // Deepak - from EmergencyAdmission ID 3
    EmergencyBedSlotId: 1,
    ICUId: 6, // ICU-006 Neuro ICU
    ICUPatientStatus: "Serious",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Fracture complications. Patient transferred from emergency to ICU for pre-surgical stabilization and monitoring.",
    TreatementDetails: "Emergency to ICU transfer. Pre-surgical monitoring. Pain management. Preparation for surgical intervention.",
    PatientCondition: "Serious condition requiring intensive monitoring before surgery",
    Status: "Active"
  },
  {
    PatientId: "7e8715e2-d0c6-40be-b658-021f8f128735", // Karan - from EmergencyAdmission ID 4
    EmergencyBedSlotId: 12,
    ICUId: 3, // ICU-003 Cardiac ICU
    ICUPatientStatus: "Serious",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Respiratory complications with fever. Patient condition worsened in emergency, requires ICU care for respiratory support.",
    TreatementDetails: "Emergency to ICU transfer. Respiratory support. Oxygen therapy. Continuous vital signs monitoring. Antibiotic therapy.",
    PatientCondition: "Serious respiratory condition requiring intensive care",
    Status: "Active"
  },
  {
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali - from EmergencyAdmission ID 5
    EmergencyBedSlotId: 13,
    ICUId: 5, // ICU-005 Neuro ICU
    ICUPatientStatus: "Stable",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Neurological symptoms. Patient transferred from emergency to ICU for neurological evaluation and monitoring.",
    TreatementDetails: "Emergency to ICU transfer for neurological assessment. Neurological monitoring. CT scan ordered. Medication protocol.",
    PatientCondition: "Stable, requires neurological monitoring",
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
      console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId || 'N/A');
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
  console.log('Creating Patient ICU Admission records for EmergencyAdmission (Emergency) patients...\n');
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
        console.log(`  ${index + 1}. ID ${result.PatientICUAdmissionId}: Patient ${result.PatientId} - Emergency Bed Slot ${result.EmergencyBedSlotId || 'N/A'} - ICU ${result.ICUId} (${result.ICUPatientStatus})`);
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
              console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId || 'N/A');
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
    console.log('Creating Patient ICU Admission records for EmergencyAdmission (Emergency) patients...\n');
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
          console.log(`  ${index + 1}. ID ${result.PatientICUAdmissionId}: Patient ${result.PatientId} - Emergency Bed Slot ${result.EmergencyBedSlotId || 'N/A'} - ICU ${result.ICUId} (${result.ICUPatientStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

