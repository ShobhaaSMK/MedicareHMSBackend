const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true' || false;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create reusable transporter
const createTransporter = () => {
  // If email credentials are not configured, return null
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (to, userName, resetToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.');
    }

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"MediCare HMS" <${EMAIL_FROM}>`,
      to: to,
      subject: 'Password Reset Request - MediCare HMS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #45a049;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .token {
              background-color: #f4f4f4;
              padding: 10px;
              border-radius: 3px;
              font-family: monospace;
              word-break: break-all;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MediCare Hospital Management System</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${userName || 'User'},</p>
              <p>We received a request to reset your password for your MediCare HMS account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token">${resetLink}</div>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>For security reasons, never share this link with anyone.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} MediCare HMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - MediCare HMS
        
        Hello ${userName || 'User'},
        
        We received a request to reset your password for your MediCare HMS account.
        
        Click the following link to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you did not request a password reset, please ignore this email or contact support if you have concerns.
        
        For security reasons, never share this link with anyone.
        
        This is an automated message. Please do not reply to this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send password reset success email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 */
const sendPasswordResetSuccessEmail = async (to, userName) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      // If email is not configured, just log and return
      console.log('Email service not configured. Skipping success email.');
      return;
    }

    const mailOptions = {
      from: `"MediCare HMS" <${EMAIL_FROM}>`,
      to: to,
      subject: 'Password Reset Successful - MediCare HMS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MediCare Hospital Management System</h1>
            </div>
            <div class="content">
              <h2>Password Reset Successful</h2>
              <p>Hello ${userName || 'User'},</p>
              <p>Your password has been successfully reset.</p>
              <p>If you did not make this change, please contact support immediately.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} MediCare HMS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Successful - MediCare HMS
        
        Hello ${userName || 'User'},
        
        Your password has been successfully reset.
        
        If you did not make this change, please contact support immediately.
        
        This is an automated message. Please do not reply to this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    // Don't throw error for success email, just log it
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
};

