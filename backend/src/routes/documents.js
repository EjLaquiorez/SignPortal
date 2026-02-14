const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../utils/fileHandler');

// All routes require authentication
router.use(authenticateToken);

// Upload document
router.post('/', upload.single('file'), documentController.uploadDocument);

// List documents
router.get('/', documentController.listDocuments);

// Get document details
router.get('/:id', documentController.getDocument);

// Download document
router.get('/:id/download', documentController.downloadDocument);

// Delete document
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
