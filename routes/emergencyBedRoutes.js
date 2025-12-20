const express = require('express');
const router = express.Router();
const emergencyBedController = require('../controllers/emergencyBedController');

/* GET /api/emergency-beds
Query params: ?status=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    EmergencyBedId: Number,
    EmergencyBedNo: String,
    EmergencyRoomNameNo: String | null,
    EmergencyRoomDescription: String | null,
    ChargesPerDay: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/', emergencyBedController.getAllEmergencyBeds);

/* GET /api/emergency-beds/by-bedno/:bedNo
Params: bedNo (String)
Response: {
  success: Boolean,
  data: {
    EmergencyBedId: Number,
    EmergencyBedNo: String,
    EmergencyRoomNameNo: String | null,
    EmergencyRoomDescription: String | null,
    ChargesPerDay: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/by-bedno/:bedNo', emergencyBedController.getEmergencyBedByBedNo);

/* GET /api/emergency-beds/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    EmergencyBedId: Number,
    EmergencyBedNo: String,
    EmergencyRoomNameNo: String | null,
    EmergencyRoomDescription: String | null,
    ChargesPerDay: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/:id', emergencyBedController.getEmergencyBedById);

/* POST /api/emergency-beds
Request: {
  EmergencyRoomNameNo: String (optional), // character varying 100
  EmergencyRoomDescription: String (optional),
  ChargesPerDay: Number (optional),
  Status: String (optional), // "Active" | "Inactive" | "Occupied" | "Occupied", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyBedId: Number,
    EmergencyBedNo: String,
    EmergencyRoomNameNo: String | null,
    EmergencyRoomDescription: String | null,
    ChargesPerDay: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.post('/', emergencyBedController.createEmergencyBed);

/* PUT /api/emergency-beds/:id
Params: id (Number)
Request: {
  EmergencyRoomNameNo: String (optional), // character varying 100
  EmergencyRoomDescription: String (optional),
  ChargesPerDay: Number (optional),
  Status: String (optional), // "Active" | "Inactive" | "Occupied"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyBedId: Number,
    EmergencyBedNo: String,
    EmergencyRoomNameNo: String | null,
    EmergencyRoomDescription: String | null,
    ChargesPerDay: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.put('/:id', emergencyBedController.updateEmergencyBed);

/* DELETE /api/emergency-beds/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    EmergencyBedId: Number,
    EmergencyBedNo: String,
    EmergencyRoomNameNo: String | null,
    EmergencyRoomDescription: String | null,
    ChargesPerDay: Number | null,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.delete('/:id', emergencyBedController.deleteEmergencyBed);

module.exports = router;

