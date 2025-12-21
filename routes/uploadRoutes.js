const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

/**
 * POST /api/upload
 * Upload a file
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
router.post('/', uploadController.uploadFile);

/**
 * DELETE /api/upload/:folder/:patientNo/:filename
 * Delete a file (optional enhancement)
 */
router.delete('/:folder/:patientNo/:filename', uploadController.deleteFile);

module.exports = router;
