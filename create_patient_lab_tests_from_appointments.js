require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientLabTest records for PatientAppointment (OPD) patients
// Required: PatientType ('OPD'), PatientId (UUID), LabTestId (integer), AppointmentId (integer)
const patientLabTests = [
  {
    PatientType: "OPD",
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera - from PatientAppointment ID 19
    LabTestId: 12, // ECG
    AppointmentId: 19,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera - from PatientAppointment ID 19
    LabTestId: 15, // Urine Routine
    AppointmentId: 19,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram - from PatientAppointment ID 20
    LabTestId: 13, // Echocardiography
    AppointmentId: 20,
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram - from PatientAppointment ID 20
    LabTestId: 12, // ECG
    AppointmentId: 20,
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit - from PatientAppointment ID 10
    LabTestId: 18, // Ultrasound Abdomen
    AppointmentId: 10,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit - from PatientAppointment ID 10
    LabTestId: 16, // Urine Culture
    AppointmentId: 10,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya - from PatientAppointment ID 11
    LabTestId: 19, // Ultrasound Pelvis
    AppointmentId: 11,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya - from PatientAppointment ID 11
    LabTestId: 17, // Urine Microscopy
    AppointmentId: 11,
    Priority: "Normal",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "f7b276b9-b8e4-4dbc-b628-353bdd66c0bf", // Rajesh - from PatientAppointment ID 12
    LabTestId: 14, // Doppler Study
    AppointmentId: 12,
    Priority: "High",
    LabTestDone: "No",
    TestStatus: "Pending",
    Status: "Active"
  },
  {
    PatientType: "OPD",
    PatientId: "f7b276b9-b8e4-4dbc-b628-353bdd66c0bf", // Rajesh - from PatientAppointment ID 12
    LabTestId: 20, // Transvaginal Ultrasound
    AppointmentId: 12,
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
      console.log('  Appointment ID:', result.data.AppointmentId || 'N/A');
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
  console.log('Creating Patient Lab Test records for PatientAppointment (OPD) patients...\n');
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
        console.log(`  ${index + 1}. ID ${result.PatientLabTestsId}: Patient ${result.PatientId} - Appointment ${result.AppointmentId || 'N/A'} - Lab Test ${result.LabTestId} (${result.TestStatus})`);
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
              console.log('  Appointment ID:', result.data.AppointmentId || 'N/A');
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
    console.log('Creating Patient Lab Test records for PatientAppointment (OPD) patients...\n');
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
          console.log(`  ${index + 1}. ID ${result.PatientLabTestsId}: Patient ${result.PatientId} - Appointment ${result.AppointmentId || 'N/A'} - Lab Test ${result.LabTestId} (${result.TestStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

