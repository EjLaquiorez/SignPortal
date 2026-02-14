const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const authenticateToken = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get workflow for a document
router.get('/document/:id', workflowController.getWorkflowByDocument);

// Get pending approvals for current user
router.get('/pending', workflowController.getPendingApprovals);

// Assign stage to user
router.post('/stage/:id/assign', workflowController.assignStage);

// Update stage status
router.put('/stage/:id/status', workflowController.updateStageStatus);

module.exports = router;
