const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

router.get('/', auditLogController.getAllAuditLogs);
router.get('/by-action-by/:actionBy', auditLogController.getAuditLogsByActionBy);
router.get('/:id', auditLogController.getAuditLogById);
router.post('/', auditLogController.createAuditLog);

module.exports = router;

