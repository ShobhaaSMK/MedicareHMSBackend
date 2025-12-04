require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// First, fetch existing PatientAdmitNurseVisits records to link vitals
async function fetchNurseVisits() {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-admit-nurse-visits`);
    const result = await response.json();
    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching nurse visits:', error.message);
    return [];
  }
}

// Sample PatientAdmitVisitVitals records for PatientAdmitNurseVisits
// Required: PatientAdmitNurseVisitsId (UUID), PatientId (UUID), RecordedDateTime (YYYY-MM-DD HH:MM:SS)
async function createPatientAdmitVisitVitalsRecords() {
  const nurseVisits = await fetchNurseVisits();
  
  if (nurseVisits.length === 0) {
    console.log('No PatientAdmitNurseVisits found. Please create nurse visits first.');
    return [];
  }

  // Create vitals records for each nurse visit
  const vitalsRecords = [];
  
  for (let i = 0; i < Math.min(nurseVisits.length, 8); i++) {
    const visit = nurseVisits[i];
    const recordedDateTime = new Date(visit.RoomVisitsCreatedAt || new Date()).toISOString().slice(0, 19).replace('T', ' ');
    
    // Create 1-2 vitals records per nurse visit
    const numVitals = i % 2 === 0 ? 1 : 2; // Alternate between 1 and 2 vitals per visit
    
    for (let j = 0; j < numVitals; j++) {
      const vitalsTime = new Date(new Date(recordedDateTime).getTime() + j * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      
      vitalsRecords.push({
        PatientAdmitNurseVisitsId: visit.PatientAdmitNurseVisitsId,
        PatientId: visit.PatientId,
        RecordedDateTime: vitalsTime,
        DailyOrHourlyVitals: j === 0 ? "Daily Vitals" : "Hourly Vitals",
        HeartRate: 70 + Math.floor(Math.random() * 20), // 70-90 bpm
        BloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 10)}`,
        Temperature: (36.5 + Math.random() * 0.8).toFixed(2), // 36.5-37.3°C
        O2Saturation: (95 + Math.random() * 5).toFixed(2), // 95-100%
        RespiratoryRate: 16 + Math.floor(Math.random() * 4), // 16-20 per minute
        PulseRate: 72 + Math.floor(Math.random() * 16), // 72-88 bpm
        VitalsStatus: "Normal",
        VitalsRemarks: j === 0 
          ? "Morning vitals check. All parameters within normal range."
          : "Hourly vitals monitoring. Patient stable.",
        Status: "Active"
      });
    }
  }
  
  return vitalsRecords;
}

