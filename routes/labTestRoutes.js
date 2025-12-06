const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');

/* GET /api/lab-tests
Query params: ?status=String (optional), ?testCategory=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }]
} */
router.get('/', labTestController.getAllLabTests);

/* GET /api/lab-tests/by-testname/:testName
Params: testName (String)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }]
} */
router.get('/by-testname/:testName', labTestController.getLabTestByTestName);

/* GET /api/lab-tests/by-category/:category
Params: category (String)
Response: {
  success: Boolean,
  count: Number,
  category: String,
  data: [{
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }]
} */
router.get('/by-category/:category', labTestController.getLabTestByCategory);

/* GET /api/lab-tests/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }
} */
router.get('/:id', labTestController.getLabTestById);

/* POST /api/lab-tests
Request: {
  DisplayTestId: String (required),
  TestName: String (required),
  TestCategory: String (required), // "BloodTest" | "Imaging" | "Radiology" | "UrineTest" | "Ultrasound"
  Description: String (optional),
  Charges: Number (required),
  Status: String (optional) // "Active" | "InActive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }
} */
router.post('/', labTestController.createLabTest);

/* PUT /api/lab-tests/:id
Params: id (Number)
Request: {
  DisplayTestId: String (optional),
  TestName: String (optional),
  TestCategory: String (optional), // "BloodTest" | "Imaging" | "Radiology" | "UrineTest" | "Ultrasound"
  Description: String (optional),
  Charges: Number (optional),
  Status: String (optional) // "Active" | "InActive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }
} */
router.put('/:id', labTestController.updateLabTest);

/* DELETE /api/lab-tests/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    LabTestId: Number,
    DisplayTestId: String,
    TestName: String,
    TestCategory: String,
    Description: String | null,
    Charges: Number,
    Status: String,
    CreatedAt: Date
  }
} */
router.delete('/:id', labTestController.deleteLabTest);

module.exports = router;

