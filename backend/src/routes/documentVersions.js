const express = require('express');
const router = express.Router();
const documentVersionController = require('../controllers/documentVersionController');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../utils/fileHandler');

// All routes require authentication
router.use(authenticateToken);

// Upload new signed version
router.post('/:id/versions', upload.single('file'), documentVersionController.uploadSignedVersion);

// List all versions of a document
router.get('/:id/versions', documentVersionController.listVersions);

// Get current version
router.get('/:id/versions/current', documentVersionController.getCurrentVersion);

// Get specific version
router.get('/:id/versions/:versionId', documentVersionController.getVersion);

// Download specific version
router.get('/:id/versions/:versionId/download', documentVersionController.downloadVersion);

module.exports = router;
