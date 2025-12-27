const pool = require('../db');

// Create a new bill item
const createBillItem = async (req, res) => {
    try {
        const {
            BillId,
            ItemCategory,
            Quantity,
            UnitPrice,
            TotalPrice,
            CreatedBy
        } = req.body;

        // Validate required fields
        if (!BillId || !ItemCategory || !Quantity || !UnitPrice) {
            return res.status(400).json({
                success: false,
                message: 'BillId, ItemCategory, Quantity, and UnitPrice are required'
            });
        }

        // Calculate TotalPrice if not provided
        const calculatedTotalPrice = TotalPrice || (Quantity * UnitPrice);

        const query = `
            INSERT INTO "BillItems" (
                "BillId", "ItemCategory", "Quantity", "UnitPrice", "TotalPrice", "CreatedBy"
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`;

        const values = [BillId, ItemCategory, Quantity, UnitPrice, calculatedTotalPrice, CreatedBy];

        const result = await pool.query(query, values);
        res.status(201).json({
            success: true,
            message: 'Bill item created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating bill item:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating bill item',
            error: error.message
        });
    }
};

// Get all bill items with optional filters
const getAllBillItems = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            billId,
            itemCategory,
            status = 'Active',
            startDate,
            endDate
        } = req.query;

        let query = `
            SELECT bi.*, b."BillNo", b."PatientId", pr."PatientName", pr."LastName"
            FROM "BillItems" bi
            LEFT JOIN "Bills" b ON bi."BillId" = b."BillId"
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            WHERE bi."Status" = $1`;

        const values = [status];
        let paramCount = 1;

        // Add filters
        if (billId) {
            paramCount++;
            query += ` AND bi."BillId" = $${paramCount}`;
            values.push(billId);
        }

        if (itemCategory) {
            paramCount++;
            query += ` AND bi."ItemCategory" = $${paramCount}`;
            values.push(itemCategory);
        }

        if (startDate && endDate) {
            paramCount++;
            query += ` AND bi."CreatedAt" BETWEEN $${paramCount} AND $${paramCount + 1}`;
            values.push(startDate, endDate);
            paramCount++;
        }

        // Add pagination
        const offset = (page - 1) * limit;
        paramCount++;
        query += ` ORDER BY bi."CreatedAt" DESC LIMIT $${paramCount}`;
        values.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        values.push(offset);

        const result = await pool.query(query, values);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM "BillItems" bi
            WHERE bi."Status" = $1`;

        const countValues = [status];
        let countParamCount = 1;

        if (billId) {
            countParamCount++;
            countQuery += ` AND bi."BillId" = $${countParamCount}`;
            countValues.push(billId);
        }

        if (itemCategory) {
            countParamCount++;
            countQuery += ` AND bi."ItemCategory" = $${countParamCount}`;
            countValues.push(itemCategory);
        }

        if (startDate && endDate) {
            countParamCount++;
            countQuery += ` AND bi."CreatedAt" BETWEEN $${countParamCount} AND $${countParamCount + 1}`;
            countValues.push(startDate, endDate);
        }

        const countResult = await pool.query(countQuery, countValues);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult.rows[0].total / limit),
                totalRecords: parseInt(countResult.rows[0].total),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching bill items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill items',
            error: error.message
        });
    }
};

// Get bill item by ID
const getBillItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT bi.*, b."BillNo", b."PatientId", pr."PatientName", pr."LastName",
                   u."UserName" as "CreatedByName"
            FROM "BillItems" bi
            LEFT JOIN "Bills" b ON bi."BillId" = b."BillId"
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
            WHERE bi."BillItemsId" = $1 AND bi."Status" = 'Active'`;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill item not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching bill item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill item',
            error: error.message
        });
    }
};

// Update bill item by ID
const updateBillItem = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ItemCategory,
            Quantity,
            UnitPrice,
            TotalPrice
        } = req.body;

        // Calculate TotalPrice if not provided
        const calculatedTotalPrice = TotalPrice || (Quantity * UnitPrice);

        const query = `
            UPDATE "BillItems"
            SET "ItemCategory" = $1, "Quantity" = $2, "UnitPrice" = $3, "TotalPrice" = $4
            WHERE "BillItemsId" = $5 AND "Status" = 'Active'
            RETURNING *`;

        const values = [ItemCategory, Quantity, UnitPrice, calculatedTotalPrice, id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill item not found'
            });
        }

        res.json({
            success: true,
            message: 'Bill item updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating bill item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating bill item',
            error: error.message
        });
    }
};

