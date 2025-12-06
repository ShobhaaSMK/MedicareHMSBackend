const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

/* GET /api/audit-logs
Query params: ?actionBy=Number (optional), ?startDate=YYYY-MM-DD (optional), ?endDate=YYYY-MM-DD (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    AuditLogId: Number,
    ActionLogName: String,
    ActionBy: Number | null,
    ActionDate: Date,
    ActionByName: String | null
  }]
} */
router.get('/', auditLogController.getAllAuditLogs);

/* GET /api/audit-logs/by-action-by/:actionBy
Params: actionBy (Number)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    AuditLogId: Number,
    ActionLogName: String,
    ActionBy: Number | null,
    ActionDate: Date,
    ActionByName: String | null
  }]
} */
router.get('/by-action-by/:actionBy', auditLogController.getAuditLogsByActionBy);

/* GET /api/audit-logs/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    AuditLogId: Number,
    ActionLogName: String,
    ActionBy: Number | null,
    ActionDate: Date,
    ActionByName: String | null
  }
} */
router.get('/:id', auditLogController.getAuditLogById);

/* POST /api/audit-logs
Request: {
  ActionLogName: String (required),
  ActionBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    AuditLogId: Number,
    ActionLogName: String,
    ActionBy: Number | null,
    ActionDate: Date,
    ActionByName: String | null
  }
} */
router.post('/', auditLogController.createAuditLog);

module.exports = router;

