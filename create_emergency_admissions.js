require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample EmergencyAdmission records for registered patients
// Required: DoctorId (integer), PatientId (UUID), EmergencyBedSlotId (integer), EmergencyAdmissionDate (YYYY-MM-DD)
const emergencyAdmissions = [
  {
    DoctorId: 15, // dr.davis
    PatientId: "b7b06427-a484-439f-9566-b5333ea718a9", // Arjun
    EmergencyBedSlotId: 10, // EB_SL_10 (08:00 - 12:00)
    EmergencyAdmissionDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    EmergencyStatus: "Admitted",
    PatientCondition: "Stable",
    Diagnosis: "Acute abdominal pain, requires observation and treatment.",
    TreatementDetails: "Patient admitted to emergency ward. Monitoring vital signs. Administered pain relief medication.",
    TransferToIPD: "No",
    TransferToOT: "No",
    TransferToICU: "No",
    Status: "Active"
  },
  {
    DoctorId: 16, // dr.miller
    PatientId: "5bccd6d7-0acc-4184-9d34-5ec0f940eb00", // Sneha
    EmergencyBedSlotId: 11, // EB_SL_11 (12:00 - 16:00)
    EmergencyAdmissionDate: new Date().toISOString().split('T')[0],
    EmergencyStatus: "Admitted",
    PatientCondition: "Critical",
    Diagnosis: "Severe chest pain, suspected cardiac event.",
    TreatementDetails: "Emergency admission for cardiac monitoring. ECG and blood tests ordered. Critical care protocol initiated.",
    TransferToIPD: "No",
    TransferToOT: "No",
    TransferToICU: "Yes",
    TransferTo: "ICU",
    TransferDetails: "Patient condition requires intensive care monitoring.",
    Status: "Active"
  },
  {
    DoctorId: 17, // dr.wilson
    PatientId: "184ac63a-60dc-4558-8470-b2c2e2a6b817", // Deepak
    EmergencyBedSlotId: 1, // EB_SL_01 (16:00 - 20:00)
    EmergencyAdmissionDate: new Date().toISOString().split('T')[0],
    EmergencyStatus: "Admitted",
    PatientCondition: "Stable",
    Diagnosis: "Fracture in right arm, requires surgical intervention.",
    TreatementDetails: "Emergency admission for fracture treatment. X-ray completed. Surgery scheduled.",
    TransferToIPD: "Yes",
    TransferToOT: "Yes",
    TransferToICU: "No",
    TransferTo: "OT",
    TransferDetails: "Patient to be transferred to OT for fracture repair surgery.",
    Status: "Active"
  },
  {
    DoctorId: 15, // dr.davis
    PatientId: "7e8715e2-d0c6-40be-b658-021f8f128735", // Karan
    EmergencyBedSlotId: 12, // EB_SL_12 (20:00 - 23:59)
    EmergencyAdmissionDate: new Date().toISOString().split('T')[0],
    EmergencyStatus: "Admitted",
    PatientCondition: "Stable",
    Diagnosis: "High fever with respiratory symptoms.",
    TreatementDetails: "Emergency admission for fever management. Blood culture and chest X-ray ordered. Antibiotic therapy initiated.",
    TransferToIPD: "Yes",
    TransferToOT: "No",
    TransferToICU: "No",
    TransferTo: "IPD",
    TransferDetails: "Patient stable, transferred to IPD for continued treatment.",
    Status: "Active"
  },
  {
    DoctorId: 16, // dr.miller
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali
    EmergencyBedSlotId: 13, // EB_SL_13 (06:00 - 08:00)
    EmergencyAdmissionDate: new Date().toISOString().split('T')[0],
    EmergencyStatus: "Admitted",
    PatientCondition: "Stable",
    Diagnosis: "Severe headache and dizziness, neurological evaluation required.",
    TreatementDetails: "Emergency admission for neurological assessment. CT scan ordered. Monitoring for any neurological deficits.",
    TransferToIPD: "No",
    TransferToOT: "No",
    TransferToICU: "No",
    Status: "Active"
  }
];

async function createEmergencyAdmission(admissionData) {
  try {
    const response = await fetch(`${BASE_URL}/api/emergency-admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(admissionData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Emergency Admission:', result.data.EmergencyAdmissionId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Doctor ID:', result.data.DoctorId);
      console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId);
      console.log('  Admission Date:', result.data.EmergencyAdmissionDate);
      console.log('  Emergency Status:', result.data.EmergencyStatus);
      console.log('  Patient Condition:', result.data.PatientCondition);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Emergency Admission:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Emergency Admission:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Emergency Admission records for registered patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/emergency-admissions\n`);
  
  const results = [];
  
  for (let i = 0; i < emergencyAdmissions.length; i++) {
    console.log(`Creating Emergency Admission ${i + 1}/${emergencyAdmissions.length}...`);
    const result = await createEmergencyAdmission(emergencyAdmissions[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < emergencyAdmissions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${emergencyAdmissions.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Emergency Admissions:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.EmergencyAdmissionId}: Patient ${result.PatientId} - Status: ${result.EmergencyStatus} - Condition: ${result.PatientCondition}`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createEmergencyAdmissionLegacy(admissionData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(admissionData);
      const url = new URL(`${BASE_URL}/api/emergency-admissions`);
      
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
              console.log('✓ Created Emergency Admission:', result.data.EmergencyAdmissionId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Doctor ID:', result.data.DoctorId);
              console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId);
              console.log('  Admission Date:', result.data.EmergencyAdmissionDate);
              console.log('  Emergency Status:', result.data.EmergencyStatus);
              console.log('  Patient Condition:', result.data.PatientCondition);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Emergency Admission:', result.message);
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
        console.error('✗ Error creating Emergency Admission:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Emergency Admission records for registered patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/emergency-admissions\n`);
    
    const results = [];
    
    for (let i = 0; i < emergencyAdmissions.length; i++) {
      console.log(`Creating Emergency Admission ${i + 1}/${emergencyAdmissions.length}...`);
      const result = await createEmergencyAdmissionLegacy(emergencyAdmissions[i]);
      results.push(result);
      
      if (i < emergencyAdmissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${emergencyAdmissions.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Emergency Admissions:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.EmergencyAdmissionId}: Patient ${result.PatientId} - Status: ${result.EmergencyStatus} - Condition: ${result.PatientCondition}`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

