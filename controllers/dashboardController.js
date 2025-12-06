const db = require('../db');

/**
 * Get ICU Occupied patients count
 * Fetches count from PatientICUAdmission table joined with ICU table
 * where ICUAdmissionStatus = 'Occupied' and Status = 'Active'
 */
exports.getICUOccupiedPatientsCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "PatientICUAdmission" pica
      INNER JOIN "ICU" icu ON pica."ICUId" = icu."ICUId"
      WHERE pica."ICUAdmissionStatus" = 'Occupied'
      AND pica."Status" = 'Active'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'ICU occupied patients count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'PatientICUAdmission joined with ICU',
          conditions: {
            icuAdmissionStatus: 'Occupied',
            status: 'Active'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICU occupied patients count',
      error: error.message,
    });
  }
};

/**
 * Get Total ICU Count
 * Fetches count of active ICU records from ICU table where Status = 'Active'
 */
exports.getTotalICUCount = async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM "ICU"
      WHERE "Status" = 'Active'
    `;

    const { rows } = await db.query(query);

    const count = parseInt(rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      message: 'Total ICU count retrieved successfully',
      count: count,
      data: {
        count: count,
        criteria: {
          table: 'ICU',
          conditions: {
            status: 'Active'
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching total ICU count',
      error: error.message,
    });
  }
};
