const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/icu-occupied-count', dashboardController.getICUOccupiedPatientsCount);
router.get('/icu-total-count', dashboardController.getTotalICUCount);

module.exports = router;
