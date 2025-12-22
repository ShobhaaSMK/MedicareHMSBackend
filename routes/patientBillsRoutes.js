const express = require('express');
const router = express.Router();
const patientBillsController = require('../controllers/patientBillsController');

/* GET /api/patient-bills
Query Parameters:
  - status: String (optional) - 'Active' | 'Inactive'
  - paidStatus: String (optional) - 'Pending' | 'Partial' | 'Paid'
  - patientId: String (UUID) (optional)
  - billType: String (optional) - 'OPD' | 'IPD' | 'Emergency' | 'LabTest' | 'Pharmacy'
  - departmentId: Number (optional)
  - doctorId: Number (optional)
  - modeOfPayment: String (optional)
  - fromDate: String (optional) - YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
  - toDate: String (optional) - YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
Response: {
  success: Boolean,
  count: Number,
  data: Array<{
    BillId: String (UUID),
    BillNo: String,
    PatientId: String (UUID) | null,
    BillType: String | null,
    DepartmentId: Number | null,
    DoctorId: Number | null,
    BillDateTime: Date,
    TotalAmount: Number,
    PaidStatus: String,
    PaidAmount: Number | null,
    PartialPaidAmount: Number | null,
    Balance: Number | null,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DepartmentName: String | null,
    DoctorName: String | null,
    GeneratedByUserName: String | null
  }>
} */
router.get('/', patientBillsController.getAllPatientBills);

/* GET /api/patient-bills/:id
Path Parameters:
  - id: String (UUID) (required) - BillId
Response: {
  success: Boolean,
  data: {
    BillId: String (UUID),
    BillNo: String,
    PatientId: String (UUID) | null,
    BillType: String | null,
    DepartmentId: Number | null,
    DoctorId: Number | null,
    BillDateTime: Date,
    TotalAmount: Number,
    PaidStatus: String,
    PaidAmount: Number | null,
    PartialPaidAmount: Number | null,
    Balance: Number | null,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DepartmentName: String | null,
    DoctorName: String | null,
    GeneratedByUserName: String | null
  }
} */
router.get('/:id', patientBillsController.getPatientBillById);

/* GET /api/patient-bills/by-billno/:billNo
Path Parameters:
  - billNo: String (required) - BillNo
Response: {
  success: Boolean,
  data: {
    BillId: String (UUID),
    BillNo: String,
    PatientId: String (UUID) | null,
    BillType: String | null,
    DepartmentId: Number | null,
    DoctorId: Number | null,
    BillDateTime: Date,
    TotalAmount: Number,
    PaidStatus: String,
    PaidAmount: Number | null,
    PartialPaidAmount: Number | null,
    Balance: Number | null,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DepartmentName: String | null,
    DoctorName: String | null,
    GeneratedByUserName: String | null
  }
} */
router.get('/by-billno/:billNo', patientBillsController.getPatientBillByBillNo);

/* POST /api/patient-bills
Request Body: {
  BillNo: String (optional) - Auto-generated if not provided
  PatientId: String (UUID) (required)
  BillType: String (required) - 'OPD' | 'IPD' | 'Emergency' | 'LabTest' | 'Pharmacy'
  DepartmentId: Number (optional)
  DoctorId: Number (optional)
  BillDateTime: String (required) - YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS
  TotalAmount: Number (required)
  PaidStatus: String (optional) - 'Pending' | 'Partial' | 'Paid' (default: 'Pending')
  PaidAmount: Number (optional) (default: 0)
  PartialPaidAmount: Number (optional) (default: 0)
  Balance: Number (optional) - Auto-calculated if not provided
  ModeOfPayment: String (optional) - 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'NetBanking' | 'Insurance' | 'Cheque' | 'Wallet(Paytm/PhonePe)' | 'Scheme'
  InsuranceReferenceNo: String (optional)
  InsuranceBillAmount: Number (optional)
  SchemeReferenceNo: String (optional)
  Status: String (optional) - 'Active' | 'Inactive' (default: 'Active')
  BillGeneratedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillId: String (UUID),
    BillNo: String,
    PatientId: String (UUID) | null,
    BillType: String | null,
    DepartmentId: Number | null,
    DoctorId: Number | null,
    BillDateTime: Date,
    TotalAmount: Number,
    PaidStatus: String,
    PaidAmount: Number | null,
    PartialPaidAmount: Number | null,
    Balance: Number | null,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DepartmentName: String | null,
    DoctorName: String | null,
    GeneratedByUserName: String | null
  }
} */
router.post('/', patientBillsController.createPatientBill);

/* PUT /api/patient-bills/:id
Path Parameters:
  - id: String (UUID) (required) - BillId
Request Body: {
  BillNo: String (optional)
  PatientId: String (UUID) (optional)
  BillType: String (optional) - 'OPD' | 'IPD' | 'Emergency' | 'LabTest' | 'Pharmacy'
  DepartmentId: Number (optional)
  DoctorId: Number (optional)
  BillDateTime: String (optional) - YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS
  TotalAmount: Number (optional)
  PaidStatus: String (optional) - 'Pending' | 'Partial' | 'Paid'
  PaidAmount: Number (optional)
  PartialPaidAmount: Number (optional)
  Balance: Number (optional) - Auto-calculated if not provided
  ModeOfPayment: String (optional) - 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'NetBanking' | 'Insurance' | 'Cheque' | 'Wallet(Paytm/PhonePe)' | 'Scheme'
  InsuranceReferenceNo: String (optional)
  InsuranceBillAmount: Number (optional)
  SchemeReferenceNo: String (optional)
  Status: String (optional) - 'Active' | 'Inactive'
  BillGeneratedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillId: String (UUID),
    BillNo: String,
    PatientId: String (UUID) | null,
    BillType: String | null,
    DepartmentId: Number | null,
    DoctorId: Number | null,
    BillDateTime: Date,
    TotalAmount: Number,
    PaidStatus: String,
    PaidAmount: Number | null,
    PartialPaidAmount: Number | null,
    Balance: Number | null,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    DepartmentName: String | null,
    DoctorName: String | null,
    GeneratedByUserName: String | null
  }
} */
router.put('/:id', patientBillsController.updatePatientBill);

/* DELETE /api/patient-bills/:id
Path Parameters:
  - id: String (UUID) (required) - BillId
Response: {
  success: Boolean,
  message: String,
  data: {
    BillId: String (UUID),
    BillNo: String,
    PatientId: String (UUID) | null,
    BillType: String | null,
    DepartmentId: Number | null,
    DoctorId: Number | null,
    BillDateTime: Date,
    TotalAmount: Number,
    PaidStatus: String,
    PaidAmount: Number | null,
    PartialPaidAmount: Number | null,
    Balance: Number | null,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date
  }
} */
router.delete('/:id', patientBillsController.deletePatientBill);

module.exports = router;

