const pool = require('./db');

async function renameBillsCreatedAtToBillGeneratedAt() {
    try {
        console.log('Starting migration: Rename CreatedAt to BillGeneratedAt in Bills table');

        // Check if Bills table exists
        const tableCheckQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'Bills'
            );
        `;

        const tableCheckResult = await pool.query(tableCheckQuery);

        if (!tableCheckResult.rows[0].exists) {
            console.log('Bills table does not exist. Skipping migration.');
            return;
        }

        // Check if CreatedAt column exists
        const columnCheckQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'Bills'
                AND column_name = 'CreatedAt'
            );
        `;

        const columnCheckResult = await pool.query(columnCheckQuery);

        if (!columnCheckResult.rows[0].exists) {
            console.log('CreatedAt column does not exist in Bills table. Migration may already be applied.');
            return;
        }

        // Check if BillGeneratedAt column already exists
        const newColumnCheckQuery = `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'Bills'
                AND column_name = 'BillGeneratedAt'
            );
        `;

        const newColumnCheckResult = await pool.query(newColumnCheckQuery);

        if (newColumnCheckResult.rows[0].exists) {
            console.log('BillGeneratedAt column already exists. Migration may already be applied.');
            return;
        }

        // Rename the column
        const renameQuery = `
            ALTER TABLE "Bills"
            RENAME COLUMN "CreatedAt" TO "BillGeneratedAt";
        `;

        await pool.query(renameQuery);
        console.log('✅ Successfully renamed CreatedAt to BillGeneratedAt in Bills table');

        // Update any existing records to set BillGeneratedAt if it's null
        const updateQuery = `
            UPDATE "Bills"
            SET "BillGeneratedAt" = CURRENT_TIMESTAMP
            WHERE "BillGeneratedAt" IS NULL;
        `;

        const updateResult = await pool.query(updateQuery);
        console.log(`✅ Updated ${updateResult.rowCount} records with current timestamp for BillGeneratedAt`);

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    }
}

// Run the migration
if (require.main === module) {
    renameBillsCreatedAtToBillGeneratedAt()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = renameBillsCreatedAtToBillGeneratedAt;
