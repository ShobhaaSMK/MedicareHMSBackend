const db = require('../db');
const { randomUUID } = require('crypto');

const allowedItemCategory = ['Consultation', 'Lab test', 'Medicine', 'Room Charges', 'OT Charges', 'ICU Charges', 'Emergency', 'Other'];
const allowedStatus = ['Active', 'Inactive'];

const mapBillItemRow = (row) => ({
  BillItemsId: row.BillItemsId || row.billitemsid,
  BillId: row.BillId || row.billid || null,
  ItemCategory: row.ItemCategory || row.itemcategory || null,
  Quantity: row.Quantity !== undefined && row.Quantity !== null ? parseFloat(row.Quantity) : (row.quantity !== undefined && row.quantity !== null ? parseFloat(row.quantity) : null),
  UnitPrice: row.UnitPrice !== undefined && row.UnitPrice !== null ? parseFloat(row.UnitPrice) : (row.unitprice !== undefined && row.unitprice !== null ? parseFloat(row.unitprice) : null),
  TotalPrice: row.TotalPrice !== undefined && row.TotalPrice !== null ? parseFloat(row.TotalPrice) : (row.totalprice !== undefined && row.totalprice !== null ? parseFloat(row.totalprice) : null),
  Status: row.Status || row.status || 'Active',
  CreatedBy: row.CreatedBy || row.createdby || null,
  CreatedAt: row.CreatedAt || row.createdat,
  // Joined fields
  BillNo: row.BillNo || row.billno || null,
  PatientId: row.PatientId || row.patientid || null,
  PatientName: row.PatientName || row.patientname || null,
  PatientNo: row.PatientNo || row.patientno || null,
  CreatedByUserName: row.CreatedByUserName || row.createdbyusername || null,
});

exports.getAllBillItems = async (req, res) => {
  try {
    const { status, billId, itemCategory, createdBy } = req.query;
    let query = `
      SELECT 
        bi.*,
        b."BillNo",
        b."PatientId",
        p."PatientName", p."PatientNo",
        u."UserName" AS "CreatedByUserName"
      FROM "BillItems" bi
      LEFT JOIN "PatientBills" b ON bi."BillId" = b."BillId"
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`bi."Status" = $${params.length + 1}`);
      params.push(status);
    }
    if (billId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(billId)) {
        conditions.push(`bi."BillId" = $${params.length + 1}::uuid`);
        params.push(billId);
      }
    }
    if (itemCategory) {
      conditions.push(`bi."ItemCategory" = $${params.length + 1}`);
      params.push(itemCategory);
    }
    if (createdBy) {
      const createdByInt = parseInt(createdBy, 10);
      if (!isNaN(createdByInt)) {
        conditions.push(`bi."CreatedBy" = $${params.length + 1}`);
        params.push(createdByInt);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY bi."CreatedAt" DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(mapBillItemRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bill items',
      error: error.message,
    });
  }
};

exports.getBillItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT 
        bi.*,
        b."BillNo",
        b."PatientId",
        p."PatientName", p."PatientNo",
        u."UserName" AS "CreatedByUserName"
      FROM "BillItems" bi
      LEFT JOIN "PatientBills" b ON bi."BillId" = b."BillId"
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
      WHERE bi."BillItemsId" = $1::uuid
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill item not found' });
    }
    res.status(200).json({ success: true, data: mapBillItemRow(rows[0]) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bill item',
      error: error.message,
    });
  }
};

exports.getBillItemsByBillId = async (req, res) => {
  try {
    const { billId } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(billId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid BillId. Must be a valid UUID.'
      });
    }

    const { rows } = await db.query(
      `
      SELECT 
        bi.*,
        b."BillNo",
        b."PatientId",
        p."PatientName", p."PatientNo",
        u."UserName" AS "CreatedByUserName"
      FROM "BillItems" bi
      LEFT JOIN "PatientBills" b ON bi."BillId" = b."BillId"
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
      WHERE bi."BillId" = $1::uuid
      ORDER BY bi."CreatedAt" DESC
      `,
      [billId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      billId: billId,
      data: rows.map(mapBillItemRow),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bill items by BillId',
      error: error.message,
    });
  }
};

const validateBillItemPayload = (body, requireAll = true) => {
  const errors = [];

  if (requireAll && (!body.BillId || body.BillId === '')) {
    errors.push('BillId is required');
  }
  if (body.BillId !== undefined && body.BillId !== null && body.BillId !== '') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.BillId)) {
      errors.push('BillId must be a valid UUID');
    }
  }

  if (requireAll && (!body.ItemCategory || body.ItemCategory === '')) {
    errors.push('ItemCategory is required');
  }
  if (body.ItemCategory !== undefined && body.ItemCategory !== null && body.ItemCategory !== '') {
    if (!allowedItemCategory.includes(body.ItemCategory)) {
      errors.push(`ItemCategory must be one of: ${allowedItemCategory.join(', ')}`);
    }
  }

  if (requireAll && (body.Quantity === undefined || body.Quantity === null || body.Quantity === '')) {
    errors.push('Quantity is required');
  }
  if (body.Quantity !== undefined && body.Quantity !== null && body.Quantity !== '') {
    const quantityFloat = parseFloat(body.Quantity);
    if (isNaN(quantityFloat) || quantityFloat < 0) {
      errors.push('Quantity must be a valid non-negative number');
    }
  }

  if (requireAll && (body.UnitPrice === undefined || body.UnitPrice === null || body.UnitPrice === '')) {
    errors.push('UnitPrice is required');
  }
  if (body.UnitPrice !== undefined && body.UnitPrice !== null && body.UnitPrice !== '') {
    const unitPriceFloat = parseFloat(body.UnitPrice);
    if (isNaN(unitPriceFloat) || unitPriceFloat < 0) {
      errors.push('UnitPrice must be a valid non-negative number');
    }
  }

  if (body.TotalPrice !== undefined && body.TotalPrice !== null && body.TotalPrice !== '') {
    const totalPriceFloat = parseFloat(body.TotalPrice);
    if (isNaN(totalPriceFloat) || totalPriceFloat < 0) {
      errors.push('TotalPrice must be a valid non-negative number');
    }
  }

  if (body.Status && !allowedStatus.includes(body.Status)) {
    errors.push('Status must be Active or Inactive');
  }

  if (body.CreatedBy !== undefined && body.CreatedBy !== null && body.CreatedBy !== '') {
    const createdByInt = parseInt(body.CreatedBy, 10);
    if (isNaN(createdByInt)) {
      errors.push('CreatedBy must be a valid integer');
    }
  }

  return errors;
};

exports.createBillItem = async (req, res) => {
  try {
    const errors = validateBillItemPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BillId,
      ItemCategory,
      Quantity,
      UnitPrice,
      TotalPrice,
      Status = 'Active',
      CreatedBy,
    } = req.body;

    // Generate BillItemsId as UUID
    const billItemsId = randomUUID();

    // Validate BillId exists
    if (BillId) {
      const billExists = await db.query('SELECT "BillId" FROM "PatientBills" WHERE "BillId" = $1::uuid', [BillId]);
      if (billExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'BillId does not exist' });
      }
    }

    // Validate CreatedBy if provided
    let createdByValue = null;
    if (CreatedBy !== undefined && CreatedBy !== null && CreatedBy !== '') {
      const createdByInt = parseInt(CreatedBy, 10);
      if (isNaN(createdByInt)) {
        return res.status(400).json({ success: false, message: 'CreatedBy must be a valid integer' });
      }
      const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
      if (userExists.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'CreatedBy user does not exist' });
      }
      createdByValue = createdByInt;
    }

    // Calculate TotalPrice if not provided
    let totalPriceValue = null;
    if (TotalPrice !== undefined && TotalPrice !== null && TotalPrice !== '') {
      totalPriceValue = parseFloat(TotalPrice);
    } else {
      // Calculate TotalPrice: Quantity * UnitPrice
      const quantityFloat = parseFloat(Quantity);
      const unitPriceFloat = parseFloat(UnitPrice);
      totalPriceValue = quantityFloat * unitPriceFloat;
    }

    // Parse numeric values
    const quantityValue = parseFloat(Quantity);
    const unitPriceValue = parseFloat(UnitPrice);

    const insertQuery = `
      INSERT INTO "BillItems"
        ("BillItemsId", "BillId", "ItemCategory", "Quantity", "UnitPrice", "TotalPrice", "Status", "CreatedBy")
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const { rows } = await db.query(insertQuery, [
      billItemsId,
      BillId,
      ItemCategory,
      quantityValue,
      unitPriceValue,
      totalPriceValue,
      Status,
      createdByValue,
    ]);

    // Fetch with related data
    const { rows: newRows } = await db.query(
      `
      SELECT 
        bi.*,
        b."BillNo",
        b."PatientId",
        p."PatientName", p."PatientNo",
        u."UserName" AS "CreatedByUserName"
      FROM "BillItems" bi
      LEFT JOIN "PatientBills" b ON bi."BillId" = b."BillId"
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
      WHERE bi."BillItemsId" = $1::uuid
      `,
      [billItemsId]
    );

    res.status(201).json({
      success: true,
      message: 'Bill item created successfully',
      data: mapBillItemRow(newRows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure BillId or CreatedBy exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating bill item',
      error: error.message,
    });
  }
};

exports.updateBillItem = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validateBillItemPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const {
      BillId,
      ItemCategory,
      Quantity,
      UnitPrice,
      TotalPrice,
      Status,
      CreatedBy,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (BillId !== undefined) {
      if (BillId !== null && BillId !== '') {
        const billExists = await db.query('SELECT "BillId" FROM "PatientBills" WHERE "BillId" = $1::uuid', [BillId]);
        if (billExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'BillId does not exist' });
        }
      }
      updates.push(`"BillId" = $${paramIndex++}::uuid`);
      params.push(BillId || null);
    }
    if (ItemCategory !== undefined) {
      updates.push(`"ItemCategory" = $${paramIndex++}`);
      params.push(ItemCategory);
    }
    if (Quantity !== undefined) {
      updates.push(`"Quantity" = $${paramIndex++}`);
      params.push(Quantity !== null ? parseFloat(Quantity) : null);
    }
    if (UnitPrice !== undefined) {
      updates.push(`"UnitPrice" = $${paramIndex++}`);
      params.push(UnitPrice !== null ? parseFloat(UnitPrice) : null);
    }
    if (TotalPrice !== undefined) {
      // If TotalPrice is not provided but Quantity or UnitPrice are updated, recalculate
      if (TotalPrice === null || TotalPrice === '') {
        // Get current values to calculate TotalPrice
        const currentItem = await db.query('SELECT "Quantity", "UnitPrice" FROM "BillItems" WHERE "BillItemsId" = $1::uuid', [id]);
        if (currentItem.rows.length > 0) {
          const currentQuantity = parseFloat(currentItem.rows[0].Quantity || 0);
          const currentUnitPrice = parseFloat(currentItem.rows[0].UnitPrice || 0);
          
          const newQuantity = Quantity !== undefined ? parseFloat(Quantity) : currentQuantity;
          const newUnitPrice = UnitPrice !== undefined ? parseFloat(UnitPrice) : currentUnitPrice;
          
          const calculatedTotalPrice = newQuantity * newUnitPrice;
          updates.push(`"TotalPrice" = $${paramIndex++}`);
          params.push(calculatedTotalPrice);
        } else {
          updates.push(`"TotalPrice" = $${paramIndex++}`);
          params.push(null);
        }
      } else {
        updates.push(`"TotalPrice" = $${paramIndex++}`);
        params.push(parseFloat(TotalPrice));
      }
    }
    if (Status !== undefined) {
      updates.push(`"Status" = $${paramIndex++}`);
      params.push(Status);
    }
    if (CreatedBy !== undefined) {
      if (CreatedBy !== null && CreatedBy !== '') {
        const createdByInt = parseInt(CreatedBy, 10);
        if (isNaN(createdByInt)) {
          return res.status(400).json({ success: false, message: 'CreatedBy must be a valid integer' });
        }
        const userExists = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = $1', [createdByInt]);
        if (userExists.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'CreatedBy user does not exist' });
        }
        updates.push(`"CreatedBy" = $${paramIndex++}`);
        params.push(createdByInt);
      } else {
        updates.push(`"CreatedBy" = $${paramIndex++}`);
        params.push(null);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const updateQuery = `
      UPDATE "BillItems"
      SET ${updates.join(', ')}
      WHERE "BillItemsId" = $${paramIndex}::uuid
      RETURNING *;
    `;

    const { rows } = await db.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill item not found' });
    }

    // Fetch with related data
    const { rows: updatedRows } = await db.query(
      `
      SELECT 
        bi.*,
        b."BillNo",
        b."PatientId",
        p."PatientName", p."PatientNo",
        u."UserName" AS "CreatedByUserName"
      FROM "BillItems" bi
      LEFT JOIN "PatientBills" b ON bi."BillId" = b."BillId"
      LEFT JOIN "PatientRegistration" p ON b."PatientId" = p."PatientId"
      LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
      WHERE bi."BillItemsId" = $1::uuid
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Bill item updated successfully',
      data: mapBillItemRow(updatedRows[0]),
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference. Please ensure BillId or CreatedBy exist.',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating bill item',
      error: error.message,
    });
  }
};

exports.deleteBillItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM "BillItems" WHERE "BillItemsId" = $1::uuid RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill item not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Bill item deleted successfully',
      data: mapBillItemRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bill item',
      error: error.message,
    });
  }
};

