require('dotenv').config();
const db = require('./db');

const otSlots = [
  { OTId: 1, SlotStartTime: "08:00", SlotEndTime: "12:00", Status: "Active" },
  { OTId: 1, SlotStartTime: "12:00", SlotEndTime: "16:00", Status: "Active" },
  { OTId: 1, SlotStartTime: "16:00", SlotEndTime: "20:00", Status: "Active" },
  { OTId: 2, SlotStartTime: "09:00", SlotEndTime: "13:00", Status: "Active" },
  { OTId: 2, SlotStartTime: "13:00", SlotEndTime: "17:00", Status: "Active" },
  { OTId: 3, SlotStartTime: "08:30", SlotEndTime: "12:30", Status: "Active" }
];

async function main() {
  console.log('Creating OTSlot records...\n');
  
  const otResult = await db.query('SELECT "OTId", "OTNo" FROM "OT" ORDER BY "OTId"');
  if (otResult.rows.length === 0) {
    console.error('No OT records found. Please create OT records first.');
    await db.pool.end();
    process.exit(1);
  }
  console.log('Available OTs:');
  otResult.rows.forEach(ot => console.log(`  OTId: ${ot.OTId}, OTNo: ${ot.OTNo}`));
  console.log('');
  
  const results = [];
  for (const slot of otSlots) {
    try {
      const otCheck = await db.query('SELECT "OTId" FROM "OT" WHERE "OTId" = $1', [slot.OTId]);
      if (otCheck.rows.length === 0) {
        console.log(`Skipping OTId ${slot.OTId} - not found`);
        continue;
      }
      
      const maxNo = await db.query('SELECT COALESCE(MAX("OTSlotNo"), 0) + 1 AS next FROM "OTSlot" WHERE "OTId" = $1', [slot.OTId]);
      const slotNo = parseInt(maxNo.rows[0].next);
      
      const result = await db.query(
        'INSERT INTO "OTSlot" ("OTId", "OTSlotNo", "SlotStartTime", "SlotEndTime", "Status") VALUES ($1, $2, $3::time, $4::time, $5) RETURNING *',
        [slot.OTId, slotNo, slot.SlotStartTime, slot.SlotEndTime, slot.Status]
      );
      
      const created = result.rows[0];
      console.log(`✓ Created OTSlotId: ${created.OTSlotId}, OTSlotNo: ${created.OTSlotNo}, OTId: ${created.OTId}, Time: ${created.SlotStartTime} - ${created.SlotEndTime}`);
      results.push(created);
    } catch (error) {
      if (error.code === '23505') {
        console.log(`⚠ Slot already exists for OTId ${slot.OTId} at ${slot.SlotStartTime}-${slot.SlotEndTime}`);
      } else {
        console.error(`✗ Error creating slot for OTId ${slot.OTId}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Successfully created: ${results.length} OTSlot(s)`);
  
  await db.pool.end();
}

main()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
