require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientOTAllocation records for RoomAdmission (IPD) patients
// Required: PatientId (UUID), RoomAdmissionId (integer), OTId (integer), LeadSurgeonId (integer), OTAllocationDate (YYYY-MM-DD)
const patientOTAllocations = [
  {
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya - from RoomAdmission ID 7
    RoomAdmissionId: 7, // Link to RoomAdmission (IPD)
    OTId: 6, // OT-006 Obstetrics & Gynecology
    LeadSurgeonId: 15, // dr.davis
    AssistantDoctorId: 16, // dr.miller
    OTAllocationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    OTStartTime: "08:00:00",
    OTEndTime: "10:30:00",
    Duration: "2.5 hours",
    OperationDescription: "Hysterectomy procedure for IPD patient. Patient admitted and prepared for surgery.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Patient admitted to IPD. Pre-operative assessment completed. Blood work and imaging reviewed. Patient stable for surgery.",
    Status: "Active"
  },
  {
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram - from RoomAdmission ID 10
    RoomAdmissionId: 10,
    OTId: 3, // OT-003 Cardiac Surgery
    LeadSurgeonId: 16, // dr.miller
    AssistantDoctorId: 17, // dr.wilson
    OTAllocationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
    OTStartTime: "11:00:00",
    OTEndTime: "14:00:00",
    Duration: "3 hours",
    OperationDescription: "Coronary artery bypass graft (CABG) surgery. Patient admitted to IPD for pre-operative preparation.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "IPD admission for cardiac surgery preparation. Cardiac assessment completed. Patient on cardiac medications. Pre-operative cardiac catheterization reviewed.",
    Status: "Active"
  },
  {
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera - from RoomAdmission ID 9
    RoomAdmissionId: 9,
    OTId: 7, // OT-007 Urology
    LeadSurgeonId: 17, // dr.wilson
    AssistantDoctorId: 15, // dr.davis
    OTAllocationDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days from now
    OTStartTime: "13:00:00",
    OTEndTime: "15:00:00",
    Duration: "2 hours",
    OperationDescription: "Nephrectomy procedure. Patient admitted to IPD for surgical intervention.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "IPD admission for urological surgery. Pre-operative assessment and imaging completed. Patient prepared for nephrectomy.",
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
      console.log('  Room Admission ID:', result.data.RoomAdmissionId || 'N/A');
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
  console.log('Creating Patient OT Allocation records for RoomAdmission (IPD) patients...\n');
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
        console.log(`  ${index + 1}. ID ${result.PatientOTAllocationId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - OT ${result.OTId} (${result.OperationStatus})`);
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
              console.log('  Room Admission ID:', result.data.RoomAdmissionId || 'N/A');
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
    console.log('Creating Patient OT Allocation records for RoomAdmission (IPD) patients...\n');
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
          console.log(`  ${index + 1}. ID ${result.PatientOTAllocationId}: Patient ${result.PatientId} - Room Admission ${result.RoomAdmissionId || 'N/A'} - OT ${result.OTId} (${result.OperationStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

