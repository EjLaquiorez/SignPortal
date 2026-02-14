const express = require('express');
const router = express.Router();
const signatureController = require('../controllers/signatureController');
const authenticateToken = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create signature (handles both canvas and file upload)
router.post('/', (req, res, next) => {
  // Check content type to determine if it's JSON or multipart
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    // Canvas signature (JSON with base64 data)
    return signatureController.createSignature(req, res);
  } else {
    // File upload (multipart/form-data) - use multer
    signatureController.upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      signatureController.createSignature(req, res);
    });
  }
});

// Get signatures by stage
router.get('/stage/:stageId', signatureController.getSignaturesByStage);

// Get signature image
router.get('/:id/image', signatureController.getSignatureImage);

// Get all signatures for a document
router.get('/document/:docId', signatureController.getSignaturesByDocument);

module.exports = router;
