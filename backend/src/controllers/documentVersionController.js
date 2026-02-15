const { query, queryOne, execute } = require('../utils/dbHelper');
const { createNotification } = require('./notificationController');
const { checkDocumentAccess } = require('../utils/documentAccess');

// Upload a new signed version of a document for a workflow stage
const uploadSignedVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id } = req.params; // document_id
    const { workflow_stage_id, upload_reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!workflow_stage_id) {
      return res.status(400).json({ error: 'Workflow stage ID is required' });
    }

    // Validate file size (50MB limit)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT id, uploaded_by, current_version_number FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Check document access using strict access control
    const accessCheck = await checkDocumentAccess(userId, userRole, parseInt(id));
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to upload versions for this document' 
      });
    }

    // Verify workflow stage exists and is valid
    const stageResult = await queryOne(
      'SELECT * FROM workflow_stages WHERE id = ? AND document_id = ?',
      [workflow_stage_id, id]
    );

    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow stage not found' });
    }

    const stage = stageResult.rows[0];

    // Verify stage is in a valid state for upload
    if (!['pending', 'in_progress'].includes(stage.status)) {
      return res.status(400).json({ 
        error: `Cannot upload version for stage with status: ${stage.status}` 
      });
    }

    // Check if user is assigned to this stage or has admin role
    // Authority users must be assigned to the stage to upload
    if (stage.assigned_to !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'You are not assigned to this stage' });
    }

    // Get next version number
    const nextVersionNumber = (document.current_version_number || 0) + 1;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `doc_${id}_v${nextVersionNumber}_${timestamp}`;

    // Insert document version
    const result = await execute(
      `INSERT INTO document_versions 
       (document_id, workflow_stage_id, version_number, filename, original_filename, file_data, file_type, file_size, uploaded_by, upload_reason, is_signed_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        workflow_stage_id,
        nextVersionNumber,
        filename,
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        req.file.size,
        userId,
        upload_reason || null,
        1 // is_signed_version = true
      ]
    );

    // Update document's current version number
    await execute(
      'UPDATE documents SET current_version_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nextVersionNumber, id]
    );

    // Mark stage as having signed version uploaded and complete it
    await execute(
      'UPDATE workflow_stages SET signed_version_uploaded = 1, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', workflow_stage_id]
    );

    // Get the created version
    const versionResult = await queryOne(
      `SELECT dv.*, u.name as uploaded_by_name, u.rank as uploaded_by_rank,
              ws.stage_name, ws.stage_order
       FROM document_versions dv
       LEFT JOIN users u ON dv.uploaded_by = u.id
       LEFT JOIN workflow_stages ws ON dv.workflow_stage_id = ws.id
       WHERE dv.id = ?`,
      [result.lastInsertRowid]
    );

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [
        id,
        userId,
        'version_uploaded',
        `Uploaded signed version ${nextVersionNumber} for stage "${stage.stage_name}". ${upload_reason || ''}`
      ]
    );

    // Check if all stages are completed
    const allStagesResult = await query(
      'SELECT id, status, stage_order, stage_name, assigned_to FROM workflow_stages WHERE document_id = ? ORDER BY stage_order ASC',
      [id]
    );

    const allCompleted = allStagesResult.rows.every(s => s.status === 'completed');
    
    if (allCompleted) {
      // Mark document as completed
      await execute(
        'UPDATE documents SET status = ?, current_stage_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', 'Final Approval Completed', id]
      );

      // Notify document uploader
      const docResult = await queryOne('SELECT uploaded_by, document_title, tracking_number FROM documents WHERE id = ?', [id]);
      if (docResult.rows[0]?.uploaded_by) {
        await createNotification(
          docResult.rows[0].uploaded_by,
          id,
          null,
          'document_completed',
          `Document "${docResult.rows[0].document_title}" (${docResult.rows[0].tracking_number}) has been fully approved and completed.`
        );
      }
    } else {
      // Find next stage
      const currentStageOrder = stage.stage_order;
      const nextStage = allStagesResult.rows.find(s => s.stage_order > currentStageOrder && s.status === 'pending');
      
      // Update document status and current stage name
      if (nextStage) {
        await execute(
          'UPDATE documents SET status = ?, current_stage_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['in_progress', `Pending ${nextStage.stage_name}`, id]
        );
        
        if (nextStage.assigned_to) {
          const docResult = await queryOne('SELECT document_title, case_reference_number, tracking_number FROM documents WHERE id = ?', [id]);
          const doc = docResult.rows[0];
          await createNotification(
            nextStage.assigned_to,
            id,
            nextStage.id,
            'stage_ready',
            `Document "${doc.document_title}" (${doc.tracking_number}) - Stage "${nextStage.stage_name}" is ready for your review.`
          );
        }
      } else {
        // No next stage found, keep current status
        await execute(
          'UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['in_progress', id]
        );
      }
    }

    res.status(201).json({
      message: 'Signed version uploaded successfully',
      version: versionResult.rows[0]
    });
  } catch (error) {
    console.error('Upload signed version error:', error);
    res.status(500).json({ error: 'Failed to upload signed version' });
  }
};

// List all versions of a document
const listVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT uploaded_by FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    if (userRole === 'personnel' && docResult.rows[0].uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT dv.*, u.name as uploaded_by_name, u.rank as uploaded_by_rank, u.designation as uploaded_by_designation,
              ws.stage_name, ws.stage_order, ws.status as stage_status
       FROM document_versions dv
       LEFT JOIN users u ON dv.uploaded_by = u.id
       LEFT JOIN workflow_stages ws ON dv.workflow_stage_id = ws.id
       WHERE dv.document_id = ?
       ORDER BY dv.version_number DESC`,
      [id]
    );

    res.json({
      versions: result.rows.map(v => ({
        ...v,
        is_signed_version: v.is_signed_version === 1,
        file_size: parseInt(v.file_size)
      }))
    });
  } catch (error) {
    console.error('List versions error:', error);
    res.status(500).json({ error: 'Failed to fetch document versions' });
  }
};

