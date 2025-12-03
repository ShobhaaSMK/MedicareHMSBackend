const http = require('http');

const PORT = process.env.PORT || 4000;
const HOST = 'localhost';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function createDepartment(departmentData) {
  const postData = JSON.stringify(departmentData);
  
  const options = {
    hostname: HOST,
    port: PORT,
    path: '/api/doctor-departments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return await makeRequest(options, postData);
}

// Department data organized by category
const departments = [
  // Clinical
  { DepartmentName: 'General Medicine', DepartmentCategory: 'Clinical', SpecialisationDetails: 'General medicine and internal medicine services' },
  { DepartmentName: 'Pediatrics', DepartmentCategory: 'Clinical', SpecialisationDetails: 'Pediatric care and child health services' },
  { DepartmentName: 'ENT', DepartmentCategory: 'Clinical', SpecialisationDetails: 'Ear, Nose, and Throat services' },
  { DepartmentName: 'Dermatology', DepartmentCategory: 'Clinical', SpecialisationDetails: 'Skin and dermatological services' },
  
  // Surgical
  { DepartmentName: 'General Surgery', DepartmentCategory: 'Surgical', SpecialisationDetails: 'General surgical procedures' },
  { DepartmentName: 'Orthopedics', DepartmentCategory: 'Surgical', SpecialisationDetails: 'Orthopedic surgery and bone-related procedures' },
  { DepartmentName: 'Obstetrics & Gynecology', DepartmentCategory: 'Surgical', SpecialisationDetails: 'Obstetrics and gynecological surgical services' },
  { DepartmentName: 'Urology', DepartmentCategory: 'Surgical', SpecialisationDetails: 'Urological surgical procedures' },
  { DepartmentName: 'Neurosurgery', DepartmentCategory: 'Surgical', SpecialisationDetails: 'Neurosurgical procedures and brain surgery' },
  
  // Diagnostic
  { DepartmentName: 'Radiology', DepartmentCategory: 'Diagnostic', SpecialisationDetails: 'Medical imaging and radiological diagnostics' },
  { DepartmentName: 'Pathology', DepartmentCategory: 'Diagnostic', SpecialisationDetails: 'Pathological testing and laboratory diagnostics' },
  { DepartmentName: 'Microbiology', DepartmentCategory: 'Diagnostic', SpecialisationDetails: 'Microbiological testing and diagnostics' },
  
  // Critical Care
  { DepartmentName: 'ICU', DepartmentCategory: 'Critical Care', SpecialisationDetails: 'Intensive Care Unit for critical patients' },
  { DepartmentName: 'NICU', DepartmentCategory: 'Critical Care', SpecialisationDetails: 'Neonatal Intensive Care Unit for newborns' },
  { DepartmentName: 'SICU', DepartmentCategory: 'Critical Care', SpecialisationDetails: 'Surgical Intensive Care Unit' },
  { DepartmentName: 'CCU', DepartmentCategory: 'Critical Care', SpecialisationDetails: 'Coronary Care Unit for cardiac patients' },
  
  // Support
  { DepartmentName: 'Physiotherapy', DepartmentCategory: 'Support', SpecialisationDetails: 'Physical therapy and rehabilitation services' },
  { DepartmentName: 'Dietetics', DepartmentCategory: 'Support', SpecialisationDetails: 'Nutrition and dietetic services' },
  { DepartmentName: 'Emergency', DepartmentCategory: 'Support', SpecialisationDetails: 'Emergency medical services' },
  { DepartmentName: 'Administration', DepartmentCategory: 'Support', SpecialisationDetails: 'Hospital administration and management' },
];

async function createDepartments() {
  console.log('Creating doctor departments via API...\n');
  
  const results = [];
  const byCategory = {};
  
  for (const dept of departments) {
    try {
      console.log(`Creating department: ${dept.DepartmentName} (${dept.DepartmentCategory})...`);
      
      const result = await createDepartment({
        DepartmentName: dept.DepartmentName,
        DepartmentCategory: dept.DepartmentCategory,
        SpecialisationDetails: dept.SpecialisationDetails,
        Status: 'Active',
      });
      
      if (result.status === 201 || result.status === 200) {
        console.log(`✅ Successfully created: ${dept.DepartmentName}`);
        results.push({ 
          department: dept.DepartmentName,
          category: dept.DepartmentCategory,
          status: 'success',
          data: result.data 
        });
        
        // Group by category for summary
        if (!byCategory[dept.DepartmentCategory]) {
          byCategory[dept.DepartmentCategory] = [];
        }
        byCategory[dept.DepartmentCategory].push(dept.DepartmentName);
      } else {
        const errorMsg = result.data?.message || result.data?.error || 'Unknown error';
        console.log(`⚠️  Failed to create ${dept.DepartmentName}: ${errorMsg}`);
        results.push({ 
          department: dept.DepartmentName,
          category: dept.DepartmentCategory,
          status: 'failed', 
          error: errorMsg 
        });
      }
    } catch (error) {
      console.log(`❌ Error creating ${dept.DepartmentName}: ${error.message}`);
      results.push({ 
        department: dept.DepartmentName,
        category: dept.DepartmentCategory,
        status: 'error', 
        error: error.message 
      });
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== Summary ===');
  const successful = results.filter(r => r.status === 'success');
  const exists = results.filter(r => r.status === 'exists');
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error');
  
  console.log(`✅ Successfully created: ${successful.length} departments`);
  if (exists.length > 0) {
    console.log(`ℹ️  Already exists: ${exists.length} departments`);
  }
  if (successful.length > 0) {
    console.log('\nCreated departments by category:');
    Object.keys(byCategory).forEach(category => {
      console.log(`\n${category}:`);
      byCategory[category].forEach(dept => console.log(`   - ${dept}`));
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} departments`);
    failed.forEach(f => {
      console.log(`   - ${f.department} (${f.category}): ${f.error || 'Unknown error'}`);
    });
  }
  
  return results;
}

// Check if server is running first
const checkServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: '/health',
      method: 'GET',
      timeout: 3000,
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      reject(false);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(false);
    });

    req.end();
  });
};

async function main() {
  try {
    console.log('Checking if server is running...');
    await checkServer();
    console.log('✅ Server is running\n');
    await createDepartments();
  } catch (error) {
    console.error('❌ Server is not running or not accessible.');
    console.error('Please make sure the server is running on port', PORT);
    console.error('Start the server with: npm start or npm run dev');
    process.exit(1);
  }
}

main();

