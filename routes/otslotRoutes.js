const express = require('express');
const router = express.Router();
const otslotController = require('../controllers/otslotController');

/* GET /api/ot-slots/by-ot/:otId
Params: otId (Number)
Response: {
  success: Boolean,
  count: Number,
  otId: Number,
  data: [{
    OTSlotId: Number,
    OTId: Number,
    OTSlotNo: String,
    SlotStartTime: String,
    SlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    OTNo: String | null,
    OTName: String | null,
    OTType: String | null,
    IsAvailable: Boolean,
    OccupiedByPatientId: String (UUID) | null, // Patient ID if slot is occupied
    OccupiedByPatientNo: String | null // Patient number if slot is occupied
  }]
}
Note: IsAvailable indicates whether the slot is available based on PatientOTAllocation table.
      A slot is considered unavailable if there's an active allocation with OperationStatus not in ('Completed', 'Cancelled').
      When a slot is occupied (IsAvailable = false), OccupiedByPatientId and OccupiedByPatientNo will contain the patient information.
} */
router.get('/by-ot/:otId', otslotController.getOTSlotsByOTId);

/* GET /api/ot-slots
Query params: ?status=String (optional), ?otId=Number (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    OTSlotId: Number,
    OTId: Number,
    OTSlotNo: String,
    SlotStartTime: String,
    SlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    OTNo: String | null,
    OTName: String | null,
    OTType: String | null,
    IsAvailable: Boolean (only present when otId query param is provided),
    OccupiedByPatientId: String (UUID) | null, // Patient ID if slot is occupied (only present when otId query param is provided)
    OccupiedByPatientNo: String | null // Patient number if slot is occupied (only present when otId query param is provided)
  }]
}
Note: When otId is provided, IsAvailable indicates whether the slot is available based on PatientOTAllocation table.
      A slot is considered unavailable if there's an active allocation with OperationStatus not in ('Completed', 'Cancelled').
      When a slot is occupied (IsAvailable = false), OccupiedByPatientId and OccupiedByPatientNo will contain the patient information.
} */
router.get('/', otslotController.getAllOTSlots);

/* GET /api/ot-slots/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    OTSlotId: Number,
    OTId: Number,
    OTSlotNo: String,
    SlotStartTime: String,
    SlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    OTNo: String | null,
    OTName: String | null,
    OTType: String | null
  }
} */
router.get('/:id', otslotController.getOTSlotById);

/* POST /api/ot-slots
Request: {
  OTId: Number (required),
  SlotStartTime: String (required), // HH:MM or HH:MM:SS format
  SlotEndTime: String (required), // HH:MM or HH:MM:SS format, must be after SlotStartTime
  Status: String (optional) // "Active" | "Inactive", defaults to "Active"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    OTSlotId: Number,
    OTId: Number,
    OTSlotNo: String,
    SlotStartTime: String,
    SlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    OTNo: String | null,
    OTName: String | null,
    OTType: String | null
  }
} */
router.post('/', otslotController.createOTSlot);

/* PUT /api/ot-slots/:id
Params: id (Number)
Request: {
  OTId: Number (optional),
  SlotStartTime: String (optional), // HH:MM or HH:MM:SS format
  SlotEndTime: String (optional), // HH:MM or HH:MM:SS format, must be after SlotStartTime
  Status: String (optional) // "Active" | "Inactive"
}
Response: {
  success: Boolean,
  message: String,
  data: {
    OTSlotId: Number,
    OTId: Number,
    OTSlotNo: String,
    SlotStartTime: String,
    SlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    OTNo: String | null,
    OTName: String | null,
    OTType: String | null
  }
} */
router.put('/:id', otslotController.updateOTSlot);

/* DELETE /api/ot-slots/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    OTSlotId: Number,
    OTId: Number,
    OTSlotNo: String,
    SlotStartTime: String,
    SlotEndTime: String,
    Status: String,
    CreatedAt: Date,
    OTNo: String | null,
    OTName: String | null,
    OTType: String | null
  }
} */
router.delete('/:id', otslotController.deleteOTSlot);

module.exports = router;

