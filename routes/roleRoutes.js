const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

/* GET /api/roles
Response: {
  success: Boolean,
  count: Number,
  data: [{
    RoleId: String (UUID),
    RoleName: String,
    RoleDescription: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }]
} */
router.get('/', roleController.getAllRoles);

/* GET /api/roles/:id
Params: id (String UUID)
Response: {
  success: Boolean,
  data: {
    RoleId: String (UUID),
    RoleName: String,
    RoleDescription: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.get('/:id', roleController.getRoleById);

/* POST /api/roles
Request: {
  RoleName: String (required),
  RoleDescription: String (optional),
  CreatedBy: Number (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    RoleId: String (UUID),
    RoleName: String,
    RoleDescription: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.post('/', roleController.createRole);

/* PUT /api/roles/:id
Params: id (String UUID)
Request: {
  RoleName: String (optional),
  RoleDescription: String (optional)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    RoleId: String (UUID),
    RoleName: String,
    RoleDescription: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.put('/:id', roleController.updateRole);

/* DELETE /api/roles/:id
Params: id (String UUID)
Response: {
  success: Boolean,
  message: String,
  data: {
    RoleId: String (UUID),
    RoleName: String,
    RoleDescription: String,
    CreatedAt: Date,
    CreatedBy: Number | null
  }
} */
router.delete('/:id', roleController.deleteRole);

module.exports = router;

