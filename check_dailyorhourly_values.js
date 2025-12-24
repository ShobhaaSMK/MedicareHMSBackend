const db = require('./db');

async function checkValues() {
  try {
    const patientResult = await db.query('SELECT DISTINCT "DailyOrHourlyVitals" FROM "PatientAdmitVisitVitals"');
    console.log('PatientAdmitVisitVitals values:', patientResult.rows);

    const icuResult = await db.query('SELECT DISTINCT "DailyOrHourlyVitals" FROM "ICUVisitVitals"');
    console.log('ICUVisitVitals values:', icuResult.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkValues();