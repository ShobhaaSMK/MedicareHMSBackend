const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/* POST /api/auth/login
Request: {
  UserName: String (required),
  Password: String (required)
}
Response: {
  success: Boolean,
  message: String,
  data: {
    token: String,
    user: {
      UserId: Number,
      RoleId: String (UUID),
      UserName: String,
      PhoneNo: String | null,
      EmailId: String | null,
      DoctorDepartmentId: String (UUID) | null,
      DoctorQualification: String | null,
      DoctorType: String | null,
      DoctorOPDCharge: Number | null,
      DoctorSurgeryCharge: Number | null,
      OPDConsultation: String | null,
      IPDVisit: String | null,
      OTHandle: String | null,
      ICUVisits: String | null,
      Status: String,
      CreatedAt: Date,
      RoleName: String | null,
      DepartmentName: String | null
    }
  }
} */
router.post('/login', authController.login);

/* POST /api/auth/forgot-password
Request: {
  EmailId: String (optional), // Either EmailId or UserName is required
  UserName: String (optional) // Either EmailId or UserName is required
}
Response: {
  success: Boolean,
  message: String,
  data: {
    resetToken: String (optional), // Only in development mode if email not configured
    resetLink: String (optional), // Only in development mode if email not configured
    note: String (optional) // Only in development mode if email not configured
  }
} */
router.post('/forgot-password', authController.forgotPassword);

/* POST /api/auth/reset-password
Request: {
  token: String (required), // Password reset token from forgot-password
  newPassword: String (required) // Minimum 6 characters
}
Response: {
  success: Boolean,
  message: String
} */
router.post('/reset-password', authController.resetPassword);

/* GET /api/auth/verify
Headers: Authorization: Bearer <token> OR x-access-token: <token>
Response: {
  success: Boolean,
  message: String,
  data: {
    decoded: {
      userId: Number,
      userName: String,
      roleId: String (UUID),
      iat: Number,
      exp: Number
    },
    user: {
      UserId: Number,
      UserName: String,
      RoleId: String (UUID),
      RoleName: String | null,
      Status: String
    }
  }
} */
router.get('/verify', authController.verifyToken);

module.exports = router;

