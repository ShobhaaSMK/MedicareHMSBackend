const express = require('express');
const router = express.Router();
const otslotController = require('../controllers/otslotController');

/* GET /api/ot-slots/by-ot/:otId
Params: otId (Number)
Query params: ?date=String (optional, DD-MM-YYYY format, defaults to today's date)
Response: {
  success: Boolean,
  count: Number,
  otId: Number,
  date: String (DD-MM-YYYY), // The date being checked for availability
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
    OccupiedByPatientId: String (UUID) | null, // Patient ID if slot is occupied on this date
    OccupiedByPatientNo: String | null, // Patient number if slot is occupied on this date
    OTAllocationDate: String (DD-MM-YYYY) | null // OT Allocation Date from PatientOTAllocationSlots
  }]
}
Note: IsAvailable indicates whether the slot is available on the specified date based on PatientOTAllocationSlots.OTAllocationDate.
      A slot is considered unavailable if there's an active allocation with:
      - OperationStatus not in ('Completed', 'Cancelled')
      - OTAllocationDate matching the query date (or OTAllocationDate is NULL)
      When a slot is occupied (IsAvailable = false), OccupiedByPatientId and OccupiedByPatientNo will contain the patient information.
      Availability is date-specific - a slot can be occupied on one date and available on another.
      Date format: DD-MM-YYYY (e.g., 15-12-2024)
} */
router.get('/by-ot/:otId', otslotController.getOTSlotsByOTId);

/* GET /api/ot-slots
Query params: 
  - status: String (optional), "Active" | "InActive"
  - otId: Number (optional), enables availability check
  - date: String (optional, DD-MM-YYYY format, defaults to today's date), used for date-specific availability check
Response: {
  success: Boolean,
  count: Number,
  date: String (DD-MM-YYYY), // The date being checked for availability (always present)
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
    OccupiedByPatientId: String (UUID) | null, // Patient ID if slot is occupied on this date (only present when otId query param is provided)
    OccupiedByPatientNo: String | null, // Patient number if slot is occupied on this date (only present when otId query param is provided)
    OTAllocationDate: String (DD-MM-YYYY) | null // OT Allocation Date from PatientOTAllocationSlots (only present when otId query param is provided)
  }]
}
Note: When otId is provided, IsAvailable indicates whether the slot is available on the specified date based on PatientOTAllocationSlots.OTAllocationDate.
      A slot is considered unavailable if there's an active allocation with:
      - OperationStatus not in ('Completed', 'Cancelled')
      - OTAllocationDate matching the query date (or OTAllocationDate is NULL)
      When a slot is occupied (IsAvailable = false), OccupiedByPatientId and OccupiedByPatientNo will contain the patient information.
      Availability is date-specific - a slot can be occupied on one date and available on another.
      If date is not provided, defaults to today's date (DD-MM-YYYY format).
      Date format: DD-MM-YYYY (e.g., 15-12-2024)
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

