const express = require('express');
const router = express.Router();
const billsController = require('../controllers/billsController');

/* GET /api/bills
Query params: ?status=String (optional), ?paidStatus=String (optional), ?patientId=Number (optional), ?billEntityId=Number (optional), ?modeOfPayment=String (optional), ?fromDate=String (optional), ?toDate=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }]
} */
router.get('/', billsController.getAllBills);

/* GET /api/bills/by-billno/:billNo
Params: billNo (String)
Response: {
  success: Boolean,
  data: {
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }
} */
router.get('/by-billno/:billNo', billsController.getBillByBillNo);

/* GET /api/bills/by-patient/:patientId
Params: patientId (Number)
Response: {
  success: Boolean,
  count: Number,
  patientId: Number,
  data: [{
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }]
} */
router.get('/by-patient/:patientId', billsController.getBillsByPatientId);

/* GET /api/bills/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }
} */
router.get('/:id', billsController.getBillById);

/* POST /api/bills
Request: {
  BillNo: String (optional), // Auto-generated if not provided
  PatientId: Number (optional),
  BillEntityId: Number (required),
  ServiceId: Number (optional),
  Quantity: Number (optional), // Defaults to 1
  Rate: Number (required),
  Amount: Number (required),
  BillDateTime: String (required), // Date/Time string
  ModeOfPayment: String (optional), // "Cash" | "Card" | "Insurance" | "Scheme"
  InsuranceReferenceNo: String (optional),
  InsuranceBillAmount: Number (optional),
  SchemeReferenceNo: String (optional),
  PaidStatus: String (optional), // "Paid" | "NotPaid", defaults to "NotPaid"
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  BillGeneratedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }
} */
router.post('/', billsController.createBill);

/* PUT /api/bills/:id
Params: id (Number)
Request: {
  BillNo: String (optional),
  PatientId: Number (optional),
  BillEntityId: Number (optional),
  ServiceId: Number (optional),
  Quantity: Number (optional),
  Rate: Number (optional),
  Amount: Number (optional),
  BillDateTime: String (optional),
  ModeOfPayment: String (optional), // "Cash" | "Card" | "Insurance" | "Scheme"
  InsuranceReferenceNo: String (optional),
  InsuranceBillAmount: Number (optional),
  SchemeReferenceNo: String (optional),
  PaidStatus: String (optional), // "Paid" | "NotPaid"
  Status: String (optional), // "Active" | "Inactive"
  BillGeneratedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }
} */
router.put('/:id', billsController.updateBill);

/* DELETE /api/bills/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    BillId: Number,
    BillNo: String,
    PatientId: Number | null,
    BillEntityId: Number,
    ServiceId: Number | null,
    Quantity: Number,
    Rate: Number,
    Amount: Number,
    BillDateTime: Date,
    ModeOfPayment: String | null,
    InsuranceReferenceNo: String | null,
    InsuranceBillAmount: Number | null,
    SchemeReferenceNo: String | null,
    PaidStatus: String,
    Status: String,
    BillGeneratedBy: Number | null,
    BillGeneratedAt: Date,
    PatientName: String | null,
    PatientNo: String | null,
    BillEntity: String | null,
    GeneratedByUserName: String | null
  }
} */
router.delete('/:id', billsController.deleteBill);

module.exports = router;

