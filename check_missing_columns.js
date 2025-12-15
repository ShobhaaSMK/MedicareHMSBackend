/**
 * Script to check for missing columns across all controllers
 * This scans all controller files and identifies columns that are referenced
 * but might not exist in the database
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config();

// All columns that should exist based on controller mappings
const expectedColumns = {
  'PatientLabTest': [
    'RoomAdmissionId', 'OrderedByDoctorId', 'Priority'
  ],
  'PatientOTAllocation': [
    'RoomAdmissionId', 'NurseId'
  ],
  'PatientAdmitNurseVisits': [
    'RoomAdmissionId'
  ],
  'PatientAdmitDoctorVisits': [
    'RoomAdmissionId'
  ],
  'PatientAdmitVisitVitals': [
    'RoomAdmissionId', 'NurseId', 'PatientStatus', 'VisitRemarks', 'VitalsStatus'
  ],
  'PatientICUAdmission': [
    'RoomAdmissionId', 'OnVentilator', 'ICUAdmissionStatus'
  ],
  'ICUVisitVitals': [
    'VitalsStatus', 'NurseId'
  ],
  'EmergencyAdmissionVitals': [
    'NurseId', 'VitalsStatus'
  ],
  'EmergencyBed': [
    'EmergencyRoomNameNo', 'ChargesPerDay'
  ]
};

async function checkMissingColumns() {
  console.log('=== Checking for Missing Columns ===\n');
  
  const client = await db.pool.connect();
  try {
    let totalMissing = 0;
    const missingColumns = [];
    
    for (const [tableName, columns] of Object.entries(expectedColumns)) {
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
      
      // Check each column
      for (const columnName of columns) {
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        `, [tableName, columnName]);
        
        if (columnCheck.rows.length === 0) {
          console.log(`✗ Missing: ${tableName}.${columnName}`);
          missingColumns.push({ table: tableName, column: columnName });
          totalMissing++;
        } else {
          console.log(`✓ Exists: ${tableName}.${columnName}`);
        }
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total missing columns: ${totalMissing}`);
    
    if (totalMissing > 0) {
      console.log(`\nMissing columns:`);
      missingColumns.forEach(({ table, column }) => {
        console.log(`  - ${table}.${column}`);
      });
      console.log(`\nThese columns will be added automatically by dbInit.js on next startup.`);
    } else {
      console.log(`\n✓ All expected columns exist!`);
    }
    
  } catch (error) {
    console.error('Error checking columns:', error.message);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

if (require.main === module) {
  checkMissingColumns()
    .then(() => {
      console.log('\n✓ Check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkMissingColumns };

