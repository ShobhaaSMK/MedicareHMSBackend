require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample RoomAdmission records to create
// Required: PatientId (UUID), AdmittingDoctorId (integer), RoomBedsId (integer), RoomAllocationDate (timestamp)
const roomAdmissions = [
  {
    PatientId: "b7b06427-a484-439f-9566-b5333ea718a9", // Arjun
    AdmittingDoctorId: 15, // dr.davis
    RoomBedsId: 1, // B_001, Room 101
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "Patient admitted for observation and treatment. Stable condition.",
    Status: "Active"
  },
  {
    PatientId: "5bccd6d7-0acc-4184-9d34-5ec0f940eb00", // Sneha
    AdmittingDoctorId: 16, // dr.miller
    RoomBedsId: 2, // B_002, Room 102
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "Post-operative care and monitoring required.",
    Status: "Active"
  },
  {
    PatientId: "184ac63a-60dc-4558-8470-b2c2e2a6b817", // Deepak
    AdmittingDoctorId: 17, // dr.wilson
    RoomBedsId: 3, // B_003, Room 103
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Surgery Scheduled",
    CaseSheetDetails: "Patient scheduled for surgery. Pre-operative preparation in progress.",
    ScheduleOT: "Yes",
    Status: "Active"
  },
  {
    PatientId: "7e8715e2-d0c6-40be-b658-021f8f128735", // Karan
    AdmittingDoctorId: 15, // dr.davis
    RoomBedsId: 4, // B_004, Room 104
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "General medical treatment and observation.",
    Status: "Active"
  },
  {
    PatientId: "d2023e9e-5b6e-4e22-ba5b-992b6780a72f", // Anjali
    AdmittingDoctorId: 16, // dr.miller
    RoomBedsId: 5, // B_005, Room 201
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "Recovery and rehabilitation program.",
    Status: "Active"
  }
];

async function createRoomAdmission(admissionData) {
  try {
    const response = await fetch(`${BASE_URL}/api/room-admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(admissionData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Room Admission:', result.data.RoomAdmissionId);
      console.log('  Patient:', result.data.PatientName || 'N/A');
      console.log('  Doctor:', result.data.AdmittingDoctorName || 'N/A');
      console.log('  Bed:', result.data.BedNo || 'N/A', '- Room:', result.data.RoomNo || 'N/A');
      console.log('  Admission Status:', result.data.AdmissionStatus);
      console.log('  Allocation Date:', result.data.RoomAllocationDate);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Room Admission:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Room Admission:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Room Admission records...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/room-admissions\n`);
  
  const results = [];
  
  for (let i = 0; i < roomAdmissions.length; i++) {
    console.log(`Creating Room Admission ${i + 1}/${roomAdmissions.length}...`);
    const result = await createRoomAdmission(roomAdmissions[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < roomAdmissions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${roomAdmissions.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Room Admissions:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.RoomAdmissionId}: ${result.PatientName} - ${result.BedNo} (${result.AdmissionStatus})`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createRoomAdmissionLegacy(admissionData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(admissionData);
      const url = new URL(`${BASE_URL}/api/room-admissions`);
      
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
              console.log('✓ Created Room Admission:', result.data.RoomAdmissionId);
              console.log('  Patient:', result.data.PatientName || 'N/A');
              console.log('  Doctor:', result.data.AdmittingDoctorName || 'N/A');
              console.log('  Bed:', result.data.BedNo || 'N/A', '- Room:', result.data.RoomNo || 'N/A');
              console.log('  Admission Status:', result.data.AdmissionStatus);
              console.log('  Allocation Date:', result.data.RoomAllocationDate);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Room Admission:', result.message);
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
        console.error('✗ Error creating Room Admission:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Room Admission records...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/room-admissions\n`);
    
    const results = [];
    
    for (let i = 0; i < roomAdmissions.length; i++) {
      console.log(`Creating Room Admission ${i + 1}/${roomAdmissions.length}...`);
      const result = await createRoomAdmissionLegacy(roomAdmissions[i]);
      results.push(result);
      
      if (i < roomAdmissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${roomAdmissions.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Room Admissions:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.RoomAdmissionId}: ${result.PatientName} - ${result.BedNo} (${result.AdmissionStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

