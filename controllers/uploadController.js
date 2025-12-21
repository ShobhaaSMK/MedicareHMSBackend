const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Allowed file types
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'];

// File size limit: 20MB
const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

/**
 * Get PatientNo from PatientId
 */
async function getPatientNoFromPatientId(patientId) {
  try {
    const { rows } = await db.query(
      'SELECT "PatientNo" FROM "PatientRegistration" WHERE "PatientId" = $1::uuid',
      [patientId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0].PatientNo || rows[0].patientno;
  } catch (error) {
    console.error('Error fetching PatientNo:', error);
    return null;
  }
}

/**
 * Create multer middleware for file uploads
 * Organizes files by folder (e.g., ot-documents) and patient number
 */
const createUploadMiddleware = () => {
  return multer({
    storage: multer.diskStorage({
      destination: async function (req, file, cb) {
        try {
          // Get folder from body or query (e.g., "ot-documents")
          const folder = (req.body?.folder || req.query?.folder || '').trim();
          
          if (!folder) {
            return cb(new Error('folder parameter is required'));
          }

          // Get PatientId from body or query
          const patientId = (req.body.PatientId || req.query.PatientId || '').trim();
          
          if (!patientId) {
            return cb(new Error('PatientId parameter is required'));
          }

          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(patientId)) {
            return cb(new Error('Invalid PatientId format. Must be a valid UUID'));
          }

          // Get PatientNo from database
          const patientNo = await getPatientNoFromPatientId(patientId);
          
          if (!patientNo) {
            return cb(new Error(`Patient not found for PatientId: ${patientId}`));
          }

          // Create uploads directory if it doesn't exist
          const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          // Create folder directory (e.g., ot-documents)
          const folderDir = path.join(uploadsDir, folder);
          if (!fs.existsSync(folderDir)) {
            fs.mkdirSync(folderDir, { recursive: true });
          }

          // Create patient-specific directory: uploads/{folder}/{patientNo}
          const patientDir = path.join(folderDir, patientNo);
          if (!fs.existsSync(patientDir)) {
            fs.mkdirSync(patientDir, { recursive: true });
          }

          // Store info in request for later use
          req.uploadFolder = folder;
          req.patientNo = patientNo;
          req.patientDir = patientDir;

          cb(null, patientDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: function (req, file, cb) {
        // Generate unique filename: originalname_timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${name}_${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: maxFileSize
    },
    fileFilter: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimeType = file.mimetype;

      // Check extension
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`));
      }

      // Check MIME type
      if (!allowedMimeTypes.includes(mimeType)) {
        return cb(new Error(`MIME type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
      }

      cb(null, true);
    }
  });
};

/**
 * Upload file endpoint
 * POST /api/upload
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Body fields:
 *   - file: The file to upload (File object)
 *   - folder: String value (e.g., "ot-documents")
 *   - PatientId: UUID of the patient
 * 
 * Response:
 * {
 *   "success": true,
 *   "url": "https://your-domain.com/uploads/ot-documents/PatientNo/filename.pdf"
 * }
 */
exports.uploadFile = async (req, res) => {
  try {
    // ========== LOG REQUEST DETAILS ==========
    console.log('\n' + '='.repeat(80));
    console.log('📤 FILE UPLOAD REQUEST RECEIVED');
    console.log('='.repeat(80));
    
    // Log request method and URL
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl || req.url}`);
    console.log(`Content-Type: ${req.headers['content-type'] || 'Not set'}`);
    
    // Log query parameters
    if (Object.keys(req.query).length > 0) {
      console.log('\n📋 Query Parameters:');
      console.log(JSON.stringify(req.query, null, 2));
    } else {
      console.log('\n📋 Query Parameters: None');
    }
    
    // Log body fields (before multer processes)
    console.log('\n📋 Form Body Fields (before multer):');
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyLog = { ...req.body };
      // Don't log file content if it's already processed
      console.log(JSON.stringify(bodyLog, null, 2));
    } else {
      console.log('  No body fields detected yet (will be processed by multer)');
    }
    
    // Log expected fields
    console.log('\n✅ Expected Fields:');
    console.log('  - file: File object (multipart/form-data)');
    console.log('  - folder: String (e.g., "ot-documents")');
    console.log('  - PatientId: UUID string (e.g., "a7f88a65-68d1-419e-a8e8-64e079f863e0")');
    
    // Check what's missing before multer processes
    const receivedFields = Object.keys(req.body || {});
    const expectedFields = ['file', 'folder', 'PatientId'];
    const missingFields = expectedFields.filter(field => {
      if (field === 'file') {
        // File will be in req.file after multer processes
        return true; // We'll check this later
      }
      return !receivedFields.includes(field) && !req.query[field];
    });
    
    if (missingFields.length > 0 && missingFields[0] !== 'file') {
      console.log('\n⚠️  Missing Fields (before multer processing):');
      missingFields.forEach(field => {
        if (field !== 'file') {
          console.log(`  - ${field}: NOT PROVIDED`);
        }
      });
    }
    
    // Create multer middleware
    const upload = createUploadMiddleware();
    
    // Handle single file upload
    const uploadMiddleware = upload.single('file');
    
    uploadMiddleware(req, res, async (err) => {
      // ========== LOG AFTER MULTER PROCESSING ==========
      console.log('\n' + '-'.repeat(80));
      console.log('📦 DATA AFTER MULTER PROCESSING');
      console.log('-'.repeat(80));
      
      // Log file information
      if (req.file) {
        console.log('\n📄 File Information:');
        console.log(`  - Field Name: ${req.file.fieldname}`);
        console.log(`  - Original Name: ${req.file.originalname}`);
        console.log(`  - Stored Filename: ${req.file.filename}`);
        console.log(`  - MIME Type: ${req.file.mimetype}`);
        console.log(`  - Size: ${req.file.size} bytes (${(req.file.size / 1024).toFixed(2)} KB)`);
        console.log(`  - Encoding: ${req.file.encoding || 'N/A'}`);
        console.log(`  - Destination: ${req.file.destination}`);
        console.log(`  - Path: ${req.file.path}`);
      } else {
        console.log('\n📄 File Information:');
        console.log('  ⚠️  NO FILE RECEIVED');
      }
      
      // Log body fields after multer
      console.log('\n📋 Form Body Fields (after multer):');
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyLog = { ...req.body };
        console.log(JSON.stringify(bodyLog, null, 2));
      } else {
        console.log('  No body fields');
      }
      
      // Check all required fields
      const hasFile = !!req.file;
      const hasFolder = !!(req.body.folder || req.query.folder);
      const hasPatientId = !!(req.body.PatientId || req.query.PatientId);
      
      console.log('\n✅ Field Validation:');
      console.log(`  - file: ${hasFile ? '✓ PROVIDED' : '✗ MISSING'}`);
      console.log(`  - folder: ${hasFolder ? '✓ PROVIDED' : '✗ MISSING'} ${hasFolder ? `(${req.body.folder || req.query.folder})` : ''}`);
      console.log(`  - PatientId: ${hasPatientId ? '✓ PROVIDED' : '✗ MISSING'} ${hasPatientId ? `(${req.body.PatientId || req.query.PatientId})` : ''}`);
      
      // Log what's missing
      const missing = [];
      if (!hasFile) missing.push('file');
      if (!hasFolder) missing.push('folder');
      if (!hasPatientId) missing.push('PatientId');
      
      if (missing.length > 0) {
        console.log('\n⚠️  MISSING REQUIRED FIELDS:');
        missing.forEach(field => {
          console.log(`  - ${field}: REQUIRED but NOT PROVIDED`);
        });
      }
      
      // Log what was received
      console.log('\n📥 RECEIVED DATA SUMMARY:');
      console.log(`  - File: ${hasFile ? `Yes (${req.file.originalname}, ${req.file.size} bytes)` : 'No'}`);
      console.log(`  - Folder: ${hasFolder ? (req.body.folder || req.query.folder) : 'No'}`);
      console.log(`  - PatientId: ${hasPatientId ? (req.body.PatientId || req.query.PatientId) : 'No'}`);
      
      if (err) {
        console.log('\n❌ ERROR DETECTED:');
        console.log(`  Type: ${err.constructor.name}`);
        console.log(`  Message: ${err.message}`);
        if (err.code) console.log(`  Code: ${err.code}`);
        console.error('Upload error:', err);
        
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File size exceeds limit. Maximum size is ${maxFileSize / (1024 * 1024)}MB`,
              error: err.message
            });
          }
          return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
          });
        }
        
        // Handle other errors (validation, etc.)
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          error: err.message
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        console.log('\n❌ VALIDATION FAILED: No file provided');
        return res.status(400).json({
          success: false,
          message: 'No file provided. Please include a file in the "file" field.'
        });
      }

      // Log upload folder info (set by multer destination function)
      if (req.uploadFolder && req.patientNo) {
        console.log('\n📁 UPLOAD DESTINATION:');
        console.log(`  - Folder: ${req.uploadFolder}`);
        console.log(`  - Patient No: ${req.patientNo}`);
        console.log(`  - Patient Directory: ${req.patientDir}`);
      }

      // Generate file URL
      // Format: {baseUrl}/uploads/{folder}/{patientNo}/{filename}
      // Get base URL from environment or construct from request
      const port = process.env.PORT || 4000;
      const protocol = req.protocol || 'http';
      const host = req.get('host') || `localhost:${port}`;
      let baseUrl = process.env.UPLOADS_BASE_URL || process.env.BASE_URL || `${protocol}://${host}`;
      
      // Remove trailing slash from base URL if present
      baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      
      const fileUrl = `${baseUrl}/uploads/${req.uploadFolder}/${req.patientNo}/${req.file.filename}`;

      console.log('\n✅ UPLOAD SUCCESSFUL:');
      console.log(`  - Original Name: ${req.file.originalname}`);
      console.log(`  - Stored As: ${req.file.filename}`);
      console.log(`  - Patient: ${req.patientNo}`);
      console.log(`  - Folder: ${req.uploadFolder}`);
      console.log(`  - File URL: ${fileUrl}`);
      console.log('='.repeat(80) + '\n');

      // Return response in the format requested (Option 1: Direct URL in response)
      res.status(200).json({
        success: true,
        url: fileUrl
      });
    });

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:');
    console.error('Error in uploadFile:', error);
    console.error('Stack:', error.stack);
    console.log('='.repeat(80) + '\n');
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

/**
 * Delete file endpoint (optional enhancement)
 * DELETE /api/upload/:folder/:patientNo/:filename
 */
exports.deleteFile = async (req, res) => {
  try {
    const { folder, patientNo, filename } = req.params;

    if (!folder || !patientNo || !filename) {
      return res.status(400).json({
        success: false,
        message: 'folder, patientNo, and filename are required'
      });
    }

    // Security: Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, folder, patientNo, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    console.log(`✓ File deleted: ${filePath}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteFile:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};
