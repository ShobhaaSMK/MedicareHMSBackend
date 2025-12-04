require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientLabTest records for EmergencyAdmission (Emergency) patients
// Required: PatientType ('Emergency'), PatientId (UUID), LabTestId (integer), EmergencyBedSlotId (integer)
const patientLabTests = [
  {
    PatientType: "Emergency",
    PatientId: "b7b06427-a484-439f-9566-b5333ea718a9", // Arjun - from EmergencyAdmission ID 1
    LabTestId: 12, // ECG
    EmergencyBedSlotId: 10, // Link to EmergencyBedSlot from EmergencyAdmission
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "b7b06427-a484-439f-9566-b5333ea718a9", // Arjun - from EmergencyAdmission ID 1
    LabTestId: 15, // Urine Routine
    EmergencyBedSlotId: 10,
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "5bccd6d7-0acc-4184-9d34-5ec0f940eb00", // Sneha - from EmergencyAdmission ID 2
    LabTestId: 13, // Echocardiography
    EmergencyBedSlotId: 11,
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "5bccd6d7-0acc-4184-9d34-5ec0f940eb00", // Sneha - from EmergencyAdmission ID 2
    LabTestId: 12, // ECG
    EmergencyBedSlotId: 11,
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "184ac63a-60dc-4558-8470-b2c2e2a6b817", // Deepak - from EmergencyAdmission ID 3
    LabTestId: 18, // Ultrasound Abdomen
    EmergencyBedSlotId: 1,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "184ac63a-60dc-4558-8470-b2c2e2a6b817", // Deepak - from EmergencyAdmission ID 3
    LabTestId: 14, // Doppler Study
    EmergencyBedSlotId: 1,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "7e8715e2-d0c6-40be-b658-021f8f128735", // Karan - from EmergencyAdmission ID 4
    LabTestId: 16, // Urine Culture
    EmergencyBedSlotId: 12,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "7e8715e2-d0c6-40be-b658-021f8f128735", // Karan - from EmergencyAdmission ID 4
    LabTestId: 17, // Urine Microscopy
    EmergencyBedSlotId: 12,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali - from EmergencyAdmission ID 5
    LabTestId: 19, // Ultrasound Pelvis
    EmergencyBedSlotId: 13,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "Emergency",
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali - from EmergencyAdmission ID 5
    LabTestId: 20, // Transvaginal Ultrasound
    EmergencyBedSlotId: 13,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  }
];

async function createPatientLabTest(labTestData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-lab-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labTestData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient Lab Test:', result.data.PatientLabTestsId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId || 'N/A');
      console.log('  Lab Test ID:', result.data.LabTestId);
      console.log('  Test Status:', result.data.TestStatus);
      console.log('  Priority:', result.data.Priority);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient Lab Test:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient Lab Test:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient Lab Test records for EmergencyAdmission (Emergency) patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-lab-tests\n`);
  
  const results = [];
  
  for (let i = 0; i < patientLabTests.length; i++) {
    console.log(`Creating Patient Lab Test ${i + 1}/${patientLabTests.length}...`);
    const result = await createPatientLabTest(patientLabTests[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < patientLabTests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${patientLabTests.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient Lab Tests:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientLabTestsId}: Patient ${result.PatientId} - Emergency Bed Slot ${result.EmergencyBedSlotId || 'N/A'} - Lab Test ${result.LabTestId} (${result.TestStatus})`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createPatientLabTestLegacy(labTestData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(labTestData);
      const url = new URL(`${BASE_URL}/api/patient-lab-tests`);
      
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
              console.log('✓ Created Patient Lab Test:', result.data.PatientLabTestsId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId || 'N/A');
              console.log('  Lab Test ID:', result.data.LabTestId);
              console.log('  Test Status:', result.data.TestStatus);
              console.log('  Priority:', result.data.Priority);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient Lab Test:', result.message);
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
        console.error('✗ Error creating Patient Lab Test:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient Lab Test records for EmergencyAdmission (Emergency) patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-lab-tests\n`);
    
    const results = [];
    
    for (let i = 0; i < patientLabTests.length; i++) {
      console.log(`Creating Patient Lab Test ${i + 1}/${patientLabTests.length}...`);
      const result = await createPatientLabTestLegacy(patientLabTests[i]);
      results.push(result);
      
      if (i < patientLabTests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${patientLabTests.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient Lab Tests:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientLabTestsId}: Patient ${result.PatientId} - Emergency Bed Slot ${result.EmergencyBedSlotId || 'N/A'} - Lab Test ${result.LabTestId} (${result.TestStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

