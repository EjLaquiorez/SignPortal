const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../utils/fileHandler');

// All routes require authentication
router.use(authenticateToken);

// Upload attachment for a document
router.post('/documents/:id/attachments', upload.single('file'), attachmentController.uploadAttachment);

// List attachments for a document
router.get('/documents/:id/attachments', attachmentController.listAttachments);

// Download attachment
router.get('/attachments/:id/download', attachmentController.downloadAttachment);

// Delete attachment
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;
