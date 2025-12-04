require('dotenv').config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample PatientICUAdmission records for PatientAppointment (OPD) patients
// Required: PatientId (UUID), PatientAppointmentId (integer), ICUId (integer), ICUAllocationFromDate (YYYY-MM-DD)
const patientICUAdmissions = [
  {
    PatientId: "f5e595f0-adc9-43d2-ba34-c93070de7058", // Meera - from PatientAppointment ID 19
    PatientAppointmentId: 19, // Link to PatientAppointment (OPD)
    ICUId: 1, // ICU-001 General ICU
    ICUPatientStatus: "Serious",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null, // Ongoing
    NumberOfDays: null,
    Diagnosis: "OPD patient admitted to ICU due to severe complications during consultation. Requires intensive monitoring.",
    TreatementDetails: "Patient transferred from OPD to ICU. Continuous monitoring. Medication adjustments based on condition.",
    PatientCondition: "Serious condition requiring intensive care after OPD consultation",
    Status: "Active"
  },
  {
    PatientId: "e8f05fbb-df23-4ab7-8755-5d82b5a1768e", // Vikram - from PatientAppointment ID 20
    PatientAppointmentId: 20,
    ICUId: 2, // ICU-002 General ICU
    ICUPatientStatus: "Critical",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Critical condition identified during OPD visit. Immediate ICU admission required.",
    TreatementDetails: "Emergency ICU admission from OPD. Critical care protocol initiated. Ventilator support if needed.",
    PatientCondition: "Critical condition requiring immediate intensive care",
    Status: "Active"
  },
  {
    PatientId: "13138d3e-6aa9-470b-9d10-60bbecdfd586", // Amit - from PatientAppointment ID 10
    PatientAppointmentId: 10,
    ICUId: 3, // ICU-003 Cardiac ICU
    ICUPatientStatus: "Critical",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Cardiac emergency detected during OPD consultation. Patient requires cardiac ICU care.",
    TreatementDetails: "Cardiac ICU admission from OPD. ECG monitoring. Cardiac medication protocol. Continuous cardiac assessment.",
    PatientCondition: "Critical cardiac condition",
    Status: "Active"
  },
  {
    PatientId: "9b0b380b-17e1-4aa0-acb8-9cb9d7943ce4", // Priya - from PatientAppointment ID 11
    PatientAppointmentId: 11,
    ICUId: 4, // ICU-004 Cardiac ICU
    ICUPatientStatus: "Serious",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Post-consultation complications. Patient condition deteriorated after OPD visit, requiring ICU care.",
    TreatementDetails: "ICU admission from OPD. Monitoring vital signs. Medication adjustments. Specialized care protocol.",
    PatientCondition: "Serious condition requiring intensive monitoring",
    Status: "Active"
  },
  {
    PatientId: "f7b276b9-b8e4-4dbc-b628-353bdd66c0bf", // Rajesh - from PatientAppointment ID 12
    PatientAppointmentId: 12,
    ICUId: 5, // ICU-005 Neuro ICU
    ICUPatientStatus: "Stable",
    ICUAllocationFromDate: new Date().toISOString().split('T')[0],
    ICUAllocationToDate: null,
    NumberOfDays: null,
    Diagnosis: "Neurological symptoms identified during OPD consultation. Precautionary ICU admission for monitoring.",
    TreatementDetails: "Neuro ICU admission from OPD for neurological monitoring. Neurological assessment. Medication protocol.",
    PatientCondition: "Stable, requires neurological monitoring",
    Status: "Active"
  }
];

async function createPatientICUAdmission(admissionData) {
  try {
    const response = await fetch(`${BASE_URL}/api/patient-icu-admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(admissionData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Created Patient ICU Admission:', result.data.PatientICUAdmissionId);
      console.log('  Patient ID:', result.data.PatientId);
      console.log('  Patient Appointment ID:', result.data.PatientAppointmentId || 'N/A');
      console.log('  ICU ID:', result.data.ICUId);
      console.log('  ICU Patient Status:', result.data.ICUPatientStatus);
      console.log('  Allocation From Date:', result.data.ICUAllocationFromDate);
      console.log('');
      return result.data;
    } else {
      console.error('✗ Failed to create Patient ICU Admission:', result.message);
      if (result.error) {
        console.error('  Error:', result.error);
      }
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating Patient ICU Admission:', error.message);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('Creating Patient ICU Admission records for PatientAppointment (OPD) patients...\n');
  console.log(`API Endpoint: ${BASE_URL}/api/patient-icu-admissions\n`);
  
  const results = [];
  
  for (let i = 0; i < patientICUAdmissions.length; i++) {
    console.log(`Creating Patient ICU Admission ${i + 1}/${patientICUAdmissions.length}...`);
    const result = await createPatientICUAdmission(patientICUAdmissions[i]);
    results.push(result);
    
    // Small delay between requests to avoid overwhelming the server
    if (i < patientICUAdmissions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  const failCount = results.length - successCount;
  
  console.log('\n=== Summary ===');
  console.log(`Total: ${patientICUAdmissions.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\nSuccessfully created Patient ICU Admissions:');
    results.forEach((result, index) => {
      if (result) {
        console.log(`  ${index + 1}. ID ${result.PatientICUAdmissionId}: Patient ${result.PatientId} - Appointment ${result.PatientAppointmentId || 'N/A'} - ICU ${result.ICUId} (${result.ICUPatientStatus})`);
      }
    });
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  // Fallback for older Node.js versions
  const https = require('https');
  const http = require('http');
  
  async function createPatientICUAdmissionLegacy(admissionData) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(admissionData);
      const url = new URL(`${BASE_URL}/api/patient-icu-admissions`);
      
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
              console.log('✓ Created Patient ICU Admission:', result.data.PatientICUAdmissionId);
              console.log('  Patient ID:', result.data.PatientId);
              console.log('  Patient Appointment ID:', result.data.PatientAppointmentId || 'N/A');
              console.log('  ICU ID:', result.data.ICUId);
              console.log('  ICU Patient Status:', result.data.ICUPatientStatus);
              console.log('  Allocation From Date:', result.data.ICUAllocationFromDate);
              console.log('');
              resolve(result.data);
            } else {
              console.error('✗ Failed to create Patient ICU Admission:', result.message);
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
        console.error('✗ Error creating Patient ICU Admission:', error.message);
        console.log('');
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  async function mainLegacy() {
    console.log('Creating Patient ICU Admission records for PatientAppointment (OPD) patients...\n');
    console.log(`API Endpoint: ${BASE_URL}/api/patient-icu-admissions\n`);
    
    const results = [];
    
    for (let i = 0; i < patientICUAdmissions.length; i++) {
      console.log(`Creating Patient ICU Admission ${i + 1}/${patientICUAdmissions.length}...`);
      const result = await createPatientICUAdmissionLegacy(patientICUAdmissions[i]);
      results.push(result);
      
      if (i < patientICUAdmissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r !== null).length;
    const failCount = results.length - successCount;
    
    console.log('\n=== Summary ===');
    console.log(`Total: ${patientICUAdmissions.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (successCount > 0) {
      console.log('\nSuccessfully created Patient ICU Admissions:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`  ${index + 1}. ID ${result.PatientICUAdmissionId}: Patient ${result.PatientId} - Appointment ${result.PatientAppointmentId || 'N/A'} - ICU ${result.ICUId} (${result.ICUPatientStatus})`);
        }
      });
    }
  }
  
  mainLegacy().catch(console.error);
} else {
  main().catch(console.error);
}

