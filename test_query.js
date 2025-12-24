require('dotenv').config();
const db = require('./db');

/**
 * Simple script to test/execute SQL queries
 * Usage: node test_query.js
 * 
 * Modify the query variable below to test your queries
 */

async function testQuery() {
  try {
    // ============================================
    // MODIFY THIS QUERY TO TEST YOUR QUERIES
    // ============================================
    const query = `
      SELECT COUNT(*) as activeICUBedsCount
      FROM "ICU"
      WHERE "Status" = 'Active'
    `;

    console.log('Executing query...');
    console.log('Query:', query);
    console.log('');

    const { rows } = await db.query(query);

    console.log(`Query returned ${rows.length} row(s):`);
    console.log('='.repeat(80));
    
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
      console.log('');
      rows.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
        console.log('');
      });
    } else {
      console.log('No rows returned');
    }

    console.log('='.repeat(80));
    console.log('Query executed successfully!');

  } catch (error) {
    console.error('Error executing query:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Detail:', error.detail);
    console.error('Error Position:', error.position);
  } finally {
    await db.pool.end();
    process.exit(0);
  }
}

// Run the test
testQuery();

