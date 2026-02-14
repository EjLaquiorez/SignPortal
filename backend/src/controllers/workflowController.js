const { query, queryOne, execute } = require('../utils/dbHelper');
const { getWorkflowTemplate } = require('../config/workflowTemplates');
const { getApprovalChain } = require('../config/unitHierarchy');
const { createNotification } = require('./notificationController');
const { checkDocumentAccess } = require('../utils/documentAccess');

// Create workflow stages for a document based on purpose
const createDefaultWorkflow = async (documentId, purpose = null, officeUnit = null) => {
  try {
    // Get workflow template based on purpose
    const stages = getWorkflowTemplate(purpose || 'default');
    
    // Calculate deadlines for each stage (if document has deadline)
    const docResult = await queryOne('SELECT deadline, priority FROM documents WHERE id = ?', [documentId]);
    const documentDeadline = docResult.rows[0]?.deadline;
    const priority = docResult.rows[0]?.priority || 'Routine';
    
    // Calculate days per stage based on priority
    const daysPerStage = {
      'Emergency': 1,
      'Priority': 2,
      'Urgent': 3,
      'Routine': 5
    };
    const daysForStage = daysPerStage[priority] || 5;

    const createdStages = [];
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      // Calculate stage deadline if document has deadline
      let stageDeadline = null;
      if (documentDeadline) {
        const deadlineDate = new Date(documentDeadline);
        // Distribute deadline across stages
        const daysFromStart = (i + 1) * daysForStage;
        deadlineDate.setDate(deadlineDate.getDate() - (stages.length - i - 1) * daysForStage);
        stageDeadline = deadlineDate.toISOString();
      }

      const requiresSignedUpload = stage.requires_signed_upload ? 1 : 0;

      const result = await execute(
        `INSERT INTO workflow_stages (document_id, stage_name, stage_order, required_role, status, deadline, requires_signed_upload)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [documentId, stage.stage_name, stage.stage_order, stage.required_role, 'pending', stageDeadline, requiresSignedUpload]
      );

      // Get the created stage
      const stageResult = await queryOne(
        'SELECT id, document_id, stage_name, stage_order, required_role, status, assigned_to, deadline, completed_at, created_at FROM workflow_stages WHERE id = ?',
        [result.lastInsertRowid]
      );
      createdStages.push(stageResult.rows[0]);
    }

    // Update document with first stage name
    if (createdStages.length > 0) {
      await execute(
        'UPDATE documents SET current_stage_name = ? WHERE id = ?',
        [`Pending ${createdStages[0].stage_name}`, documentId]
      );
    }

    // Create notification for first stage if assigned
    if (createdStages.length > 0 && createdStages[0].assigned_to) {
      const docResult = await queryOne('SELECT document_title, case_reference_number, tracking_number FROM documents WHERE id = ?', [documentId]);
      const doc = docResult.rows[0];
      const message = `New document "${doc.document_title}" (${doc.tracking_number || 'N/A'}) requires your review. Case: ${doc.case_reference_number || 'N/A'}`;
      await createNotification(
        createdStages[0].assigned_to,
        documentId,
        createdStages[0].id,
        'stage_assigned',
        message
      );
    }

    return createdStages;
  } catch (error) {
    console.error('Create workflow error:', error);
    throw error;
  }
};

const getWorkflowByDocument = async (req, res) => {
  try {
    const { id } = req.params;
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
        error: 'Access denied: You do not have permission to view this document workflow' 
      });
    }

    // Get workflow stages
    const stagesResult = await query(
      `SELECT ws.*, 
              u.name as assigned_to_name, u.email as assigned_to_email,
              (SELECT COUNT(*) FROM signatures s WHERE s.workflow_stage_id = ws.id) as signature_count
       FROM workflow_stages ws
       LEFT JOIN users u ON ws.assigned_to = u.id
       WHERE ws.document_id = ?
       ORDER BY ws.stage_order ASC`,
      [id]
    );

    // Get signatures for each stage
    const stages = await Promise.all(stagesResult.rows.map(async (stage) => {
      const signaturesResult = await query(
        `SELECT s.*, u.name as user_name, u.email as user_email
         FROM signatures s
         JOIN users u ON s.user_id = u.id
         WHERE s.workflow_stage_id = ?
         ORDER BY s.signed_at DESC`,
        [stage.id]
      );

      return {
        ...stage,
        signatures: signaturesResult.rows
      };
    }));

    res.json({ workflow: stages });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
};

const assignStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Get stage details
    const stageResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [id]);

    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow stage not found' });
    }

    const stage = stageResult.rows[0];

    // Only admin or authority can assign stages
    if (userRole !== 'admin' && userRole !== 'authority') {
      return res.status(403).json({ error: 'Insufficient permissions to assign stages' });
    }

    // Verify user exists and has correct role
    if (userId) {
      const userResult = await queryOne('SELECT role FROM users WHERE id = ?', [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (userResult.rows[0].role !== stage.required_role) {
        return res.status(400).json({ error: `User must have role: ${stage.required_role}` });
      }
    }

    // Update stage assignment (SQLite CASE syntax)
    const assignedTo = userId || null;
    const newStatus = assignedTo ? 'in_progress' : 'pending';
    
    await execute(
      `UPDATE workflow_stages 
       SET assigned_to = ?, status = ?
       WHERE id = ?`,
      [assignedTo, newStatus, id]
    );

    // Get updated stage
    const updateResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [id]);

    // Create notification if user assigned
    if (userId) {
      const docResult = await queryOne('SELECT document_title, case_reference_number FROM documents WHERE id = ?', [stage.document_id]);
      const doc = docResult.rows[0];
      const message = `Stage "${stage.stage_name}" has been assigned to you. Document: "${doc.document_title}"`;
      await createNotification(
        userId,
        stage.document_id,
        id,
        'stage_assigned',
        message
      );
    }

    // Log to history
    const docResult = await queryOne('SELECT id FROM documents WHERE id = ?', [stage.document_id]);
    if (docResult.rows.length > 0) {
      await execute(
        'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [
          stage.document_id,
          currentUserId,
          'stage_assigned',
          `Stage "${stage.stage_name}" assigned to user ${userId || 'unassigned'}`
        ]
      );
    }

    res.json({
      message: 'Stage assigned successfully',
      stage: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Assign stage error:', error);
    res.status(500).json({ error: 'Failed to assign stage' });
  }
};

const updateStageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, comment } = req.body;
    const userId = req.user.id;

    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Require rejection reason if rejecting
    if (status === 'rejected' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required when rejecting a stage' });
    }

    // Get stage details
    const stageResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [id]);

    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow stage not found' });
    }

    const stage = stageResult.rows[0];

    // Check if user is assigned to this stage or has admin role
    if (req.user.role !== 'admin' && stage.assigned_to !== userId) {
      return res.status(403).json({ error: 'You are not assigned to this stage' });
    }

    // For physical signature workflow, stages are auto-completed when signed version is uploaded
    // Manual completion is only allowed if signed version was already uploaded
    if (status === 'completed' && stage.requires_signed_upload === 1) {
      if (stage.signed_version_uploaded !== 1) {
        return res.status(400).json({ 
          error: 'Cannot complete stage: signed document version must be uploaded first. Please upload the signed version to automatically complete this stage.' 
        });
      }
    }

    // Update status with rejection reason if provided
    const completedAt = (status === 'completed' || status === 'rejected') ? new Date().toISOString() : null;
    
    await execute(
      `UPDATE workflow_stages 
       SET status = ?, completed_at = ?, rejection_reason = ?
       WHERE id = ?`,
      [status, completedAt, rejection_reason || null, id]
    );

    // Add comment if provided
    if (comment && comment.trim()) {
      await execute(
        'INSERT INTO workflow_comments (workflow_stage_id, user_id, comment) VALUES (?, ?, ?)',
        [id, userId, comment.trim()]
      );
    }

    // Get updated stage
    const updateResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [id]);

    // Update document status and create notifications
    if (status === 'completed') {
      const allStagesResult = await query(
        'SELECT id, status, stage_order, assigned_to, stage_name FROM workflow_stages WHERE document_id = ? ORDER BY stage_order',
        [stage.document_id]
      );

      const allCompleted = allStagesResult.rows.every(s => s.status === 'completed');
      if (allCompleted) {
        await execute(
          'UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['completed', stage.document_id]
        );

        // Notify document uploader
        const docResult = await queryOne('SELECT uploaded_by, document_title FROM documents WHERE id = ?', [stage.document_id]);
        if (docResult.rows[0]?.uploaded_by) {
          await createNotification(
            docResult.rows[0].uploaded_by,
            stage.document_id,
            null,
            'document_completed',
            `Document "${docResult.rows[0].document_title}" has been fully approved and completed.`
          );
        }
      } else {
        await execute(
          'UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['in_progress', stage.document_id]
        );

        // Notify next stage assignee
        const currentStageOrder = stage.stage_order;
        const nextStage = allStagesResult.rows.find(s => s.stage_order > currentStageOrder && s.status === 'pending');
        if (nextStage && nextStage.assigned_to) {
          const docResult = await queryOne('SELECT document_title, case_reference_number FROM documents WHERE id = ?', [stage.document_id]);
          const doc = docResult.rows[0];
          await createNotification(
            nextStage.assigned_to,
            stage.document_id,
            nextStage.id,
            'stage_ready',
            `Stage "${nextStage.stage_name}" is ready for your review. Document: "${doc.document_title}"`
          );
        }
      }
    } else if (status === 'rejected') {
      // If rejected, mark document as rejected
      await execute(
        'UPDATE documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['rejected', stage.document_id]
      );

      // Notify document uploader
      const docResult = await queryOne('SELECT uploaded_by, document_title FROM documents WHERE id = ?', [stage.document_id]);
      if (docResult.rows[0]?.uploaded_by) {
        await createNotification(
          docResult.rows[0].uploaded_by,
          stage.document_id,
          id,
          'document_rejected',
          `Document "${docResult.rows[0].document_title}" has been rejected. Reason: ${rejection_reason || 'No reason provided'}`
        );
      }
    }

    // Log to history
    const historyDetails = rejection_reason 
      ? `Stage "${stage.stage_name}" ${status}. Reason: ${rejection_reason}`
      : `Stage "${stage.stage_name}" status updated to ${status}`;
    
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [
        stage.document_id,
        userId,
        'stage_status_updated',
        historyDetails
      ]
    );

    res.json({
      message: 'Stage status updated successfully',
      stage: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update stage status error:', error);
    res.status(500).json({ error: 'Failed to update stage status' });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await query(
      `SELECT ws.*, 
             d.id as document_id, d.original_filename, d.file_type, d.created_at as document_created_at,
             d.document_title, d.purpose, d.office_unit, d.case_reference_number,
             d.classification_level, d.priority, d.deadline as document_deadline, d.is_urgent,
             d.tracking_number, d.current_stage_name,
             u.name as uploaded_by_name, u.rank as uploaded_by_rank,
             (SELECT COUNT(*) FROM signatures s WHERE s.workflow_stage_id = ws.id) as signature_count,
             ws.requires_signed_upload, ws.signed_version_uploaded
      FROM workflow_stages ws
      JOIN documents d ON ws.document_id = d.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE ws.required_role = ?
        AND (ws.assigned_to = ? OR ws.assigned_to IS NULL)
        AND ws.status IN ('pending', 'in_progress')
      ORDER BY 
        CASE d.priority 
          WHEN 'Emergency' THEN 1 
          WHEN 'Priority' THEN 2 
          WHEN 'Urgent' THEN 3 
          WHEN 'Routine' THEN 4 
          ELSE 5 
        END ASC,
        d.deadline ASC NULLS LAST,
        ws.created_at DESC`,
      [userRole, userId]
    );

    res.json({ 
      pendingApprovals: result.rows.map(row => ({
        ...row,
        is_urgent: row.is_urgent === 1
      }))
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
};

// Add comment to workflow stage
const addStageComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Verify stage exists
    const stageResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [id]);
    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow stage not found' });
    }

    const stage = stageResult.rows[0];

    // Insert comment
    const result = await execute(
      'INSERT INTO workflow_comments (workflow_stage_id, user_id, comment) VALUES (?, ?, ?)',
      [id, userId, comment.trim()]
    );

    // Get the created comment with user info
    const commentResult = await queryOne(
      `SELECT wc.*, u.name as user_name, u.email as user_email, u.rank as user_rank
       FROM workflow_comments wc
       LEFT JOIN users u ON wc.user_id = u.id
       WHERE wc.id = ?`,
      [result.lastInsertRowid]
    );

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [
        stage.document_id,
        userId,
        'stage_comment_added',
        `Comment added to stage "${stage.stage_name}"`
      ]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      comment: commentResult.rows[0]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get comments for a workflow stage
const getStageComments = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT wc.*, u.name as user_name, u.email as user_email, u.rank as user_rank, u.designation as user_designation
       FROM workflow_comments wc
       LEFT JOIN users u ON wc.user_id = u.id
       WHERE wc.workflow_stage_id = ?
       ORDER BY wc.created_at ASC`,
      [id]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

module.exports = {
  createDefaultWorkflow,
  getWorkflowByDocument,
  assignStage,
  updateStageStatus,
  getPendingApprovals,
  addStageComment,
  getStageComments
};
