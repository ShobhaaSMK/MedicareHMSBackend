const express = require('express');
const router = express.Router();
const emergencyBedSlotController = require('../controllers/emergencyBedSlotController');

/* GET /api/emergency-bed-slots
Query params: ?status=String (optional), ?emergencyBedId=Number (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    EmergencyBedSlotId: Number,
    EmergencyBedId: Number,
    EBedSlotNo: String,
    ESlotStartTime: String,
    ESlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    EmergencyBedNo: String | null,
    EmergencyRoomDescription: String | null
  }]
} */
router.get('/', emergencyBedSlotController.getAllEmergencyBedSlots);

/* GET /api/emergency-bed-slots/by-emergency-bed/:emergencyBedId
Params: emergencyBedId (Number)
Response: {
  success: Boolean,
  count: Number,
  emergencyBedId: Number,
  data: [{
    EmergencyBedSlotId: Number,
    EmergencyBedId: Number,
    EBedSlotNo: String,
    ESlotStartTime: String,
    ESlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    EmergencyBedNo: String | null,
    EmergencyRoomDescription: String | null
  }]
} */
router.get('/by-emergency-bed/:emergencyBedId', emergencyBedSlotController.getEmergencyBedSlotsByEmergencyBedId);

/* GET /api/emergency-bed-slots/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    EmergencyBedSlotId: Number,
    EmergencyBedId: Number,
    EBedSlotNo: String,
    ESlotStartTime: String,
    ESlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    EmergencyBedNo: String | null,
    EmergencyRoomDescription: String | null
  }
} */
router.get('/:id', emergencyBedSlotController.getEmergencyBedSlotById);

/* POST /api/emergency-bed-slots
Request: {
  EmergencyBedId: Number (required),
  ESlotStartTime: String (required), // HH:MM or HH:MM:SS format
  ESlotEndTime: String (required), // HH:MM or HH:MM:SS format, must be after ESlotStartTime
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyBedSlotId: Number,
    EmergencyBedId: Number,
    EBedSlotNo: String,
    ESlotStartTime: String,
    ESlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    EmergencyBedNo: String | null,
    EmergencyRoomDescription: String | null
  }
} */
router.post('/', emergencyBedSlotController.createEmergencyBedSlot);

/* PUT /api/emergency-bed-slots/:id
Params: id (Number)
Request: {
  EmergencyBedId: Number (optional),
  ESlotStartTime: String (optional), // HH:MM or HH:MM:SS format
  ESlotEndTime: String (optional), // HH:MM or HH:MM:SS format, must be after ESlotStartTime
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyBedSlotId: Number,
    EmergencyBedId: Number,
    EBedSlotNo: String,
    ESlotStartTime: String,
    ESlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    EmergencyBedNo: String | null,
    EmergencyRoomDescription: String | null
  }
} */
router.put('/:id', emergencyBedSlotController.updateEmergencyBedSlot);

/* DELETE /api/emergency-bed-slots/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyBedSlotId: Number,
    EmergencyBedId: Number,
    EBedSlotNo: String,
    ESlotStartTime: String,
    ESlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    EmergencyBedNo: String | null,
    EmergencyRoomDescription: String | null
  }
} */
router.delete('/:id', emergencyBedSlotController.deleteEmergencyBedSlot);

module.exports = router;

