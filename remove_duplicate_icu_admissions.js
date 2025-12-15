const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'hms'
});

async function removeDuplicateICUAdmissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Finding duplicate ICU admissions...\n');
    
    // Find all ICUIds with multiple records
    const duplicatesQuery = `
      SELECT "ICUId", COUNT(*) as count
      FROM "PatientICUAdmission"
      GROUP BY "ICUId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    const duplicatesResult = await client.query(duplicatesQuery);
    
    if (duplicatesResult.rows.length === 0) {
      console.log('✓ No duplicates found!');
      await client.query('COMMIT');
      return;
    }
    
    console.log(`Found ${duplicatesResult.rows.length} ICUId(s) with duplicates:\n`);
    duplicatesResult.rows.forEach(row => {
      console.log(`  - ICUId ${row.ICUId}: ${row.count} records`);
    });
    console.log('');
    
    let totalDeleted = 0;
    
    // For each ICUId with duplicates, keep the most recent one and delete the rest
    for (const row of duplicatesResult.rows) {
      const icuId = row.ICUId;
      
      // Get all records for this ICUId, ordered by most recent first
      const recordsQuery = `
        SELECT "PatientICUAdmissionId", 
               "ICUAllocationFromDate", 
               "ICUAllocationCreatedAt"
        FROM "PatientICUAdmission"
        WHERE "ICUId" = $1
        ORDER BY 
          COALESCE("ICUAllocationFromDate", "ICUAllocationCreatedAt", '1970-01-01'::timestamp) DESC,
          "ICUAllocationCreatedAt" DESC NULLS LAST
      `;
      
      const recordsResult = await client.query(recordsQuery, [icuId]);
      
      if (recordsResult.rows.length <= 1) {
        continue;
      }
      
      // Keep the first (most recent) record, delete the rest
      const recordsToKeep = recordsResult.rows[0];
      const recordsToDelete = recordsResult.rows.slice(1);
      
      console.log(`📋 ICUId ${icuId}:`);
      console.log(`   Keeping: ${recordsToKeep.PatientICUAdmissionId} (Date: ${recordsToKeep.ICUAllocationFromDate || recordsToKeep.ICUAllocationCreatedAt || 'N/A'})`);
      
      for (const record of recordsToDelete) {
        const deleteQuery = `
          DELETE FROM "PatientICUAdmission"
          WHERE "PatientICUAdmissionId" = $1
        `;
        
        await client.query(deleteQuery, [record.PatientICUAdmissionId]);
        console.log(`   Deleting: ${record.PatientICUAdmissionId} (Date: ${record.ICUAllocationFromDate || record.ICUAllocationCreatedAt || 'N/A'})`);
        totalDeleted++;
      }
      console.log('');
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ Summary:`);
    console.log(`   - Total records deleted: ${totalDeleted}`);
    console.log(`   - ICUIds cleaned: ${duplicatesResult.rows.length}`);
    
    // Verify no duplicates remain
    const verifyQuery = `
      SELECT "ICUId", COUNT(*) as count
      FROM "PatientICUAdmission"
      GROUP BY "ICUId"
      HAVING COUNT(*) > 1
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    if (verifyResult.rows.length === 0) {
      console.log(`\n✓ Verification: No duplicates remain!`);
    } else {
      console.log(`\n⚠ Warning: Some duplicates may still exist:`);
      verifyResult.rows.forEach(row => {
        console.log(`   - ICUId ${row.ICUId}: ${row.count} records`);
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error removing duplicates:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the cleanup
removeDuplicateICUAdmissions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });

