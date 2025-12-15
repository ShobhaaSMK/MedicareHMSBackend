/**
 * Script to analyze all routes and controllers to identify
 * all required tables and columns for the initialization script
 */

const fs = require('fs');
const path = require('path');

// Read all route files to identify controllers
const routesDir = path.join(__dirname, 'routes');
const controllersDir = path.join(__dirname, 'controllers');

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

console.log('=== Analyzing Routes and Controllers ===\n');

// Extract table names from SQL queries in controllers
const tablePattern = /FROM\s+"(\w+)"|INTO\s+"(\w+)"|UPDATE\s+"(\w+)"|JOIN\s+"(\w+)"/gi;
const columnPattern = /"(\w+)"/g;

const tablesUsed = new Set();
const columnsByTable = {};

// Scan all controller files
controllerFiles.forEach(file => {
  const filePath = path.join(controllersDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract table names
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    const tableName = match[1] || match[2] || match[3] || match[4];
    if (tableName) {
      tablesUsed.add(tableName);
    }
  }
  
  // Extract column references from map functions
  const mapFunctionMatch = content.match(/const\s+map\w+Row\s*=\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/gs);
  if (mapFunctionMatch) {
    mapFunctionMatch.forEach(mapFunc => {
      const columnMatches = mapFunc.matchAll(/"(\w+)":/g);
      for (const colMatch of columnMatches) {
        const columnName = colMatch[1];
        // Try to determine which table this belongs to
        const tableMatch = file.match(/(\w+)Controller\.js/);
        if (tableMatch) {
          const tableName = tableMatch[1]
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          
          // Common table name patterns
          let actualTableName = tableName;
          if (tableName.includes('Patient')) {
            actualTableName = tableName;
          } else if (tableName.includes('Emergency')) {
            actualTableName = tableName;
          } else if (tableName.includes('ICU')) {
            actualTableName = tableName;
          } else if (tableName.includes('Room')) {
            actualTableName = tableName;
          } else if (tableName.includes('OT')) {
            actualTableName = tableName;
          }
          
          if (!columnsByTable[actualTableName]) {
            columnsByTable[actualTableName] = new Set();
          }
          columnsByTable[actualTableName].add(columnName);
        }
      }
    });
  }
});

console.log('Tables found in controllers:');
console.log(Array.from(tablesUsed).sort().join(', '));
console.log(`\nTotal: ${tablesUsed.size} tables\n`);

// Read init_tables.sql to see what tables are defined
const initTablesPath = path.join(__dirname, 'init_tables.sql');
const initTablesContent = fs.readFileSync(initTablesPath, 'utf8');

const definedTables = new Set();
const createTablePattern = /CREATE TABLE IF NOT EXISTS\s+"(\w+)"/gi;
let tableMatch;
while ((tableMatch = createTablePattern.exec(initTablesContent)) !== null) {
  definedTables.add(tableMatch[1]);
}

console.log('Tables defined in init_tables.sql:');
console.log(Array.from(definedTables).sort().join(', '));
console.log(`\nTotal: ${definedTables.size} tables\n`);

// Find missing tables
const missingTables = Array.from(tablesUsed).filter(t => !definedTables.has(t));
if (missingTables.length > 0) {
  console.log('⚠️  Missing tables:');
  missingTables.forEach(t => console.log(`  - ${t}`));
} else {
  console.log('✓ All tables are defined in init_tables.sql');
}

// Check for PatientAdmitNurseVisits table (might be referenced but not in routes)
const allExpectedTables = [
  'Roles', 'Users', 'DoctorDepartment', 'PatientRegistration',
  'RoomBeds', 'LabTest', 'ICU', 'EmergencyBed', 'EmergencyBedSlot',
  'OT', 'OTSlot', 'PatientAppointment', 'PatientLabTest',
  'RoomAdmission', 'EmergencyAdmission', 'EmergencyAdmissionVitals',
  'PatientOTAllocation', 'PatientOTAllocationSlots',
  'PatientAdmitNurseVisits', 'PatientAdmitDoctorVisits',
  'PatientAdmitVisitVitals', 'PatientICUAdmission',
  'ICUDoctorVisits', 'ICUVisitVitals', 'SurgeryProcedure',
  'Bills', 'BillEntity', 'AuditLog'
];

console.log('\n=== Expected Tables Check ===');
const missingExpectedTables = allExpectedTables.filter(t => !definedTables.has(t));
if (missingExpectedTables.length > 0) {
  console.log('⚠️  Missing expected tables:');
  missingExpectedTables.forEach(t => console.log(`  - ${t}`));
} else {
  console.log('✓ All expected tables are defined');
}

// Now check columns in init_tables.sql vs what controllers expect
console.log('\n=== Column Analysis ===');
console.log('Note: This requires manual review of controllers to identify all required columns.');
console.log('The dbInit.js ensureAllTablesAndColumns() function handles missing columns automatically.');

// Write a summary report
const report = {
  tablesFound: Array.from(tablesUsed).sort(),
  tablesDefined: Array.from(definedTables).sort(),
  missingTables: missingTables,
  expectedTables: allExpectedTables,
  missingExpectedTables: missingExpectedTables,
  timestamp: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, 'table_analysis_report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✓ Analysis complete. Report saved to table_analysis_report.json');

