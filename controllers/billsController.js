const db = require('../db');

const allowedModeOfPayment = ['Cash', 'Card', 'Insurance', 'Scheme'];
const allowedPaidStatus = ['Paid', 'NotPaid'];
const allowedStatus = ['Active', 'Inactive'];

const mapBillRow = (row) => ({
  BillId: row.BillId || row.billid,
  BillNo: row.BillNo || row.billno,
  PatientId: row.PatientId || row.patientid || null,
  BillEntityId: row.BillEntityId || row.billentityid,
  ServiceId: row.ServiceId || row.serviceid || null,
  Quantity: row.Quantity || row.quantity || 1,
  Rate: row.Rate || row.rate,
  Amount: row.Amount || row.amount,
  BillDateTime: row.BillDateTime || row.billdatetime,
  ModeOfPayment: row.ModeOfPayment || row.modeofpayment || null,
  InsuranceReferenceNo: row.InsuranceReferenceNo || row.insurancereferenceno || null,
  InsuranceBillAmount: row.InsuranceBillAmount || row.insurancebillamount || null,
  SchemeReferenceNo: row.SchemeReferenceNo || row.schemereferenceno || null,
  PaidStatus: row.PaidStatus || row.paidstatus || 'NotPaid',
  Status: row.Status || row.status || 'Active',
  BillGeneratedBy: row.BillGeneratedBy || row.billgeneratedby || null,
  BillGeneratedAt: row.BillGeneratedAt || row.billgeneratedat,
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  BillEntity: row.BillEntity || row.billentity || null,
  GeneratedByUserName: row.UserName || row.username || null,
});

/**
 * Generate BillNo in format BILLYYYYMMXXXX
 * Example: BILL2025110001
 */
const generateBillNo = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;
  const pattern = `BILL${yearMonth}%`;

  // Find the highest sequence number for this year_month
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("BillNo" FROM 9) AS INT)), 0) + 1 AS next_seq
    FROM "Bills"
    WHERE "BillNo" LIKE $1
  `;

  const { rows } = await db.query(query, [pattern]);
  const nextSeq = rows[0].next_seq;

  // Format as BILLYYYYMMXXXX (4 digits with leading zeros)
  const billNo = `BILL${yearMonth}${String(nextSeq).padStart(4, '0')}`;
  return billNo;
};

exports.getAllBills = async (req, res) => {
  try {
    const { status, paidStatus, patientId, billEntityId, modeOfPayment, fromDate, toDate } = req.query;
    let query = `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        be."BillEntity",
        u."UserName"
      FROM "Bills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "BillEntity" be ON b."BillEntityId" = be."BillEntityId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`b."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (paidStatus) {
      conditions.push(`b."PaidStatus" = $${params.length + 1}`);
      params.push(paidStatus);
    }
    if (patientId) {
      const patientIdInt = parseInt(patientId, 10);
      if (!isNaN(patientIdInt)) {
        conditions.push(`b."PatientId" = $${params.length + 1}`);
        params.push(patientIdInt);
      }
    }
    if (billEntityId) {
      const billEntityIdInt = parseInt(billEntityId, 10);
      if (!isNaN(billEntityIdInt)) {
        conditions.push(`b."BillEntityId" = $${params.length + 1}`);
        params.push(billEntityIdInt);
      }
    }
    if (modeOfPayment) {
      conditions.push(`b."ModeOfPayment" = $${params.length + 1}`);
      params.push(modeOfPayment);
    }
    if (fromDate) {
      conditions.push(`b."BillDateTime" >= $${params.length + 1}`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`b."BillDateTime" <= $${params.length + 1}`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY b."BillDateTime" DESC, b."BillGeneratedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapBillRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message,
    });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid BillId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        be."BillEntity",
        u."UserName"
      FROM "Bills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "BillEntity" be ON b."BillEntityId" = be."BillEntityId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillId" = $1
      `,
      [billId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.status(200).json({ success: true, data: mapBillRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message,
    });
  }
};

