require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample EmergencyAdmissionVitals records for EmergencyAdmission records
// Required: EmergencyAdmissionId (integer), NurseId (integer), RecordedDateTime (YYYY-MM-DD HH:MM:SS)
const emergencyAdmissionVitals = [
  {
    EmergencyAdmissionId: 1, // b7b06427-a484-439f-9566-b5333ea718a9 - EmergencyBedSlotId 10
    NurseId: 2, // nurse
    RecordedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    HeartRate: 95,
    BloodPressure: "140/90",
    Temperature: 38.2,
    O2Saturation: 92.5,
    RespiratoryRate: 22,
    PulseRate: 98,
    VitalsStatus: "Critical",
    VitalsRemarks: "Initial vitals on emergency admission. Patient in critical condition. High temperature and elevated heart rate. Requires immediate monitoring.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 1, // Same patient - follow-up vitals
    NurseId: 2, // nurse
    RecordedDateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // 30 minutes later
    HeartRate: 88,
    BloodPressure: "135/85",
    Temperature: 37.8,
    O2Saturation: 94.0,
    RespiratoryRate: 20,
    PulseRate: 90,
    VitalsStatus: "Improving",
    VitalsRemarks: "Follow-up vitals after initial treatment. Patient showing signs of improvement. Temperature decreasing. Continue monitoring.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 2, // 5bccd6d7-0acc-4184-9d34-5ec0f940eb00 - EmergencyBedSlotId 11
    NurseId: 2, // nurse
    RecordedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    HeartRate: 110,
    BloodPressure: "150/95",
    Temperature: 37.5,
    O2Saturation: 89.0,
    RespiratoryRate: 24,
    PulseRate: 112,
    VitalsStatus: "Critical",
    VitalsRemarks: "Emergency admission vitals. Patient in critical cardiac condition. Elevated heart rate and blood pressure. Cardiac monitoring initiated.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 2, // Same patient - follow-up vitals
    NurseId: 2, // nurse
    RecordedDateTime: new Date(Date.now() + 45 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // 45 minutes later
    HeartRate: 95,
    BloodPressure: "140/88",
    Temperature: 37.2,
    O2Saturation: 91.5,
    RespiratoryRate: 21,
    PulseRate: 97,
    VitalsStatus: "Stable",
    VitalsRemarks: "Vitals after cardiac intervention. Patient condition stabilizing. Heart rate and blood pressure improving. Continue cardiac medications.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 3, // 184ac63a-60dc-4558-8470-b2c2e2a6b817 - EmergencyBedSlotId 1
    NurseId: 2, // nurse
    RecordedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    HeartRate: 75,
    BloodPressure: "120/80",
    Temperature: 36.8,
    O2Saturation: 98.0,
    RespiratoryRate: 18,
    PulseRate: 76,
    VitalsStatus: "Stable",
    VitalsRemarks: "Emergency admission for fracture. Patient vitals stable. No signs of shock. Pain management initiated. Orthopedic assessment pending.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 4, // 7e8715e2-d0c6-40be-b658-021f8f128735 - EmergencyBedSlotId 12
    NurseId: 2, // nurse
    RecordedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    HeartRate: 102,
    BloodPressure: "145/92",
    Temperature: 38.5,
    O2Saturation: 90.5,
    RespiratoryRate: 23,
    PulseRate: 105,
    VitalsStatus: "Critical",
    VitalsRemarks: "Emergency admission with respiratory distress. High temperature and low O2 saturation. Oxygen therapy initiated. Respiratory support required.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 4, // Same patient - follow-up vitals
    NurseId: 2, // nurse
    RecordedDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), // 1 hour later
    HeartRate: 88,
    BloodPressure: "130/85",
    Temperature: 37.6,
    O2Saturation: 93.5,
    RespiratoryRate: 20,
    PulseRate: 90,
    VitalsStatus: "Improving",
    VitalsRemarks: "Vitals after oxygen therapy and medication. Patient responding to treatment. O2 saturation improving. Continue respiratory support.",
    Status: "Active"
  },
  {
    EmergencyAdmissionId: 5, // d2023e9e-5b6e-4e22-ba5b-992b6780a72f - EmergencyBedSlotId 13
    NurseId: 2, // nurse
    RecordedDateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    HeartRate: 82,
    BloodPressure: "125/78",
    Temperature: 37.0,
    O2Saturation: 96.5,
    RespiratoryRate: 19,
    PulseRate: 84,
    VitalsStatus: "Stable",
    VitalsRemarks: "Emergency admission vitals. Patient stable. All parameters within normal range. Monitoring for any changes. Treatment plan being reviewed.",
    Status: "Active"
  }
];

