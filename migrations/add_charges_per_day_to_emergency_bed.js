require('dotenv').config();
const db = require('../db');

/**
 * Migration script to add ChargesPerDay column to EmergencyBed table
 * Run this script to update existing databases
 */
async function addChargesPerDayColumn() {
  try {
    console.log('Checking if ChargesPerDay column exists...');
    
    // Check if column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'EmergencyBed' 
      AND column_name = 'ChargesPerDay'
    `;
    
    const { rows } = await db.query(checkQuery);
    
    if (rows.length > 0) {
      console.log('✓ ChargesPerDay column already exists in EmergencyBed table');
      return { success: true, message: 'Column already exists' };
    }
    
    // Add the column
    console.log('Adding ChargesPerDay column to EmergencyBed table...');
    await db.query(`
      ALTER TABLE "EmergencyBed" 
      ADD COLUMN "ChargesPerDay" DECIMAL(10, 2)
    `);
    
    console.log('✓ Successfully added ChargesPerDay column to EmergencyBed table');
    return { success: true, message: 'Column added successfully' };
  } catch (error) {
    console.error('✗ Error adding ChargesPerDay column:', error.message);
    return { success: false, message: error.message };
  } finally {
    await db.pool.end();
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  addChargesPerDayColumn()
    .then((result) => {
      if (result.success) {
        console.log('\nMigration completed successfully!');
        process.exit(0);
      } else {
        console.error('\nMigration failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = addChargesPerDayColumn;