exports.getBillByBillNo = async (req, res) => {
  try {
    const { billNo } = req.params;
    
    if (!billNo || !billNo.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'BillNo is required' 
      });
    }

    const { rows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        be."BillEntity",
        u."UserName"
      FROM "Bills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "BillEntity" be ON b."BillEntityId" = be."BillEntityId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillNo" = $1
      `,
      [billNo.trim()]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found with the given bill number' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: mapBillRow(rows[0]) 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bill by bill number',
      error: error.message,
    });
  }
};

exports.getBillsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientIdInt = parseInt(patientId, 10);
    
    if (isNaN(patientIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PatientId. Must be an integer.' 
      });
    }

    const { rows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        be."BillEntity",
        u."UserName"
      FROM "Bills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "BillEntity" be ON b."BillEntityId" = be."BillEntityId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."PatientId" = $1
      ORDER BY b."BillDateTime" DESC
      `,
      [patientIdInt]
    );
    
    res.status(200).json({ 
      success: true,
      count: rows.length,
      patientId: patientIdInt,
      data: rows.map(mapBillRow)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bills by patient ID',
      error: error.message,
    });
  }
};

const validateBillPayload = (body, requireAll = true) => {
  const errors = [];
  
  if (requireAll && !body.BillEntityId) {
    errors.push('BillEntityId is required');
  }
  
  if (body.BillEntityId) {
    const billEntityIdInt = parseInt(body.BillEntityId, 10);
    if (isNaN(billEntityIdInt)) {
      errors.push('BillEntityId must be a valid integer');
    }
  }
  
  if (body.PatientId !== undefined && body.PatientId !== null && body.PatientId !== '') {
    const patientIdInt = parseInt(body.PatientId, 10);
    if (isNaN(patientIdInt)) {
      errors.push('PatientId must be a valid integer or null');
    }
  }
  
  if (requireAll && (!body.Rate || isNaN(parseFloat(body.Rate)))) {
    errors.push('Rate is required and must be a valid number');
  }
  
  if (requireAll && (!body.Amount || isNaN(parseFloat(body.Amount)))) {
    errors.push('Amount is required and must be a valid number');
  }
  
  if (requireAll && !body.BillDateTime) {
    errors.push('BillDateTime is required');
  }
  
  if (body.ModeOfPayment && !allowedModeOfPayment.includes(body.ModeOfPayment)) {
    errors.push(`ModeOfPayment must be one of: ${allowedModeOfPayment.join(', ')}`);
  }
  
  if (body.PaidStatus && !allowedPaidStatus.includes(body.PaidStatus)) {
    errors.push('PaidStatus must be Paid or NotPaid');
  }
  
  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }
  
  return errors;
};