// Delete bill item by ID (soft delete)
const deleteBillItem = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE "BillItems"
            SET "Status" = 'Inactive'
            WHERE "BillItemsId" = $1 AND "Status" = 'Active'
            RETURNING *`;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill item not found'
            });
        }

        res.json({
            success: true,
            message: 'Bill item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting bill item:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting bill item',
            error: error.message
        });
    }
};

// Get bill items by bill ID
const getBillItemsByBillId = async (req, res) => {
    try {
        const { billId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = `
            SELECT bi.*, u."UserName" as "CreatedByName"
            FROM "BillItems" bi
            LEFT JOIN "Users" u ON bi."CreatedBy" = u."UserId"
            WHERE bi."BillId" = $1 AND bi."Status" = 'Active'
            ORDER BY bi."CreatedAt" DESC
            LIMIT $2 OFFSET $3`;

        const offset = (page - 1) * limit;
        const result = await pool.query(query, [billId, limit, offset]);

        // Calculate totals
        const totalQuery = `
            SELECT SUM("TotalPrice") as totalAmount, COUNT(*) as itemCount
            FROM "BillItems"
            WHERE "BillId" = $1 AND "Status" = 'Active'`;

        const totalResult = await pool.query(totalQuery, [billId]);

        res.json({
            success: true,
            data: result.rows,
            summary: {
                totalAmount: parseFloat(totalResult.rows[0].totalamount || 0),
                itemCount: parseInt(totalResult.rows[0].itemcount || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching bill items by bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill items by bill',
            error: error.message
        });
    }
};

// Get bill items by item category
const getBillItemsByCategory = async (req, res) => {
    try {
        const { itemCategory } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = `
            SELECT bi.*, b."BillNo", pr."PatientName", pr."LastName"
            FROM "BillItems" bi
            LEFT JOIN "Bills" b ON bi."BillId" = b."BillId"
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            WHERE bi."ItemCategory" = $1 AND bi."Status" = 'Active'
            ORDER BY bi."CreatedAt" DESC
            LIMIT $2 OFFSET $3`;

        const offset = (page - 1) * limit;
        const result = await pool.query(query, [itemCategory, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching bill items by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill items by category',
            error: error.message
        });
    }
};

// Get bill items by status
const getBillItemsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = `
            SELECT bi.*, b."BillNo", pr."PatientName", pr."LastName"
            FROM "BillItems" bi
            LEFT JOIN "Bills" b ON bi."BillId" = b."BillId"
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            WHERE bi."Status" = $1
            ORDER BY bi."CreatedAt" DESC
            LIMIT $2 OFFSET $3`;

        const offset = (page - 1) * limit;
        const result = await pool.query(query, [status, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching bill items by status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill items by status',
            error: error.message
        });
    }
};

// Bulk create bill items for a bill
const bulkCreateBillItems = async (req, res) => {
    try {
        const { billId } = req.params;
        const { items, createdBy } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required and cannot be empty'
            });
        }

        // Validate each item
        for (const item of items) {
            if (!item.ItemCategory || !item.Quantity || !item.UnitPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have ItemCategory, Quantity, and UnitPrice'
                });
            }
        }

        // Build bulk insert query
        const values = [];
        const placeholders = [];
        let paramCount = 1;

        items.forEach(item => {
            const totalPrice = item.TotalPrice || (item.Quantity * item.UnitPrice);
            values.push(billId, item.ItemCategory, item.Quantity, item.UnitPrice, totalPrice, createdBy);
            placeholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5})`);
            paramCount += 6;
        });

        const query = `
            INSERT INTO "BillItems" (
                "BillId", "ItemCategory", "Quantity", "UnitPrice", "TotalPrice", "CreatedBy"
            ) VALUES ${placeholders.join(', ')}
            RETURNING *`;

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: `${result.rows.length} bill items created successfully`,
            data: result.rows
        });
    } catch (error) {
        console.error('Error bulk creating bill items:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk creating bill items',
            error: error.message
        });
    }
};

// Recalculate bill total from bill items
const recalculateBillTotal = async (req, res) => {
    try {
        const { billId } = req.params;

        // Calculate total from bill items
        const totalQuery = `
            SELECT SUM("TotalPrice") as totalAmount
            FROM "BillItems"
            WHERE "BillId" = $1 AND "Status" = 'Active'`;

        const totalResult = await pool.query(totalQuery, [billId]);

        const totalAmount = parseFloat(totalResult.rows[0].totalamount || 0);

        // Update bill total
        const updateQuery = `
            UPDATE "Bills"
            SET "TotalAmount" = $1,
                "Balance" = $1 - "PaidAmount" - "PartialPaidAmount",
                "BillGeneratedAt" = CURRENT_TIMESTAMP
            WHERE "BillId" = $2 AND "Status" = 'Active'
            RETURNING *`;

        const updateResult = await pool.query(updateQuery, [totalAmount, billId]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            message: 'Bill total recalculated successfully',
            data: {
                bill: updateResult.rows[0],
                calculatedTotal: totalAmount
            }
        });
    } catch (error) {
        console.error('Error recalculating bill total:', error);
        res.status(500).json({
            success: false,
            message: 'Error recalculating bill total',
            error: error.message
        });
    }
};

module.exports = {
    createBillItem,
    getAllBillItems,
    getBillItemById,
    updateBillItem,
    deleteBillItem,
    getBillItemsByBillId,
    getBillItemsByCategory,
    getBillItemsByStatus,
    bulkCreateBillItems,
    recalculateBillTotal
};
