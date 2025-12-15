/**
 * Extract all columns referenced in controller map functions
 * and compare with database schema
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config();

// Map controller files to their table names
const controllerToTableMap = {
  'patientController.js': 'PatientRegistration',
  'userController.js': 'Users',
  'roleController.js': 'Roles',
  'doctorDepartmentController.js': 'DoctorDepartment',
  'roomBedsController.js': 'RoomBeds',
  'labTestController.js': 'LabTest',
  'icuController.js': 'ICU',
  'emergencyBedController.js': 'EmergencyBed',
  'emergencyBedSlotController.js': 'EmergencyBedSlot',
  'otController.js': 'OT',
  'otslotController.js': 'OTSlot',
  'patientAppointmentController.js': 'PatientAppointment',
  'patientLabTestController.js': 'PatientLabTest',
  'roomAdmissionController.js': 'RoomAdmission',
  'emergencyAdmissionController.js': 'EmergencyAdmission',
  'emergencyAdmissionVitalsController.js': 'EmergencyAdmissionVitals',
  'patientOTAllocationController.js': 'PatientOTAllocation',
  'patientICUAdmissionController.js': 'PatientICUAdmission',
  'icuDoctorVisitsController.js': 'ICUDoctorVisits',
  'icuVisitVitalsController.js': 'ICUVisitVitals',
  'patientAdmitDoctorVisitsController.js': 'PatientAdmitDoctorVisits',
  'patientAdmitVisitVitalsController.js': 'PatientAdmitVisitVitals',
  'surgeryProcedureController.js': 'SurgeryProcedure',
  'billsController.js': 'Bills',
  'billEntityController.js': 'BillEntity',
  'auditLogController.js': 'AuditLog',
};

const controllersDir = path.join(__dirname, 'controllers');
const columnsByTable = {};

// Extract columns from all controllers
fs.readdirSync(controllersDir).forEach(file => {
  if (!file.endsWith('Controller.js')) return;
  
  const tableName = controllerToTableMap[file];
  if (!tableName) {
    console.log(`⚠ No table mapping for ${file}`);
    return;
  }
  
  const filePath = path.join(controllersDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find map function
  const mapFunctionMatch = content.match(/const\s+map\w+Row\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\};/);
  if (mapFunctionMatch) {
    const mapBody = mapFunctionMatch[1];
    
    // Extract column names from the map function
    const columnMatches = mapBody.matchAll(/(\w+):\s*row\.(\w+)/g);
    const columns = new Set();
    
    for (const match of columnMatches) {
      const columnName = match[1];
      // Convert camelCase to PascalCase (database column format)
      const dbColumnName = columnName
        .replace(/([A-Z])/g, ' $1')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      columns.add(dbColumnName);
    }
    
    if (columns.size > 0) {
      columnsByTable[tableName] = Array.from(columns).sort();
    }
  }
});

console.log('=== Columns Extracted from Controllers ===\n');
Object.entries(columnsByTable).forEach(([table, columns]) => {
  console.log(`${table} (${columns.length} columns):`);
  console.log(`  ${columns.join(', ')}\n`);
});

// Now check database
async function checkDatabaseColumns() {
  const client = await db.pool.connect();
  try {
    console.log('=== Checking Database Columns ===\n');
    
    const missingColumns = [];
    
    for (const [tableName, expectedColumns] of Object.entries(columnsByTable)) {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [tableName]);
      
      if (tableCheck.rows.length === 0) {
        console.log(`⚠ Table "${tableName}" does not exist`);
        continue;
      }
      
      // Get existing columns
      const existingColumnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY column_name
      `, [tableName]);
      
      const existingColumns = existingColumnsResult.rows.map(r => r.column_name);
      
      // Find missing columns
      const missing = expectedColumns.filter(col => !existingColumns.includes(col));
      
      if (missing.length > 0) {
        console.log(`⚠ ${tableName} - Missing columns: ${missing.join(', ')}`);
        missing.forEach(col => {
          missingColumns.push({ table: tableName, column: col });
        });
      } else {
        console.log(`✓ ${tableName} - All columns exist`);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log(`\n=== Summary ===`);
      console.log(`Total missing columns: ${missingColumns.length}`);
      console.log('\nMissing columns:');
      missingColumns.forEach(({ table, column }) => {
        console.log(`  - ${table}.${column}`);
      });
    } else {
      console.log(`\n✓ All columns from controllers exist in database!`);
    }
    
    return missingColumns;
  } finally {
    client.release();
    await db.pool.end();
  }
}

if (require.main === module) {
  checkDatabaseColumns()
    .then(() => {
      console.log('\n✓ Check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { columnsByTable, checkDatabaseColumns };

