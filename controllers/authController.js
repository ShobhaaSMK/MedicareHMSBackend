const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendPasswordResetSuccessEmail } = require('../utils/emailService');

// JWT secret key - should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || '1h';

/**
 * Login function that authenticates user with UserName and Password
 * Returns JWT token upon successful authentication
 */
exports.login = async (req, res) => {
  try {

    

    const { username: UserName, password: Password } = req.method === 'GET' ? req.query : req.body;

    // Validate input
    if (!UserName || !UserName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'UserName is required',
      });
    }

    if (!Password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Find user by UserName
    const { rows } = await db.query(
      `
      SELECT 
        u."UserId",
        u."RoleId",
        u."UserName",
        u."Password",
        u."PhoneNo",
        u."EmailId",
        u."DoctorDepartmentId",
        u."DoctorQualification",
        u."DoctorType",
        u."DoctorOPDCharge",
        u."DoctorSurgeryCharge",
        u."OPDConsultation",
        u."IPDVisit",
        u."OTHandle",
        u."ICUVisits",
        u."Status",
        u."CreatedBy",
        u."CreatedAt",
        r."RoleName",
        d."DepartmentName"
      FROM "Users" u
      LEFT JOIN "Roles" r ON u."RoleId" = r."RoleId"
      LEFT JOIN "DoctorDepartment" d ON u."DoctorDepartmentId" = d."DoctorDepartmentId"
      WHERE u."UserName" = $1
      `,
      [UserName.trim()]
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid UserName or Password',
      });
    }

    const user = rows[0];

    // Check if user is active
    if (user.Status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'User account is not active',
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(Password, user.Password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid UserName or Password',
      });
    }

    // Remove password from user object before sending response
    const userWithoutPassword = {
      UserId: user.UserId || user.userid,
      RoleId: user.RoleId || user.roleid,
      UserName: user.UserName || user.username,
      PhoneNo: user.PhoneNo || user.phoneno,
      EmailId: user.EmailId || user.emailid,
      DoctorDepartmentId: user.DoctorDepartmentId || user.doctordepartmentid,
      DoctorQualification: user.DoctorQualification || user.doctorqualification,
      DoctorType: user.DoctorType || user.doctortype,
      DoctorOPDCharge: user.DoctorOPDCharge !== undefined && user.DoctorOPDCharge !== null 
        ? parseFloat(user.DoctorOPDCharge) 
        : (user.doctoropdcharge !== undefined && user.doctoropdcharge !== null 
          ? parseFloat(user.doctoropdcharge) 
          : null),
      DoctorSurgeryCharge: user.DoctorSurgeryCharge !== undefined && user.DoctorSurgeryCharge !== null 
        ? parseFloat(user.DoctorSurgeryCharge) 
        : (user.doctorsurgerycharge !== undefined && user.doctorsurgerycharge !== null 
          ? parseFloat(user.doctorsurgerycharge) 
          : null),
      OPDConsultation: user.OPDConsultation || user.opdconsultation,
      IPDVisit: user.IPDVisit || user.ipdvisit,
      OTHandle: user.OTHandle || user.othandle,
      ICUVisits: user.ICUVisits || user.icuvisits,
      Status: user.Status || user.status,
      CreatedBy: user.CreatedBy || user.createdby,
      CreatedAt: user.CreatedAt || user.createdat,
      RoleName: user.RoleName || user.rolename,
      DepartmentName: user.DepartmentName || user.departmentname,
    };

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userWithoutPassword.UserId,
        userName: userWithoutPassword.UserName,
        roleId: userWithoutPassword.RoleId,
        RoleName: userWithoutPassword.RoleName,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    // Return success response with token and user info
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message,
    });
  }
};

/**
 * Verify token endpoint (optional - for testing token validity)
 */
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Optionally fetch fresh user data
    const { rows } = await db.query(
      `
      SELECT 
        u."UserId",
        u."RoleId",
        u."UserName",
        u."PhoneNo",
        u."EmailId",
        u."Status",
        r."RoleName"
      FROM "Users" u
      LEFT JOIN "Roles" r ON u."RoleId" = r."RoleId"
      WHERE u."UserId" = $1
      `,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        decoded,
        user: {
          UserId: rows[0].UserId,
          UserName: rows[0].UserName,
          RoleId: rows[0].RoleId,
          RoleName: rows[0].RoleName,
          Status: rows[0].Status,
        },
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error verifying token',
      error: error.message,
    });
  }
};

/**
 * Forgot password function
 * Sends password reset email to user's EmailId
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { EmailId, UserName } = req.body;

    // Validate input - require either EmailId or UserName
    if (!EmailId && !UserName) {
      return res.status(400).json({
        success: false,
        message: 'EmailId or UserName is required',
      });
    }

    // Build query based on provided input
    let query;
    let params;
    
    if (EmailId) {
      query = `
        SELECT 
          u."UserId",
          u."UserName",
          u."EmailId",
          u."Status"
        FROM "Users" u
        WHERE u."EmailId" = $1
      `;
      params = [EmailId.trim()];
    } else {
      query = `
        SELECT 
          u."UserId",
          u."UserName",
          u."EmailId",
          u."Status"
        FROM "Users" u
        WHERE u."UserName" = $1
      `;
      params = [UserName.trim()];
    }

    const { rows } = await db.query(query, params);

    // For security, always return success message even if user doesn't exist
    // This prevents email enumeration attacks
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const user = rows[0];

    // Check if user is active
    if (user.Status !== 'Active') {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if user has an email address
    if (!user.EmailId || !user.EmailId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User account does not have an email address. Please contact administrator.',
      });
    }

    // Generate password reset token (JWT with short expiry)
    const resetToken = jwt.sign(
      {
        userId: user.UserId,
        userName: user.UserName,
        type: 'password-reset',
      },
      JWT_SECRET,
      {
        expiresIn: RESET_TOKEN_EXPIRES_IN,
      }
    );

    try {
      // Send password reset email
      await sendPasswordResetEmail(
        user.EmailId.trim(),
        user.UserName,
        resetToken
      );

      res.status(200).json({
        success: true,
        message: 'Password reset link has been sent to your email address.',
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // In development mode, return the token directly if email is not configured
      if (process.env.NODE_ENV === 'development' && emailError.message.includes('Email service is not configured')) {
        return res.status(200).json({
          success: true,
          message: 'Email service is not configured. In development mode, here is your reset token:',
          data: {
            resetToken: resetToken,
            resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
            note: 'Configure EMAIL_USER and EMAIL_PASSWORD in .env file to enable email sending.',
          },
        });
      }
      
      // If email fails for other reasons, return error
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later or contact support.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
        note: process.env.NODE_ENV === 'development' ? 'Check server logs for details. Make sure EMAIL_USER and EMAIL_PASSWORD are set in .env file.' : undefined,
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message,
    });
  }
};

/**
 * Reset password function
 * Resets user password using the reset token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    // Validate password strength (optional - add your own rules)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Verify and decode the reset token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (tokenError) {
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token',
        });
      }
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Reset token has expired. Please request a new password reset.',
        });
      }
      throw tokenError;
    }

    // Check if token is a password reset token
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token type',
      });
    }

    // Verify user exists and is active
    const { rows } = await db.query(
      `
      SELECT 
        u."UserId",
        u."UserName",
        u."EmailId",
        u."Status"
      FROM "Users" u
      WHERE u."UserId" = $1
      `,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = rows[0];

    if (user.Status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'User account is not active',
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await db.query(
      'UPDATE "Users" SET "Password" = $1 WHERE "UserId" = $2',
      [hashedPassword, user.UserId]
    );

    // Send success email (don't fail if email fails)
    try {
      if (user.EmailId) {
        await sendPasswordResetSuccessEmail(user.EmailId, user.UserName);
      }
    } catch (emailError) {
      console.error('Error sending password reset success email:', emailError);
      // Continue even if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

