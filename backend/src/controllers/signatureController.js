const { query, queryOne, execute } = require('../utils/dbHelper');
const multer = require('multer');

// Configure multer for signature image uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for signature images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for signatures'));
    }
  }
}).single('file');

const createSignature = async (req, res) => {
  try {
    const { workflowStageId } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!workflowStageId) {
      return res.status(400).json({ error: 'Workflow stage ID is required' });
    }

    // Get workflow stage details
    const stageResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [workflowStageId]);

    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow stage not found' });
    }

    const stage = stageResult.rows[0];

    // Verify user is assigned to this stage or has correct role
    if (stage.assigned_to !== userId && req.user.role !== 'admin') {
      // Check if user has the required role for this stage
      if (req.user.role !== stage.required_role) {
        return res.status(403).json({ error: 'You are not authorized to sign this stage' });
      }
    }

    // Get signature data - either from canvas (base64) or uploaded file
    let signatureData;
    let signatureType = 'canvas';

    if (req.body.signatureData) {
      // Canvas signature (base64 image)
      try {
        const base64Data = req.body.signatureData.replace(/^data:image\/\w+;base64,/, '');
        signatureData = Buffer.from(base64Data, 'base64');
        if (!signatureData || signatureData.length === 0) {
          return res.status(400).json({ error: 'Invalid signature data format' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Failed to process signature data' });
      }
    } else if (req.file) {
      // Uploaded signature image
      signatureData = req.file.buffer;
      signatureType = 'upload';
    } else {
      return res.status(400).json({ error: 'Signature data is required (either signatureData or file)' });
    }

    if (!signatureData || signatureData.length === 0) {
      return res.status(400).json({ error: 'Invalid signature data' });
    }

    // Validate signature size (max 5MB)
    if (signatureData.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Signature image is too large (max 5MB)' });
    }

    // Check if user already signed this stage
    const existingSignature = await queryOne(
      'SELECT id FROM signatures WHERE workflow_stage_id = ? AND user_id = ?',
      [workflowStageId, userId]
    );

    if (existingSignature.rows.length > 0) {
      return res.status(400).json({ error: 'You have already signed this stage' });
    }

    // Insert signature
    const result = await execute(
      `INSERT INTO signatures (workflow_stage_id, user_id, signature_data, signature_type, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [workflowStageId, userId, signatureData, signatureType, ipAddress]
    );

    // Get the created signature
    const signatureResult = await queryOne(
      'SELECT id, workflow_stage_id, user_id, signature_type, signed_at FROM signatures WHERE id = ?',
      [result.lastInsertRowid]
    );
    const signature = signatureResult.rows[0];

    // Update stage status to completed if this is the assigned user
    if (stage.assigned_to === userId) {
      await execute(
        'UPDATE workflow_stages SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', workflowStageId]
      );

      // Check if all stages are completed
      const allStagesResult = await query(
        'SELECT status FROM workflow_stages WHERE document_id = ?',
        [stage.document_id]
      );

      const allCompleted = allStagesResult.rows.every(s => s.status === 'completed');
      if (allCompleted) {
        await execute(
          'UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['completed', stage.document_id]
        );
      } else {
        await execute(
          'UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['in_progress', stage.document_id]
        );
      }
    }

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [
        stage.document_id,
        userId,
        'signed',
        `Signed stage: ${stage.stage_name}`
      ]
    );

    res.status(201).json({
      message: 'Signature created successfully',
      signature: {
        id: signature.id,
        workflow_stage_id: signature.workflow_stage_id,
        user_id: signature.user_id,
        signature_type: signature.signature_type,
        signed_at: signature.signed_at
      }
    });
  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({ error: 'Failed to create signature' });
  }
};

const getSignaturesByStage = async (req, res) => {
  try {
    const { stageId } = req.params;

    const result = await query(
      `SELECT s.id, s.workflow_stage_id, s.user_id, s.signature_type, s.signed_at, s.ip_address,
              u.name as user_name, u.email as user_email, u.role as user_role
       FROM signatures s
       JOIN users u ON s.user_id = u.id
       WHERE s.workflow_stage_id = ?
       ORDER BY s.signed_at DESC`,
      [stageId]
    );

    res.json({ signatures: result.rows });
  } catch (error) {
    console.error('Get signatures by stage error:', error);
    res.status(500).json({ error: 'Failed to fetch signatures' });
  }
};

const getSignatureImage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await queryOne('SELECT signature_data, signature_type FROM signatures WHERE id = ?', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signature not found' });
    }

    const signature = result.rows[0];

    // Determine content type
    const contentType = signature.signature_type === 'upload' 
      ? 'image/png' 
      : 'image/png'; // Canvas signatures are PNG

    res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(signature.signature_data));
  } catch (error) {
    console.error('Get signature image error:', error);
    res.status(500).json({ error: 'Failed to fetch signature image' });
  }
};

const getSignaturesByDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT uploaded_by FROM documents WHERE id = ?', [docId]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    if (userRole === 'personnel' && docResult.rows[0].uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all signatures for this document
    const result = await query(
      `SELECT s.id, s.workflow_stage_id, s.user_id, s.signature_type, s.signed_at, s.ip_address,
              u.name as user_name, u.email as user_email, u.role as user_role,
              ws.stage_name, ws.stage_order
       FROM signatures s
       JOIN users u ON s.user_id = u.id
       JOIN workflow_stages ws ON s.workflow_stage_id = ws.id
       WHERE ws.document_id = ?
       ORDER BY ws.stage_order ASC, s.signed_at DESC`,
      [docId]
    );

    res.json({ signatures: result.rows });
  } catch (error) {
    console.error('Get signatures by document error:', error);
    res.status(500).json({ error: 'Failed to fetch signatures' });
  }
};

module.exports = {
  createSignature,
  getSignaturesByStage,
  getSignatureImage,
  getSignaturesByDocument,
  upload // Export multer middleware for use in routes
};
