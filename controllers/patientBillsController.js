const db = require('../db');
const { randomUUID } = require('crypto');

const allowedBillType = ['OPD', 'IPD', 'Emergency', 'LabTest', 'Pharmacy'];
const allowedPaidStatus = ['Pending', 'Partial', 'Paid'];
const allowedModeOfPayment = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'NetBanking', 'Insurance', 'Cheque', 'Wallet(Paytm/PhonePe)', 'Scheme'];
const allowedStatus = ['Active', 'Inactive'];

const mapPatientBillRow = (row) => ({
  BillId: row.BillId || row.billid,
  BillNo: row.BillNo || row.billno,
  PatientId: row.PatientId || row.patientid || null,
  BillType: row.BillType || row.billtype || null,
  DepartmentId: row.DepartmentId || row.departmentid || null,
  DoctorId: row.DoctorId || row.doctorid || null,
  BillDateTime: row.BillDateTime || row.billdatetime,
  TotalAmount: row.TotalAmount !== undefined && row.TotalAmount !== null ? parseFloat(row.TotalAmount) : (row.totalamount !== undefined && row.totalamount !== null ? parseFloat(row.totalamount) : null),
  PaidStatus: row.PaidStatus || row.paidstatus || 'Pending',
  PaidAmount: row.PaidAmount !== undefined && row.PaidAmount !== null ? parseFloat(row.PaidAmount) : (row.paidamount !== undefined && row.paidamount !== null ? parseFloat(row.paidamount) : null),
  PartialPaidAmount: row.PartialPaidAmount !== undefined && row.PartialPaidAmount !== null ? parseFloat(row.PartialPaidAmount) : (row.partialpaidamount !== undefined && row.partialpaidamount !== null ? parseFloat(row.partialpaidamount) : null),
  Balance: row.Balance !== undefined && row.Balance !== null ? parseFloat(row.Balance) : (row.balance !== undefined && row.balance !== null ? parseFloat(row.balance) : null),
  ModeOfPayment: row.ModeOfPayment || row.modeofpayment || null,
  InsuranceReferenceNo: row.InsuranceReferenceNo || row.insurancereferenceno || null,
  InsuranceBillAmount: row.InsuranceBillAmount !== undefined && row.InsuranceBillAmount !== null ? parseFloat(row.InsuranceBillAmount) : (row.insurancebillamount !== undefined && row.insurancebillamount !== null ? parseFloat(row.insurancebillamount) : null),
  SchemeReferenceNo: row.SchemeReferenceNo || row.schemereferenceno || null,
  Status: row.Status || row.status || 'Active',
  BillGeneratedBy: row.BillGeneratedBy || row.billgeneratedby || null,
  BillGeneratedAt: row.BillGeneratedAt || row.billgeneratedat,
  // Joined fields
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  DepartmentName: row.DepartmentName || row.departmentname || null,
  DoctorName: row.DoctorName || row.doctorname || null,
  GeneratedByUserName: row.GeneratedByUserName || row.generatedbyusername || null,
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
    FROM "PatientBills"
    WHERE "BillNo" LIKE $1
  `;

  const { rows } = await db.query(query, [pattern]);
  const nextSeq = rows[0].next_seq;

  // Format as BILLYYYYMMXXXX (4 digits with leading zeros)
  const billNo = `BILL${yearMonth}${String(nextSeq).padStart(4, '0')}`;
  return billNo;
};

exports.getAllPatientBills = async (req, res) => {
  try {
    const { status, paidStatus, patientId, billType, departmentId, doctorId, modeOfPayment, fromDate, toDate } = req.query;
    let query = `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        dd."DepartmentName",
        d."UserName" AS "DoctorName",
        u."UserName" AS "GeneratedByUserName"
      FROM "PatientBills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
      LEFT JOIN "Users" d ON b."DoctorId" = d."UserId"
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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(patientId)) {
        conditions.push(`b."PatientId" = $${params.length + 1}::uuid`);
        params.push(patientId);
      }
    }
    if (billType) {
      conditions.push(`b."BillType" = $${params.length + 1}`);
      params.push(billType);
    }
    if (departmentId) {
      const departmentIdInt = parseInt(departmentId, 10);
      if (!isNaN(departmentIdInt)) {
        conditions.push(`b."DepartmentId" = $${params.length + 1}`);
        params.push(departmentIdInt);
      }
    }
    if (doctorId) {
      const doctorIdInt = parseInt(doctorId, 10);
      if (!isNaN(doctorIdInt)) {
        conditions.push(`b."DoctorId" = $${params.length + 1}`);
        params.push(doctorIdInt);
      }
    }
    if (modeOfPayment) {
      conditions.push(`b."ModeOfPayment" = $${params.length + 1}`);
      params.push(modeOfPayment);
    }
    if (fromDate) {
      conditions.push(`b."BillDateTime" >= $${params.length + 1}::timestamp`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`b."BillDateTime" <= $${params.length + 1}::timestamp`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY b."BillDateTime" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapPatientBillRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient bills',
      error: error.message,
    });
  }
};

