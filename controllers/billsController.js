const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create a new bill
const createBill = async (req, res) => {
    try {
        const {
            PatientId,
            BillType,
            DepartmentId,
            DoctorId,
            BillDateTime,
            TotalAmount,
            PaidStatus = 'Pending',
            PaidAmount = 0,
            PartialPaidAmount = 0,
            Balance = 0,
            ModeOfPayment,
            InsuranceReferenceNo,
            InsuranceBillAmount,
            SchemeReferenceNo,
            Remarks,
            BillGeneratedBy
        } = req.body;

        // Generate unique bill number
        const billNo = await generateBillNumber();

        // Calculate balance
        const calculatedBalance = TotalAmount - PaidAmount - PartialPaidAmount;

        const query = `
            INSERT INTO "Bills" (
                "BillNo", "PatientId", "BillType", "DepartmentId", "DoctorId",
                "BillDateTime", "TotalAmount", "PaidStatus", "PaidAmount",
                "PartialPaidAmount", "Balance", "ModeOfPayment", "InsuranceReferenceNo",
                "InsuranceBillAmount", "SchemeReferenceNo", "Remarks", "BillGeneratedBy"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *`;

        const values = [
            billNo, PatientId, BillType, DepartmentId, DoctorId,
            BillDateTime, TotalAmount, PaidStatus, PaidAmount,
            PartialPaidAmount, calculatedBalance, ModeOfPayment, InsuranceReferenceNo,
            InsuranceBillAmount, SchemeReferenceNo, Remarks, BillGeneratedBy
        ];

        const result = await pool.query(query, values);
        res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating bill',
            error: error.message
        });
    }
};

// Get all bills with optional filters
const getAllBills = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            patientId,
            billType,
            paidStatus,
            startDate,
            endDate,
            departmentId,
            doctorId
        } = req.query;

        let query = `
            SELECT b.*, pr."PatientName", pr."LastName", pr."PhoneNo",
                   dd."DepartmentName", u."UserName" as "DoctorName"
            FROM "Bills" b
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
            LEFT JOIN "Users" u ON b."DoctorId" = u."UserId"
            WHERE b."Status" = 'Active'`;

        const values = [];
        let paramCount = 0;

        // Add filters
        if (patientId) {
            paramCount++;
            query += ` AND b."PatientId" = $${paramCount}`;
            values.push(patientId);
        }

        if (billType) {
            paramCount++;
            query += ` AND b."BillType" = $${paramCount}`;
            values.push(billType);
        }

        if (paidStatus) {
            paramCount++;
            query += ` AND b."PaidStatus" = $${paramCount}`;
            values.push(paidStatus);
        }

        if (startDate && endDate) {
            paramCount++;
            query += ` AND b."BillDateTime" BETWEEN $${paramCount} AND $${paramCount + 1}`;
            values.push(startDate, endDate);
            paramCount++;
        }

        if (departmentId) {
            paramCount++;
            query += ` AND b."DepartmentId" = $${paramCount}`;
            values.push(departmentId);
        }

        if (doctorId) {
            paramCount++;
            query += ` AND b."DoctorId" = $${paramCount}`;
            values.push(doctorId);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        paramCount++;
        query += ` ORDER BY b."BillGeneratedAt" DESC LIMIT $${paramCount}`;
        values.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        values.push(offset);

        const result = await pool.query(query, values);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM "Bills" b
            WHERE b."Status" = 'Active'`;

        const countValues = values.slice(0, -2); // Remove limit and offset
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
        console.error('Error fetching bills:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bills',
            error: error.message
        });
    }
};

// Get bill by ID
const getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT b.*, pr."PatientName", pr."LastName", pr."PhoneNo",
                   dd."DepartmentName", u."UserName" as "DoctorName",
                   bg."UserName" as "BillGeneratedByName"
            FROM "Bills" b
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
            LEFT JOIN "Users" u ON b."DoctorId" = u."UserId"
            LEFT JOIN "Users" bg ON b."BillGeneratedBy" = bg."UserId"
            WHERE b."BillId" = $1 AND b."Status" = 'Active'`;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill',
            error: error.message
        });
    }
};

// Update bill by ID
const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            BillType,
            DepartmentId,
            DoctorId,
            BillDateTime,
            TotalAmount,
            PaidStatus,
            PaidAmount,
            PartialPaidAmount,
            ModeOfPayment,
            InsuranceReferenceNo,
            InsuranceBillAmount,
            SchemeReferenceNo,
            Remarks
        } = req.body;

        // Calculate balance
        const balance = TotalAmount - (PaidAmount || 0) - (PartialPaidAmount || 0);

        const query = `
            UPDATE "Bills"
            SET "BillType" = $1, "DepartmentId" = $2, "DoctorId" = $3,
                "BillDateTime" = $4, "TotalAmount" = $5, "PaidStatus" = $6,
                "PaidAmount" = $7, "PartialPaidAmount" = $8, "Balance" = $9,
                "ModeOfPayment" = $10, "InsuranceReferenceNo" = $11,
                "InsuranceBillAmount" = $12, "SchemeReferenceNo" = $13,
                "Remarks" = $14, "BillGeneratedAt" = CURRENT_TIMESTAMP
            WHERE "BillId" = $15 AND "Status" = 'Active'
            RETURNING *`;

        const values = [
            BillType, DepartmentId, DoctorId, BillDateTime, TotalAmount,
            PaidStatus, PaidAmount, PartialPaidAmount, balance, ModeOfPayment,
            InsuranceReferenceNo, InsuranceBillAmount, SchemeReferenceNo,
            Remarks, id
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            message: 'Bill updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating bill',
            error: error.message
        });
    }
};