async function createPatientAdmitVisitVitals(vitalsData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-admit-visit-vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vitalsData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient Admit Visit Vitals:', result.data.PatientAdmitVisitVitalsId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Nurse Visit ID:', result.data.PatientAdmitNurseVisitsId);
      console.log('  Recorded DateTime:', result.data.RecordedDateTime);
      console.log('  Daily/Hourly:', result.data.DailyOrHourlyVitals);
      console.log('  Heart Rate:', result.data.HeartRate, 'bpm');
      console.log('  Blood Pressure:', result.data.BloodPressure);
      console.log('  Temperature:', result.data.Temperature, '°C');
      console.log('  O2 Saturation:', result.data.O2Saturation, '%');
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient Admit Visit Vitals:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient Admit Visit Vitals:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient Admit Visit Vitals records for PatientAdmitNurseVisits...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-admit-visit-vitals\n`);
  
  const vitalsRecords = await createPatientAdmitVisitVitalsRecords();
  
  if (vitalsRecords.length === 0) {
    console.log('No vitals records to create. Please ensure PatientAdmitNurseVisits exist first.');
    return;
  }
  
  console.log(`Found ${vitalsRecords.length} vitals records to create.\n`);
  
  const results = [];
  
  for (let i = 0; i < vitalsRecords.length; i++) {
    console.log(`Creating Patient Admit Visit Vitals ${i + 1}/${vitalsRecords.length}...`);
    const result = await createPatientAdmitVisitVitals(vitalsRecords[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < vitalsRecords.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${vitalsRecords.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient Admit Visit Vitals:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientAdmitVisitVitalsId}: Patient ${result.PatientId} - Nurse Visit ${result.PatientAdmitNurseVisitsId} - ${result.DailyOrHourlyVitals}`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function fetchNurseVisitsLegacy() {
    return new Promise((resolve, reject) => {
      const url = new URL(`${BASE_URL}/api/patient-admit-nurse-visits`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
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
            if (res.statusCode >= 200 && res.statusCode < 300 && result.success && result.data) {
              resolve(result.data);
            } else {
              resolve([]);
            }
          } catch (error) {
            resolve([]);
          }
        });
      });
      
      req.on('error', () => {
        resolve([]);
      });
      
      req.end();
    });
  }
  
  async function createPatientAdmitVisitVitalsLegacy(vitalsData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(vitalsData);
      const url = new URL(`${BASE_URL}/api/patient-admit-visit-vitals`);
      
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
              console.log('✓ Created Patient Admit Visit Vitals:', result.data.PatientAdmitVisitVitalsId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Nurse Visit ID:', result.data.PatientAdmitNurseVisitsId);
              console.log('  Recorded DateTime:', result.data.RecordedDateTime);
              console.log('  Daily/Hourly:', result.data.DailyOrHourlyVitals);
              console.log('  Heart Rate:', result.data.HeartRate, 'bpm');
              console.log('  Blood Pressure:', result.data.BloodPressure);
              console.log('  Temperature:', result.data.Temperature, '°C');
              console.log('  O2 Saturation:', result.data.O2Saturation, '%');
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient Admit Visit Vitals:', result.message);
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
        console.error('✗ Error creating Patient Admit Visit Vitals:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient Admit Visit Vitals records for PatientAdmitNurseVisits...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-admit-visit-vitals\n`);
    
    const nurseVisits = await fetchNurseVisitsLegacy();
    
    if (nurseVisits.length === 0) {
      console.log('No PatientAdmitNurseVisits found. Please create nurse visits first.');
      return;
    }

    const vitalsRecords = [];
    
    for (let i = 0; i < Math.min(nurseVisits.length, 8); i++) {
      const visit = nurseVisits[i];
      const recordedDateTime = new Date(visit.RoomVisitsCreatedAt || new Date()).toISOString().slice(0, 19).replace('T', ' ');
      
      const numVitals = i % 2 === 0 ? 1 : 2;
      
      for (let j = 0; j < numVitals; j++) {
        const vitalsTime = new Date(new Date(recordedDateTime).getTime() + j * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        
        vitalsRecords.push({
          PatientAdmitNurseVisitsId: visit.PatientAdmitNurseVisitsId,
          PatientId: visit.PatientId,
          RecordedDateTime: vitalsTime,
          DailyOrHourlyVitals: j === 0 ? "Daily Vitals" : "Hourly Vitals",
          HeartRate: 70 + Math.floor(Math.random() * 20),
          BloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 10)}`,
          Temperature: (36.5 + Math.random() * 0.8).toFixed(2),
          O2Saturation: (95 + Math.random() * 5).toFixed(2),
          RespiratoryRate: 16 + Math.floor(Math.random() * 4),
          PulseRate: 72 + Math.floor(Math.random() * 16),
          VitalsStatus: "Normal",
          VitalsRemarks: j === 0 
            ? "Morning vitals check. All parameters within normal range."
            : "Hourly vitals monitoring. Patient stable.",
          Status: "Active"
        });
      }
    }
    
    console.log(`Found ${vitalsRecords.length} vitals records to create.\n`);
    
    const results = [];
    
    for (let i = 0; i < vitalsRecords.length; i++) {
      console.log(`Creating Patient Admit Visit Vitals ${i + 1}/${vitalsRecords.length}...`);
      const result = await createPatientAdmitVisitVitalsLegacy(vitalsRecords[i]);
      results.push(result);
      
      if (i < vitalsRecords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${vitalsRecords.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient Admit Visit Vitals:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientAdmitVisitVitalsId}: Patient ${result.PatientId} - Nurse Visit ${result.PatientAdmitNurseVisitsId} - ${result.DailyOrHourlyVitals}`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