exports.createBill = async (req, res) => {
  try {
    const errors = validateBillPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BillNo,
      PatientId,
      BillEntityId,
      ServiceId,
      Quantity = 1,
      Rate,
      Amount,
      BillDateTime,
      ModeOfPayment,
      InsuranceReferenceNo,
      InsuranceBillAmount,
      SchemeReferenceNo,
      PaidStatus = 'NotPaid',
      Status = 'Active',
      BillGeneratedBy,
    } = req.body;

    // Generate BillNo if not provided
    let billNoValue;
    if (BillNo && BillNo.trim()) {
      billNoValue = BillNo.trim();
      // Check if BillNo already exists
      const existingBill = await db.query(
        'SELECT "BillId" FROM "Bills" WHERE "BillNo" = $1',
        [billNoValue]
      );
      if (existingBill.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bill number already exists',
        });
      }
    } else {
      billNoValue = await generateBillNo();
    }

    // Validate BillEntityId exists
    const billEntityIdInt = parseInt(BillEntityId, 10);
    if (isNaN(billEntityIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'BillEntityId must be a valid integer',
      });
    }
    const billEntityCheck = await db.query(
      'SELECT "BillEntityId" FROM "BillEntity" WHERE "BillEntityId" = $1',
      [billEntityIdInt]
    );
    if (billEntityCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'BillEntityId does not exist',
      });
    }

    // Validate PatientId if provided
    let patientIdValue = null;
    if (PatientId !== undefined && PatientId !== null && PatientId !== '') {
      const patientIdInt = parseInt(PatientId, 10);
      if (isNaN(patientIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'PatientId must be a valid integer or null',
        });
      }
      const patientCheck = await db.query(
        'SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1',
        [patientIdInt]
      );
      if (patientCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'PatientId does not exist',
        });
      }
      patientIdValue = patientIdInt;
    }

    // Validate BillGeneratedBy if provided
    let generatedByValue = null;
    if (BillGeneratedBy !== undefined && BillGeneratedBy !== null && BillGeneratedBy !== '') {
      const generatedByInt = parseInt(BillGeneratedBy, 10);
      if (isNaN(generatedByInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'BillGeneratedBy must be a valid integer. Leave it empty or null if not needed.' 
        });
      }
      generatedByValue = generatedByInt;
    }

    // Parse numeric values
    const quantityValue = Quantity ? parseFloat(Quantity) : 1;
    const rateValue = parseFloat(Rate);
    const amountValue = parseFloat(Amount);
    const insuranceBillAmountValue = InsuranceBillAmount ? parseFloat(InsuranceBillAmount) : null;

    if (isNaN(rateValue) || rateValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Rate must be a valid positive number',
      });
    }

    if (isNaN(amountValue) || amountValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number',
      });
    }

    // BillId is auto-generated by PostgreSQL SERIAL, so we don't include it in INSERT
    const insertQuery = `
      INSERT INTO "Bills"
        ("BillNo", "PatientId", "BillEntityId", "ServiceId", "Quantity", "Rate", "Amount", 
         "BillDateTime", "ModeOfPayment", "InsuranceReferenceNo", "InsuranceBillAmount", 
         "SchemeReferenceNo", "PaidStatus", "Status", "BillGeneratedBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      billNoValue,
      patientIdValue,
      billEntityIdInt,
      ServiceId ? ServiceId.trim() : null,
      quantityValue,
      rateValue,
      amountValue,
      BillDateTime,
      ModeOfPayment || null,
      InsuranceReferenceNo ? InsuranceReferenceNo.trim() : null,
      insuranceBillAmountValue,
      SchemeReferenceNo ? SchemeReferenceNo.trim() : null,
      PaidStatus,
      Status,
      generatedByValue,
    ]);

    // Fetch with related data
    const { rows: newRows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        be."BillEntity",
        u."UserName"
      FROM "Bills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "BillEntity" be ON b."BillEntityId" = be."BillEntityId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillId" = $1
      `,
      [rows[0].BillId]
    );

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: mapBillRow(newRows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Bill number already exists',
        error: error.message,
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint violation. Please check BillEntityId, PatientId, or BillGeneratedBy.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message,
    });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const errors = validateBillPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const { id } = req.params;
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid BillId. Must be an integer.' 
      });
    }

    const {
      BillNo,
      PatientId,
      BillEntityId,
      ServiceId,
      Quantity,
      Rate,
      Amount,
      BillDateTime,
      ModeOfPayment,
      InsuranceReferenceNo,
      InsuranceBillAmount,
      SchemeReferenceNo,
      PaidStatus,
      Status,
      BillGeneratedBy,
    } = req.body;

    // Validate BillNo if being updated
    if (BillNo) {
      const existingBill = await db.query(
        'SELECT "BillId" FROM "Bills" WHERE "BillNo" = $1 AND "BillId" != $2',
        [BillNo.trim(), billId]
      );
      if (existingBill.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bill number already exists',
        });
      }
    }

    // Validate BillEntityId if provided
    let billEntityIdValue = null;
    if (BillEntityId !== undefined && BillEntityId !== null && BillEntityId !== '') {
      const billEntityIdInt = parseInt(BillEntityId, 10);
      if (isNaN(billEntityIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'BillEntityId must be a valid integer',
        });
      }
      const billEntityCheck = await db.query(
        'SELECT "BillEntityId" FROM "BillEntity" WHERE "BillEntityId" = $1',
        [billEntityIdInt]
      );
      if (billEntityCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'BillEntityId does not exist',
        });
      }
      billEntityIdValue = billEntityIdInt;
    }

    // Validate PatientId if provided
    let patientIdValue = null;
    if (PatientId !== undefined && PatientId !== null && PatientId !== '') {
      const patientIdInt = parseInt(PatientId, 10);
      if (isNaN(patientIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'PatientId must be a valid integer or null',
        });
      }
      if (patientIdInt !== null) {
        const patientCheck = await db.query(
          'SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1',
          [patientIdInt]
        );
        if (patientCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'PatientId does not exist',
          });
        }
      }
      patientIdValue = patientIdInt;
    }

    // Validate BillGeneratedBy if provided
    let generatedByValue = null;
    if (BillGeneratedBy !== undefined && BillGeneratedBy !== null && BillGeneratedBy !== '') {
      const generatedByInt = parseInt(BillGeneratedBy, 10);
      if (isNaN(generatedByInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'BillGeneratedBy must be a valid integer. Leave it empty or null if not needed.' 
        });
      }
      generatedByValue = generatedByInt;
    }

    // Parse numeric values if provided
    const quantityValue = Quantity !== undefined ? parseFloat(Quantity) : null;
    const rateValue = Rate !== undefined ? parseFloat(Rate) : null;
    const amountValue = Amount !== undefined ? parseFloat(Amount) : null;
    const insuranceBillAmountValue = InsuranceBillAmount !== undefined ? (InsuranceBillAmount ? parseFloat(InsuranceBillAmount) : null) : null;

    if (rateValue !== null && (isNaN(rateValue) || rateValue < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Rate must be a valid positive number',
      });
    }

    if (amountValue !== null && (isNaN(amountValue) || amountValue < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number',
      });
    }

    const updateQuery = `
      UPDATE "Bills"
      SET
        "BillNo" = COALESCE($1, "BillNo"),
        "PatientId" = COALESCE($2, "PatientId"),
        "BillEntityId" = COALESCE($3, "BillEntityId"),
        "ServiceId" = COALESCE($4, "ServiceId"),
        "Quantity" = COALESCE($5, "Quantity"),
        "Rate" = COALESCE($6, "Rate"),
        "Amount" = COALESCE($7, "Amount"),
        "BillDateTime" = COALESCE($8, "BillDateTime"),
        "ModeOfPayment" = COALESCE($9, "ModeOfPayment"),
        "InsuranceReferenceNo" = COALESCE($10, "InsuranceReferenceNo"),
        "InsuranceBillAmount" = COALESCE($11, "InsuranceBillAmount"),
        "SchemeReferenceNo" = COALESCE($12, "SchemeReferenceNo"),
        "PaidStatus" = COALESCE($13, "PaidStatus"),
        "Status" = COALESCE($14, "Status"),
        "BillGeneratedBy" = COALESCE($15, "BillGeneratedBy")
      WHERE "BillId" = $16
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, [
      BillNo ? BillNo.trim() : null,
      patientIdValue,
      billEntityIdValue,
      ServiceId ? ServiceId.trim() : null,
      quantityValue,
      rateValue,
      amountValue,
      BillDateTime || null,
      ModeOfPayment || null,
      InsuranceReferenceNo ? InsuranceReferenceNo.trim() : null,
      insuranceBillAmountValue,
      SchemeReferenceNo ? SchemeReferenceNo.trim() : null,
      PaidStatus || null,
      Status || null,
      generatedByValue,
      billId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Fetch with related data
    const { rows: updatedRows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        be."BillEntity",
        u."UserName"
      FROM "Bills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "BillEntity" be ON b."BillEntityId" = be."BillEntityId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillId" = $1
      `,
      [billId]
    );

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: mapBillRow(updatedRows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Bill number already exists',
        error: error.message,
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint violation. Please check BillEntityId, PatientId, or BillGeneratedBy.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating bill',
      error: error.message,
    });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid BillId. Must be an integer.' 
      });
    }
    const { rows } = await db.query(
      'DELETE FROM "Bills" WHERE "BillId" = $1 RETURNING *;',
      [billId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
      data: mapBillRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bill',
      error: error.message,
    });
  }
};