// Get specific version details
const getVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT id FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check document access using strict access control
    const accessCheck = await checkDocumentAccess(userId, userRole, parseInt(id));
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to view this document version' 
      });
    }

    const result = await queryOne(
      `SELECT dv.*, u.name as uploaded_by_name, u.rank as uploaded_by_rank, u.designation as uploaded_by_designation,
              ws.stage_name, ws.stage_order, ws.status as stage_status
       FROM document_versions dv
       LEFT JOIN users u ON dv.uploaded_by = u.id
       LEFT JOIN workflow_stages ws ON dv.workflow_stage_id = ws.id
       WHERE dv.id = ? AND dv.document_id = ?`,
      [versionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const version = result.rows[0];
    res.json({
      version: {
        ...version,
        is_signed_version: version.is_signed_version === 1,
        file_size: parseInt(version.file_size)
      }
    });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ error: 'Failed to fetch version' });
  }
};

// Download a specific version
const downloadVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT id FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check document access using strict access control
    const accessCheck = await checkDocumentAccess(userId, userRole, parseInt(id));
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to download this document version' 
      });
    }

    const result = await queryOne(
      'SELECT * FROM document_versions WHERE id = ? AND document_id = ?',
      [versionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const version = result.rows[0];

    // Set headers for file download
    res.setHeader('Content-Type', version.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${version.original_filename}"`);
    res.setHeader('Content-Length', version.file_size);

    // Send file data
    res.send(Buffer.from(version.file_data));
  } catch (error) {
    console.error('Download version error:', error);
    res.status(500).json({ error: 'Failed to download version' });
  }
};

// Get current version of a document
const getCurrentVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT id, current_version_number FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check document access using strict access control
    const accessCheck = await checkDocumentAccess(userId, userRole, parseInt(id));
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to view the current version of this document' 
      });
    }

    const currentVersionNumber = docResult.rows[0].current_version_number || 1;

    // Try to get version from document_versions table
    let result = { rows: [] };
    try {
      // Check if document_versions table exists by trying a simple query
      const tableCheck = await query('SELECT name FROM sqlite_master WHERE type="table" AND name="document_versions"');
      if (tableCheck.rows.length > 0) {
        result = await queryOne(
          `SELECT dv.*, u.name as uploaded_by_name, u.rank as uploaded_by_rank, u.designation as uploaded_by_designation,
                  ws.stage_name, ws.stage_order, ws.status as stage_status
           FROM document_versions dv
           LEFT JOIN users u ON dv.uploaded_by = u.id
           LEFT JOIN workflow_stages ws ON dv.workflow_stage_id = ws.id
           WHERE dv.document_id = ? AND dv.version_number = ?`,
          [id, currentVersionNumber]
        );
      }
    } catch (err) {
      // If document_versions table doesn't exist or query fails, fall back to original document
      console.log('Note: document_versions query failed, using original document:', err.message);
      result = { rows: [] };
    }

    // If no version found, return original document info
    if (!result || result.rows.length === 0) {
      const docResult2 = await queryOne(
        'SELECT id, filename, original_filename, file_type, file_size, created_at FROM documents WHERE id = ?',
        [id]
      );
      if (docResult2.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }
      return res.json({
        version: {
          ...docResult2.rows[0],
          version_number: 1,
          is_signed_version: false,
          is_original: true,
          file_size: parseInt(docResult2.rows[0].file_size || 0)
        }
      });
    }

    const version = result.rows[0];
    res.json({
      version: {
        ...version,
        is_signed_version: version.is_signed_version === 1,
        file_size: parseInt(version.file_size || 0)
      }
    });
  } catch (error) {
    console.error('Get current version error:', error);
    res.status(500).json({ error: 'Failed to fetch current version', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  uploadSignedVersion,
  listVersions,
  getVersion,
  downloadVersion,
  getCurrentVersion
};
