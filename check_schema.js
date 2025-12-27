const pool = require('./db');

async function checkSchema() {
    try {
        console.log('Checking Bills table schema...');
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'Bills'
            ORDER BY ordinal_position
        `);

        console.log('Bills table columns:');
        result.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });

        console.log('\nChecking BillItems table schema...');
        const billItemsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'BillItems'
            ORDER BY ordinal_position
        `);

        console.log('BillItems table columns:');
        billItemsResult.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
