require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientOTAllocation records for PatientAppointment (OPD) patients
// Required: PatientId (UUID), OTId (integer), LeadSurgeonId (integer), OTAllocationDate (YYYY-MM-DD)
const patientOTAllocations = [
  {
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera - from PatientAppointment ID 19
    PatientAppointmentId: 19, // Link to PatientAppointment (OPD)
    OTId: 1, // OT-001 General Surgery
    LeadSurgeonId: 15, // dr.davis
    AssistantDoctorId: 16, // dr.miller
    OTAllocationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    OTStartTime: "09:00:00",
    OTEndTime: "11:00:00",
    Duration: "2 hours",
    OperationDescription: "Laparoscopic cholecystectomy for OPD patient. Patient scheduled for surgery after consultation.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Patient requires pre-operative assessment. Fasting required from midnight before surgery.",
    Status: "Active"
  },
  {
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram - from PatientAppointment ID 20
    PatientAppointmentId: 20,
    OTId: 3, // OT-003 Cardiac Surgery
    LeadSurgeonId: 16, // dr.miller
    AssistantDoctorId: 17, // dr.wilson
    OTAllocationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
    OTStartTime: "10:00:00",
    OTEndTime: "13:00:00",
    Duration: "3 hours",
    OperationDescription: "Cardiac catheterization procedure. Patient scheduled for cardiac intervention after OPD consultation.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Cardiac assessment completed. Patient stable for procedure. Pre-operative cardiac medications to continue.",
    Status: "Active"
  },
  {
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit - from PatientAppointment ID 10
    PatientAppointmentId: 10,
    OTId: 4, // OT-004 Orthopedic Surgery
    LeadSurgeonId: 17, // dr.wilson
    AssistantDoctorId: 15, // dr.davis
    OTAllocationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    OTStartTime: "14:00:00",
    OTEndTime: "16:00:00",
    Duration: "2 hours",
    OperationDescription: "Arthroscopic knee surgery. Patient requires surgical intervention for knee condition identified during OPD visit.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Orthopedic assessment completed. X-ray and MRI reviewed. Patient prepared for arthroscopic procedure.",
    Status: "Active"
  }
];

async function createPatientOTAllocation(allocationData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-ot-allocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(allocationData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient OT Allocation:', result.data.PatientOTAllocationId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Patient Appointment ID:', result.data.PatientAppointmentId || 'N/A');
      console.log('  OT ID:', result.data.OTId);
      console.log('  Lead Surgeon ID:', result.data.LeadSurgeonId);
      console.log('  OT Allocation Date:', result.data.OTAllocationDate);
      console.log('  Operation Status:', result.data.OperationStatus);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient OT Allocation:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient OT Allocation:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient OT Allocation records for PatientAppointment (OPD) patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-ot-allocations\n`);
  
  const results = [];
  
  for (let i = 0; i < patientOTAllocations.length; i++) {
    console.log(`Creating Patient OT Allocation ${i + 1}/${patientOTAllocations.length}...`);
    const result = await createPatientOTAllocation(patientOTAllocations[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < patientOTAllocations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${patientOTAllocations.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient OT Allocations:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientOTAllocationId}: Patient ${result.PatientId} - Appointment ${result.PatientAppointmentId || 'N/A'} - OT ${result.OTId} (${result.OperationStatus})`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createPatientOTAllocationLegacy(allocationData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(allocationData);
      const url = new URL(`${BASE_URL}/api/patient-ot-allocations`);
      
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
              console.log('✓ Created Patient OT Allocation:', result.data.PatientOTAllocationId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Patient Appointment ID:', result.data.PatientAppointmentId || 'N/A');
              console.log('  OT ID:', result.data.OTId);
              console.log('  Lead Surgeon ID:', result.data.LeadSurgeonId);
              console.log('  OT Allocation Date:', result.data.OTAllocationDate);
              console.log('  Operation Status:', result.data.OperationStatus);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient OT Allocation:', result.message);
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
        console.error('✗ Error creating Patient OT Allocation:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient OT Allocation records for PatientAppointment (OPD) patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-ot-allocations\n`);
    
    const results = [];
    
    for (let i = 0; i < patientOTAllocations.length; i++) {
      console.log(`Creating Patient OT Allocation ${i + 1}/${patientOTAllocations.length}...`);
      const result = await createPatientOTAllocationLegacy(patientOTAllocations[i]);
      results.push(result);
      
      if (i < patientOTAllocations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${patientOTAllocations.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient OT Allocations:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientOTAllocationId}: Patient ${result.PatientId} - Appointment ${result.PatientAppointmentId || 'N/A'} - OT ${result.OTId} (${result.OperationStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

