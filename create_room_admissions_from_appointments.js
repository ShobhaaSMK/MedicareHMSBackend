require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample RoomAdmission records for OPD patients from PatientAppointment
// Using existing PatientAppointment records and linking them to RoomAdmission
const roomAdmissionsFromAppointments = [
  {
    PatientAppointmentId: 10, // Amit's appointment
    AdmittingDoctorId: 12, // Same doctor from appointment
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit
    RoomBedsId: 6, // B_006, Room 201
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "OPD patient admitted to IPD for further observation and treatment.",
    Status: "Active"
  },
  {
    PatientAppointmentId: 11, // Priya's appointment
    AdmittingDoctorId: 11, // Same doctor from appointment
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya
    RoomBedsId: 7, // B_007, Room 202
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "OPD consultation followed by IPD admission for comprehensive care.",
    Status: "Active"
  },
  {
    PatientAppointmentId: 12, // Rajesh's appointment
    AdmittingDoctorId: 8, // Same doctor from appointment
    PatientId: "f7b276b9-b8e4-4dbc-b628-353bdd66c0bf", // Rajesh
    RoomBedsId: 8, // B_008, Room 202
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Surgery Scheduled",
    CaseSheetDetails: "OPD patient transferred to IPD for scheduled surgery preparation.",
    ScheduleOT: "Yes",
    Status: "Active"
  },
  {
    PatientAppointmentId: 19, // Meera's appointment
    AdmittingDoctorId: 17, // Same doctor from appointment
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera
    RoomBedsId: 9, // B_009, Room 203
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "OPD patient admitted for extended monitoring and treatment.",
    Status: "Active"
  },
  {
    PatientAppointmentId: 20, // Vikram's appointment
    AdmittingDoctorId: 16, // Same doctor from appointment
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram
    RoomBedsId: 10, // B_010, Room 203
    RoomAllocationDate: new Date().toISOString(),
    AdmissionStatus: "Active",
    CaseSheetDetails: "OPD consultation resulted in IPD admission for specialized care.",
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
      console.log('  Patient Appointment ID:', result.data.PatientAppointmentId || 'N/A');
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
  console.log('Creating Room Admission records for OPD patients from PatientAppointment...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/room-admissions\n`);
  
  const results = [];
  
  for (let i = 0; i < roomAdmissionsFromAppointments.length; i++) {
    console.log(`Creating Room Admission ${i + 1}/${roomAdmissionsFromAppointments.length}...`);
    const result = await createRoomAdmission(roomAdmissionsFromAppointments[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < roomAdmissionsFromAppointments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${roomAdmissionsFromAppointments.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Room Admissions from OPD Appointments:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.RoomAdmissionId}: ${result.PatientName} - Appointment ${result.PatientAppointmentId} - ${result.BedNo} (${result.AdmissionStatus})`);
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
              console.log('  Patient Appointment ID:', result.data.PatientAppointmentId || 'N/A');
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
    console.log('Creating Room Admission records for OPD patients from PatientAppointment...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/room-admissions\n`);
    
    const results = [];
    
    for (let i = 0; i < roomAdmissionsFromAppointments.length; i++) {
      console.log(`Creating Room Admission ${i + 1}/${roomAdmissionsFromAppointments.length}...`);
      const result = await createRoomAdmissionLegacy(roomAdmissionsFromAppointments[i]);
      results.push(result);
      
      if (i < roomAdmissionsFromAppointments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${roomAdmissionsFromAppointments.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Room Admissions from OPD Appointments:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.RoomAdmissionId}: ${result.PatientName} - Appointment ${result.PatientAppointmentId} - ${result.BedNo} (${result.AdmissionStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