// Delete bill by ID (soft delete)
const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE "Bills"
            SET "Status" = 'Inactive'
            WHERE "BillId" = $1 AND "Status" = 'Active'
            RETURNING *`;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            message: 'Bill deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting bill',
            error: error.message
        });
    }
};

// Get bills by patient ID
const getBillsByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = `
            SELECT b.*, dd."DepartmentName", u."UserName" as "DoctorName"
            FROM "Bills" b
            LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
            LEFT JOIN "Users" u ON b."DoctorId" = u."UserId"
            WHERE b."PatientId" = $1 AND b."Status" = 'Active'
            ORDER BY b."BillGeneratedAt" DESC
            LIMIT $2 OFFSET $3`;

        const offset = (page - 1) * limit;
        const result = await pool.query(query, [patientId, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching bills by patient:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bills by patient',
            error: error.message
        });
    }
};

// Get bills by bill type
const getBillsByType = async (req, res) => {
    try {
        const { billType } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = `
            SELECT b.*, pr."PatientName", pr."LastName", pr."PhoneNo"
            FROM "Bills" b
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            WHERE b."BillType" = $1 AND b."Status" = 'Active'
            ORDER BY b."BillGeneratedAt" DESC
            LIMIT $2 OFFSET $3`;

        const offset = (page - 1) * limit;
        const result = await pool.query(query, [billType, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching bills by type:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bills by type',
            error: error.message
        });
    }
};

// Get bills by payment status
const getBillsByPaymentStatus = async (req, res) => {
    try {
        const { paidStatus } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const query = `
            SELECT b.*, pr."PatientName", pr."LastName", pr."PhoneNo",
                   dd."DepartmentName", u."UserName" as "DoctorName"
            FROM "Bills" b
            LEFT JOIN "PatientRegistration" pr ON b."PatientId" = pr."PatientId"
            LEFT JOIN "DoctorDepartment" dd ON b."DepartmentId" = dd."DoctorDepartmentId"
            LEFT JOIN "Users" u ON b."DoctorId" = u."UserId"
            WHERE b."PaidStatus" = $1 AND b."Status" = 'Active'
            ORDER BY b."BillGeneratedAt" DESC
            LIMIT $2 OFFSET $3`;

        const offset = (page - 1) * limit;
        const result = await pool.query(query, [paidStatus, limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching bills by payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bills by payment status',
            error: error.message
        });
    }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { PaidStatus, PaidAmount, PartialPaidAmount, ModeOfPayment } = req.body;

        // Get current bill data
        const getBillQuery = `SELECT "TotalAmount", "PaidAmount", "PartialPaidAmount" FROM "Bills" WHERE "BillId" = $1`;
        const billResult = await pool.query(getBillQuery, [id]);

        if (billResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        const currentBill = billResult.rows[0];
        const totalAmount = currentBill.TotalAmount;
        const currentPaidAmount = PaidAmount || currentBill.PaidAmount;
        const currentPartialPaidAmount = PartialPaidAmount || currentBill.PartialPaidAmount;

        // Calculate balance
        const balance = totalAmount - currentPaidAmount - currentPartialPaidAmount;

        // Determine paid status based on amounts
        let finalPaidStatus = PaidStatus;
        if (!PaidStatus) {
            if (balance <= 0) {
                finalPaidStatus = 'Paid';
            } else if (currentPaidAmount > 0 || currentPartialPaidAmount > 0) {
                finalPaidStatus = 'Partial';
            } else {
                finalPaidStatus = 'Pending';
            }
        }

        const updateQuery = `
            UPDATE "Bills"
            SET "PaidStatus" = $1, "PaidAmount" = $2, "PartialPaidAmount" = $3,
                "Balance" = $4, "ModeOfPayment" = $5, "BillGeneratedAt" = CURRENT_TIMESTAMP
            WHERE "BillId" = $6 AND "Status" = 'Active'
            RETURNING *`;

        const values = [finalPaidStatus, currentPaidAmount, currentPartialPaidAmount, balance, ModeOfPayment, id];
        const result = await pool.query(updateQuery, values);

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
};

// Generate bill number
const generateBillNumber = async () => {
    try {
        // Get current date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear().toString() +
                       (today.getMonth() + 1).toString().padStart(2, '0') +
                       today.getDate().toString().padStart(2, '0');

        // Get the next sequence number for today
        const query = `
            SELECT COUNT(*) as count
            FROM "Bills"
            WHERE DATE("BillGeneratedAt") = CURRENT_DATE`;

        const result = await pool.query(query);
        const sequenceNumber = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');

        return `BILL-${dateStr}-${sequenceNumber}`;
    } catch (error) {
        console.error('Error generating bill number:', error);
        // Fallback bill number
        return `BILL-${Date.now()}`;
    }
};

// Export the generateBillNumber function for internal use
module.exports = {
    createBill,
    getAllBills,
    getBillById,
    updateBill,
    deleteBill,
    getBillsByPatientId,
    getBillsByType,
    getBillsByPaymentStatus,
    updatePaymentStatus,
    generateBillNumber
};
