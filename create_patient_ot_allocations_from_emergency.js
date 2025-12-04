require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientOTAllocation records for EmergencyAdmission (Emergency) patients
// Required: PatientId (UUID), EmergencyBedSlotId (integer), OTId (integer), LeadSurgeonId (integer), OTAllocationDate (YYYY-MM-DD)
const patientOTAllocations = [
  {
    PatientId: "b7b06427-a484-439f-9566-b5333ea718a9", // Arjun - from EmergencyAdmission ID 1
    EmergencyBedSlotId: 10, // Link to EmergencyBedSlot from EmergencyAdmission
    OTId: 8, // OT-008 Emergency OT
    LeadSurgeonId: 15, // dr.davis
    AssistantDoctorId: 16, // dr.miller
    OTAllocationDate: new Date().toISOString().split('T')[0], // Today
    OTStartTime: "15:00:00",
    OTEndTime: "17:00:00",
    Duration: "2 hours",
    OperationDescription: "Emergency appendectomy. Patient admitted through emergency and requires immediate surgical intervention.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Emergency admission. Patient prepared for emergency surgery. Pre-operative assessment completed in emergency ward.",
    Status: "Active"
  },
  {
    PatientId: "5bccd6d7-0acc-4184-9d34-5ec0f940eb00", // Sneha - from EmergencyAdmission ID 2
    EmergencyBedSlotId: 11,
    OTId: 8, // OT-008 Emergency OT
    LeadSurgeonId: 16, // dr.miller
    AssistantDoctorId: 17, // dr.wilson
    OTAllocationDate: new Date().toISOString().split('T')[0], // Today
    OTStartTime: "18:00:00",
    OTEndTime: "20:00:00",
    Duration: "2 hours",
    OperationDescription: "Emergency cardiac intervention. Patient admitted through emergency with cardiac complications requiring immediate surgery.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Emergency cardiac case. Patient stabilized in emergency ward. Immediate surgical intervention required.",
    Status: "Active"
  },
  {
    PatientId: "184ac63a-60dc-4558-8470-b2c2e2a6b817", // Deepak - from EmergencyAdmission ID 3
    EmergencyBedSlotId: 1,
    OTId: 4, // OT-004 Orthopedic Surgery
    LeadSurgeonId: 17, // dr.wilson
    AssistantDoctorId: 15, // dr.davis
    OTAllocationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    OTStartTime: "09:00:00",
    OTEndTime: "12:00:00",
    Duration: "3 hours",
    OperationDescription: "Fracture repair surgery. Patient admitted through emergency with fracture requiring surgical fixation.",
    OperationStatus: "Scheduled",
    PreOperationNotes: "Emergency admission for fracture. X-ray completed. Patient prepared for fracture repair surgery.",
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
      console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId || 'N/A');
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
  console.log('Creating Patient OT Allocation records for EmergencyAdmission (Emergency) patients...\n');
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
        console.log(`  ${index + 1}. ID ${result.PatientOTAllocationId}: Patient ${result.PatientId} - Emergency Bed Slot ${result.EmergencyBedSlotId || 'N/A'} - OT ${result.OTId} (${result.OperationStatus})`);
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
              console.log('  Emergency Bed Slot ID:', result.data.EmergencyBedSlotId || 'N/A');
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
    console.log('Creating Patient OT Allocation records for EmergencyAdmission (Emergency) patients...\n');
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
          console.log(`  ${index + 1}. ID ${result.PatientOTAllocationId}: Patient ${result.PatientId} - Emergency Bed Slot ${result.EmergencyBedSlotId || 'N/A'} - OT ${result.OTId} (${result.OperationStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

