const express = require('express');
const router = express.Router();
const roomBedsController = require('../controllers/roomBedsController');

/* GET /api/room-beds/count/active
Response: {
  success: Boolean,
  message: String,
  count: Number,
  data: {
    count: Number,
    status: String
  }
} */
router.get('/count/active', roomBedsController.getActiveBedsCount);

/* GET /api/room-beds/count/by-roomtype
Response: {
  success: Boolean,
  message: String,
  data: {
    Special: Number,
    SpecialShared: Number,
    Regular: Number,
    total: Number
  }
} */
router.get('/count/by-roomtype', roomBedsController.getIPDRoomCountsByType);

/* GET /api/room-beds
Query params: ?status=String (optional), ?roomCategory=String (optional), ?roomType=String (optional), ?roomNo=String (optional)
Response: {
  success: Boolean,
  count: Number,
  data: [{
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/', roomBedsController.getAllRoomBeds);

/* GET /api/room-beds/by-bedno/:bedNo
Params: bedNo (String)
Response: {
  success: Boolean,
  data: {
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/by-bedno/:bedNo', roomBedsController.getRoomBedsByBedNo);

/* GET /api/room-beds/by-category/:category
Params: category (String) // "AC" | "Non AC"
Response: {
  success: Boolean,
  count: Number,
  data: [{
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/by-category/:category', roomBedsController.getRoomBedsByCategory);

/* GET /api/room-beds/by-roomtype/:roomType
Params: roomType (String) // "Special" | "Special Shared" | "Regular"
Response: {
  success: Boolean,
  count: Number,
  data: [{
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }]
} */
router.get('/by-roomtype/:roomType', roomBedsController.getRoomBedsByRoomType);

/* GET /api/room-beds/:id
Params: id (Number)
Response: {
  success: Boolean,
  data: {
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.get('/:id', roomBedsController.getRoomBedsById);

/* POST /api/room-beds
Request: {
  BedNo: String (optional), // Auto-generated if not provided
  RoomNo: String (optional),
  RoomCategory: String (required), // "AC" | "Non AC"
  RoomType: String (required), // "Special" | "Special Shared" | "Regular"
  ChargesPerDay: Number (required),
  Status: String (optional), // "Active" | "Inactive", defaults to "Active"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.post('/', roomBedsController.createRoomBeds);

/* PUT /api/room-beds/:id
Params: id (Number)
Request: {
  BedNo: String (optional),
  RoomNo: String (optional),
  RoomCategory: String (optional), // "AC" | "Non AC"
  RoomType: String (optional), // "Special" | "Special Shared" | "Regular"
  ChargesPerDay: Number (optional),
  Status: String (optional), // "Active" | "Inactive"
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.put('/:id', roomBedsController.updateRoomBeds);

/* DELETE /api/room-beds/:id
Params: id (Number)
Response: {
  success: Boolean,
  message: String,
  data: {
    RoomBedsId: Number,
    BedNo: String,
    RoomNo: String | null,
    RoomCategory: String,
    RoomType: String,
    ChargesPerDay: Number,
    Status: String,
    CreatedBy: Number | null,
    CreatedAt: Date
  }
} */
router.delete('/:id', roomBedsController.deleteRoomBeds);

module.exports = router;