exports.getPatientBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        dd."DepartmentName",
        d."UserName" AS "DoctorName",
        u."UserName" AS "GeneratedByUserName"
      FROM "PatientBills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
      LEFT JOIN "Users" d ON b."DoctorId" = d."UserId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillId" = $1::uuid
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient bill not found' });
    }
    res.status(200).json({ success: true, data: mapPatientBillRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient bill',
      error: error.message,
    });
  }
};

exports.getPatientBillByBillNo = async (req, res) => {
  try {
    const { billNo } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        dd."DepartmentName",
        d."UserName" AS "DoctorName",
        u."UserName" AS "GeneratedByUserName"
      FROM "PatientBills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
      LEFT JOIN "Users" d ON b."DoctorId" = d."UserId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillNo" = $1
      `,
      [billNo]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient bill not found' });
    }
    res.status(200).json({ success: true, data: mapPatientBillRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient bill',
      error: error.message,
    });
  }
};

const validatePatientBillPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && (!body.PatientId || body.PatientId === '')) {
    errors.push('PatientId is required');
  }
  if (body.PatientId !== undefined && body.PatientId !== null && body.PatientId !== '') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.PatientId)) {
      errors.push('PatientId must be a valid UUID');
    }
  }

  if (requireAll && (!body.BillType || body.BillType === '')) {
    errors.push('BillType is required');
  }
  if (body.BillType !== undefined && body.BillType !== null && body.BillType !== '') {
    if (!allowedBillType.includes(body.BillType)) {
      errors.push(`BillType must be one of: ${allowedBillType.join(', ')}`);
    }
  }

  if (body.DepartmentId !== undefined && body.DepartmentId !== null && body.DepartmentId !== '') {
    const departmentIdInt = parseInt(body.DepartmentId, 10);
    if (isNaN(departmentIdInt)) {
      errors.push('DepartmentId must be a valid integer');
    }
  }

  if (body.DoctorId !== undefined && body.DoctorId !== null && body.DoctorId !== '') {
    const doctorIdInt = parseInt(body.DoctorId, 10);
    if (isNaN(doctorIdInt)) {
      errors.push('DoctorId must be a valid integer');
    }
  }

  if (requireAll && (!body.BillDateTime || body.BillDateTime === '')) {
    errors.push('BillDateTime is required');
  }
  if (body.BillDateTime && body.BillDateTime !== '' && !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/.test(body.BillDateTime)) {
    errors.push('BillDateTime must be in ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)');
  }

  if (requireAll && (body.TotalAmount === undefined || body.TotalAmount === null || body.TotalAmount === '')) {
    errors.push('TotalAmount is required');
  }
  if (body.TotalAmount !== undefined && body.TotalAmount !== null && body.TotalAmount !== '') {
    const totalAmountFloat = parseFloat(body.TotalAmount);
    if (isNaN(totalAmountFloat) || totalAmountFloat < 0) {
      errors.push('TotalAmount must be a valid non-negative number');
    }
  }

  if (body.PaidStatus !== undefined && body.PaidStatus !== null && body.PaidStatus !== '') {
    if (!allowedPaidStatus.includes(body.PaidStatus)) {
      errors.push(`PaidStatus must be one of: ${allowedPaidStatus.join(', ')}`);
    }
  }

  if (body.PaidAmount !== undefined && body.PaidAmount !== null && body.PaidAmount !== '') {
    const paidAmountFloat = parseFloat(body.PaidAmount);
    if (isNaN(paidAmountFloat) || paidAmountFloat < 0) {
      errors.push('PaidAmount must be a valid non-negative number');
    }
  }

  if (body.PartialPaidAmount !== undefined && body.PartialPaidAmount !== null && body.PartialPaidAmount !== '') {
    const partialPaidAmountFloat = parseFloat(body.PartialPaidAmount);
    if (isNaN(partialPaidAmountFloat) || partialPaidAmountFloat < 0) {
      errors.push('PartialPaidAmount must be a valid non-negative number');
    }
  }

  if (body.Balance !== undefined && body.Balance !== null && body.Balance !== '') {
    const balanceFloat = parseFloat(body.Balance);
    if (isNaN(balanceFloat)) {
      errors.push('Balance must be a valid number');
    }
  }

  if (body.ModeOfPayment !== undefined && body.ModeOfPayment !== null && body.ModeOfPayment !== '') {
    if (!allowedModeOfPayment.includes(body.ModeOfPayment)) {
      errors.push(`ModeOfPayment must be one of: ${allowedModeOfPayment.join(', ')}`);
    }
  }

  if (body.InsuranceReferenceNo !== undefined && body.InsuranceReferenceNo !== null && typeof body.InsuranceReferenceNo !== 'string') {
    errors.push('InsuranceReferenceNo must be a string');
  }

  if (body.InsuranceBillAmount !== undefined && body.InsuranceBillAmount !== null && body.InsuranceBillAmount !== '') {
    const insuranceBillAmountFloat = parseFloat(body.InsuranceBillAmount);
    if (isNaN(insuranceBillAmountFloat) || insuranceBillAmountFloat < 0) {
      errors.push('InsuranceBillAmount must be a valid non-negative number');
    }
  }

  if (body.SchemeReferenceNo !== undefined && body.SchemeReferenceNo !== null && typeof body.SchemeReferenceNo !== 'string') {
    errors.push('SchemeReferenceNo must be a string');
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.BillGeneratedBy !== undefined && body.BillGeneratedBy !== null && body.BillGeneratedBy !== '') {
    const billGeneratedByInt = parseInt(body.BillGeneratedBy, 10);
    if (isNaN(billGeneratedByInt)) {
      errors.push('BillGeneratedBy must be a valid integer');
    }
  }

  return errors;
};

exports.createPatientBill = async (req, res) => {
  try {
    const errors = validatePatientBillPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BillNo,
      PatientId,
      BillType,
      DepartmentId,
      DoctorId,
      BillDateTime,
      TotalAmount,
      PaidStatus = 'Pending',
      PaidAmount = 0,
      PartialPaidAmount = 0,
      Balance,
      ModeOfPayment,
      InsuranceReferenceNo,
      InsuranceBillAmount,
      SchemeReferenceNo,
      Status = 'Active',
      BillGeneratedBy,
    } = req.body;

    // Generate BillId as UUID
    const billId = randomUUID();

    // Generate BillNo if not provided
    let billNoValue;
    if (BillNo && BillNo.trim()) {
      billNoValue = BillNo.trim();
      // Check if BillNo already exists
      const existingBill = await db.query(
        'SELECT "BillId" FROM "PatientBills" WHERE "BillNo" = $1',
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

    // Validate PatientId exists
    if (PatientId) {
      const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
      if (patientExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'PatientId does not exist' });
      }
    }

    // Validate DepartmentId if provided
    let departmentIdValue = null;
    if (DepartmentId !== undefined && DepartmentId !== null && DepartmentId !== '') {
      const departmentIdInt = parseInt(DepartmentId, 10);
      if (isNaN(departmentIdInt)) {
        return res.status(400).json({ success: false, message: 'DepartmentId must be a valid integer' });
      }
      const departmentExists = await db.query('SELECT "DoctorDepartmentId" FROM "DoctorDepartment" WHERE "DoctorDepartmentId" = $1', [departmentIdInt]);
      if (departmentExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'DepartmentId does not exist' });
      }
      departmentIdValue = departmentIdInt;
    }

    // Validate DoctorId if provided
    let doctorIdValue = null;
    if (DoctorId !== undefined && DoctorId !== null && DoctorId !== '') {
      const doctorIdInt = parseInt(DoctorId, 10);
      if (isNaN(doctorIdInt)) {
        return res.status(400).json({ success: false, message: 'DoctorId must be a valid integer' });
      }
      const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [doctorIdInt]);
      if (doctorExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'DoctorId does not exist' });
      }
      doctorIdValue = doctorIdInt;
    }

    // Validate BillGeneratedBy if provided
    let generatedByValue = null;
    if (BillGeneratedBy !== undefined && BillGeneratedBy !== null && BillGeneratedBy !== '') {
      const generatedByInt = parseInt(BillGeneratedBy, 10);
      if (isNaN(generatedByInt)) {
        return res.status(400).json({ success: false, message: 'BillGeneratedBy must be a valid integer' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [generatedByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillGeneratedBy user does not exist' });
      }
      generatedByValue = generatedByInt;
    }

    // Calculate Balance if not provided
    let balanceValue = null;
    if (Balance !== undefined && Balance !== null && Balance !== '') {
      balanceValue = parseFloat(Balance);
    } else {
      // Calculate balance: TotalAmount - PaidAmount - PartialPaidAmount
      const totalAmountFloat = parseFloat(TotalAmount);
      const paidAmountFloat = parseFloat(PaidAmount || 0);
      const partialPaidAmountFloat = parseFloat(PartialPaidAmount || 0);
      balanceValue = totalAmountFloat - paidAmountFloat - partialPaidAmountFloat;
    }

    // Parse numeric values
    const totalAmountValue = parseFloat(TotalAmount);
    const paidAmountValue = parseFloat(PaidAmount || 0);
    const partialPaidAmountValue = parseFloat(PartialPaidAmount || 0);
    const insuranceBillAmountValue = InsuranceBillAmount !== undefined && InsuranceBillAmount !== null && InsuranceBillAmount !== '' ? parseFloat(InsuranceBillAmount) : null;

    const insertQuery = `
      INSERT INTO "PatientBills"
        ("BillId", "BillNo", "PatientId", "BillType", "DepartmentId", "DoctorId", "BillDateTime", 
         "TotalAmount", "PaidStatus", "PaidAmount", "PartialPaidAmount", "Balance", "ModeOfPayment", 
         "InsuranceReferenceNo", "InsuranceBillAmount", "SchemeReferenceNo", "Status", "BillGeneratedBy")
      VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7::timestamp, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      billId,
      billNoValue,
      PatientId,
      BillType,
      departmentIdValue,
      doctorIdValue,
      BillDateTime,
      totalAmountValue,
      PaidStatus,
      paidAmountValue,
      partialPaidAmountValue,
      balanceValue,
      ModeOfPayment || null,
      InsuranceReferenceNo ? InsuranceReferenceNo.trim() : null,
      insuranceBillAmountValue,
      SchemeReferenceNo ? SchemeReferenceNo.trim() : null,
      Status,
      generatedByValue,
    ]);

    // Fetch with related data
    const { rows: newRows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        dd."DepartmentName",
        d."UserName" AS "DoctorName",
        u."UserName" AS "GeneratedByUserName"
      FROM "PatientBills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
      LEFT JOIN "Users" d ON b."DoctorId" = d."UserId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillId" = $1::uuid
      `,
      [billId]
    );

    res.status(201).json({
      success: true,
      message: 'Patient bill created successfully',
      data: mapPatientBillRow(newRows[0]),
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
        message: 'Invalid foreign key reference. Please ensure PatientId, DepartmentId, DoctorId, or BillGeneratedBy exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating patient bill',
      error: error.message,
    });
  }
};

exports.updatePatientBill = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validatePatientBillPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BillNo,
      PatientId,
      BillType,
      DepartmentId,
      DoctorId,
      BillDateTime,
      TotalAmount,
      PaidStatus,
      PaidAmount,
      PartialPaidAmount,
      Balance,
      ModeOfPayment,
      InsuranceReferenceNo,
      InsuranceBillAmount,
      SchemeReferenceNo,
      Status,
      BillGeneratedBy,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (BillNo !== undefined) {
      // Check if BillNo already exists (excluding current bill)
      if (BillNo && BillNo.trim()) {
        const existingBill = await db.query(
          'SELECT "BillId" FROM "PatientBills" WHERE "BillNo" = $1 AND "BillId" != $2::uuid',
          [BillNo.trim(), id]
        );
        if (existingBill.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Bill number already exists',
          });
        }
      }
      updates.push(`"BillNo" = $${paramIndex++}`);
      params.push(BillNo ? BillNo.trim() : null);
    }
    if (PatientId !== undefined) {
      if (PatientId !== null && PatientId !== '') {
        const patientExists = await db.query('SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid', [PatientId]);
        if (patientExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'PatientId does not exist' });
        }
      }
      updates.push(`"PatientId" = $${paramIndex++}::uuid`);
      params.push(PatientId || null);
    }
    if (BillType !== undefined) {
      updates.push(`"BillType" = $${paramIndex++}`);
      params.push(BillType);
    }
    if (DepartmentId !== undefined) {
      if (DepartmentId !== null && DepartmentId !== '') {
        const departmentIdInt = parseInt(DepartmentId, 10);
        if (isNaN(departmentIdInt)) {
          return res.status(400).json({ success: false, message: 'DepartmentId must be a valid integer' });
        }
        const departmentExists = await db.query('SELECT "DoctorDepartmentId" FROM "DoctorDepartment" WHERE "DoctorDepartmentId" = $1', [departmentIdInt]);
        if (departmentExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'DepartmentId does not exist' });
        }
        updates.push(`"DepartmentId" = $${paramIndex++}`);
        params.push(departmentIdInt);
      } else {
        updates.push(`"DepartmentId" = $${paramIndex++}`);
        params.push(null);
      }
    }
    if (DoctorId !== undefined) {
      if (DoctorId !== null && DoctorId !== '') {
        const doctorIdInt = parseInt(DoctorId, 10);
        if (isNaN(doctorIdInt)) {
          return res.status(400).json({ success: false, message: 'DoctorId must be a valid integer' });
        }
        const doctorExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [doctorIdInt]);
        if (doctorExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'DoctorId does not exist' });
        }
        updates.push(`"DoctorId" = $${paramIndex++}`);
        params.push(doctorIdInt);
      } else {
        updates.push(`"DoctorId" = $${paramIndex++}`);
        params.push(null);
      }
    }
    if (BillDateTime !== undefined) {
      updates.push(`"BillDateTime" = $${paramIndex++}::timestamp`);
      params.push(BillDateTime);
    }
    if (TotalAmount !== undefined) {
      updates.push(`"TotalAmount" = $${paramIndex++}`);
      params.push(parseFloat(TotalAmount));
    }
    if (PaidStatus !== undefined) {
      updates.push(`"PaidStatus" = $${paramIndex++}`);
      params.push(PaidStatus);
    }
    if (PaidAmount !== undefined) {
      updates.push(`"PaidAmount" = $${paramIndex++}`);
      params.push(PaidAmount !== null ? parseFloat(PaidAmount) : null);
    }
    if (PartialPaidAmount !== undefined) {
      updates.push(`"PartialPaidAmount" = $${paramIndex++}`);
      params.push(PartialPaidAmount !== null ? parseFloat(PartialPaidAmount) : null);
    }
    if (Balance !== undefined) {
      // If Balance is not provided but TotalAmount, PaidAmount, or PartialPaidAmount are updated, recalculate
      if (Balance === null || Balance === '') {
        // Get current values to calculate balance
        const currentBill = await db.query('SELECT "TotalAmount", "PaidAmount", "PartialPaidAmount" FROM "PatientBills" WHERE "BillId" = $1::uuid', [id]);
        if (currentBill.rows.length > 0) {
          const currentTotal = parseFloat(currentBill.rows[0].TotalAmount || 0);
          const currentPaid = parseFloat(currentBill.rows[0].PaidAmount || 0);
          const currentPartial = parseFloat(currentBill.rows[0].PartialPaidAmount || 0);
          
          const newTotal = TotalAmount !== undefined ? parseFloat(TotalAmount) : currentTotal;
          const newPaid = PaidAmount !== undefined ? parseFloat(PaidAmount || 0) : currentPaid;
          const newPartial = PartialPaidAmount !== undefined ? parseFloat(PartialPaidAmount || 0) : currentPartial;
          
          const calculatedBalance = newTotal - newPaid - newPartial;
          updates.push(`"Balance" = $${paramIndex++}`);
          params.push(calculatedBalance);
        } else {
          updates.push(`"Balance" = $${paramIndex++}`);
          params.push(null);
        }
      } else {
        updates.push(`"Balance" = $${paramIndex++}`);
        params.push(parseFloat(Balance));
      }
    }
    if (ModeOfPayment !== undefined) {
      updates.push(`"ModeOfPayment" = $${paramIndex++}`);
      params.push(ModeOfPayment);
    }
    if (InsuranceReferenceNo !== undefined) {
      updates.push(`"InsuranceReferenceNo" = $${paramIndex++}`);
      params.push(InsuranceReferenceNo ? InsuranceReferenceNo.trim() : null);
    }
    if (InsuranceBillAmount !== undefined) {
      updates.push(`"InsuranceBillAmount" = $${paramIndex++}`);
      params.push(InsuranceBillAmount !== null && InsuranceBillAmount !== '' ? parseFloat(InsuranceBillAmount) : null);
    }
    if (SchemeReferenceNo !== undefined) {
      updates.push(`"SchemeReferenceNo" = $${paramIndex++}`);
      params.push(SchemeReferenceNo ? SchemeReferenceNo.trim() : null);
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }
    if (BillGeneratedBy !== undefined) {
      if (BillGeneratedBy !== null && BillGeneratedBy !== '') {
        const generatedByInt = parseInt(BillGeneratedBy, 10);
        if (isNaN(generatedByInt)) {
          return res.status(400).json({ success: false, message: 'BillGeneratedBy must be a valid integer' });
        }
        const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [generatedByInt]);
        if (userExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'BillGeneratedBy user does not exist' });
        }
        updates.push(`"BillGeneratedBy" = $${paramIndex++}`);
        params.push(generatedByInt);
      } else {
        updates.push(`"BillGeneratedBy" = $${paramIndex++}`);
        params.push(null);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const updateQuery = `
      UPDATE "PatientBills"
      SET ${updates.join(', ')}
      WHERE "BillId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient bill not found' });
    }

    // Fetch with related data
    const { rows: updatedRows } = await db.query(
      `
      SELECT 
        b.*,
        p."PatientName", p."PatientNo",
        dd."DepartmentName",
        d."UserName" AS "DoctorName",
        u."UserName" AS "GeneratedByUserName"
      FROM "PatientBills" b
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
      LEFT JOIN "Users" d ON b."DoctorId" = d."UserId"
      LEFT JOIN "Users" u ON b."BillGeneratedBy" = u."UserId"
      WHERE b."BillId" = $1::uuid
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Patient bill updated successfully',
      data: mapPatientBillRow(updatedRows[0]),
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
        message: 'Invalid foreign key reference. Please ensure PatientId, DepartmentId, DoctorId, or BillGeneratedBy exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating patient bill',
      error: error.message,
    });
  }
};

exports.deletePatientBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "PatientBills" WHERE "BillId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient bill not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient bill deleted successfully',
      data: mapPatientBillRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient bill',
      error: error.message,
    });
  }
};