async function createEmergencyAdmissionVitals(vitalsData) {
  try {
    const response = await fetch(`${BASE_URL}/api/emergency-admission-vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vitalsData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Emergency Admission Vitals:', result.data.EmergencyAdmissionVitalsId);
      console.log('  Emergency Admission ID:', result.data.EmergencyAdmissionId);
      console.log('  Nurse ID:', result.data.NurseId);
      console.log('  Recorded DateTime:', result.data.RecordedDateTime);
      console.log('  Heart Rate:', result.data.HeartRate, 'bpm');
      console.log('  Blood Pressure:', result.data.BloodPressure);
      console.log('  Temperature:', result.data.Temperature, '°C');
      console.log('  O2 Saturation:', result.data.O2Saturation, '%');
      console.log('  Vitals Status:', result.data.VitalsStatus);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Emergency Admission Vitals:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Emergency Admission Vitals:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Emergency Admission Vitals records for EmergencyAdmission records...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/emergency-admission-vitals\n`);
  
  const results = [];
  
  for (let i = 0; i < emergencyAdmissionVitals.length; i++) {
    console.log(`Creating Emergency Admission Vitals ${i + 1}/${emergencyAdmissionVitals.length}...`);
    const result = await createEmergencyAdmissionVitals(emergencyAdmissionVitals[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < emergencyAdmissionVitals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${emergencyAdmissionVitals.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Emergency Admission Vitals:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.EmergencyAdmissionVitalsId}: Emergency Admission ${result.EmergencyAdmissionId} - Nurse ${result.NurseId} - ${result.VitalsStatus} (${result.RecordedDateTime})`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createEmergencyAdmissionVitalsLegacy(vitalsData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(vitalsData);
      const url = new URL(`${BASE_URL}/api/emergency-admission-vitals`);
      
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
              console.log('✓ Created Emergency Admission Vitals:', result.data.EmergencyAdmissionVitalsId);
              console.log('  Emergency Admission ID:', result.data.EmergencyAdmissionId);
              console.log('  Nurse ID:', result.data.NurseId);
              console.log('  Recorded DateTime:', result.data.RecordedDateTime);
              console.log('  Heart Rate:', result.data.HeartRate, 'bpm');
              console.log('  Blood Pressure:', result.data.BloodPressure);
              console.log('  Temperature:', result.data.Temperature, '°C');
              console.log('  O2 Saturation:', result.data.O2Saturation, '%');
              console.log('  Vitals Status:', result.data.VitalsStatus);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Emergency Admission Vitals:', result.message);
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
        console.error('✗ Error creating Emergency Admission Vitals:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Emergency Admission Vitals records for EmergencyAdmission records...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/emergency-admission-vitals\n`);
    
    const results = [];
    
    for (let i = 0; i < emergencyAdmissionVitals.length; i++) {
      console.log(`Creating Emergency Admission Vitals ${i + 1}/${emergencyAdmissionVitals.length}...`);
      const result = await createEmergencyAdmissionVitalsLegacy(emergencyAdmissionVitals[i]);
      results.push(result);
      
      if (i < emergencyAdmissionVitals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${emergencyAdmissionVitals.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Emergency Admission Vitals:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.EmergencyAdmissionVitalsId}: Emergency Admission ${result.EmergencyAdmissionId} - Nurse ${result.NurseId} - ${result.VitalsStatus} (${result.RecordedDateTime})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

