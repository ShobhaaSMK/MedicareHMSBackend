const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');

router.get('/', labTestController.getAllLabTests);
router.get('/by-testname/:testName', labTestController.getLabTestByTestName);
router.get('/by-category/:category', labTestController.getLabTestByCategory);
router.get('/:id', labTestController.getLabTestById);
router.post('/', labTestController.createLabTest);
router.put('/:id', labTestController.updateLabTest);
router.delete('/:id', labTestController.deleteLabTest);

module.exports = router;

