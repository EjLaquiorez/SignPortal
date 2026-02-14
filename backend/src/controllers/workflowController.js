const { query, queryOne, execute } = require('../utils/dbHelper');

// Create default workflow stages for a document
const createDefaultWorkflow = async (documentId) => {
  try {
    // Default workflow: Personnel Sign → Authority Confirm
    const stages = [
      {
        stage_name: 'Personnel Sign',
        stage_order: 1,
        required_role: 'personnel',
        status: 'pending'
      },
      {
        stage_name: 'Authority Confirm',
        stage_order: 2,
        required_role: 'authority',
        status: 'pending'
      }
    ];

    const createdStages = [];
    for (const stage of stages) {
      const result = await execute(
        `INSERT INTO workflow_stages (document_id, stage_name, stage_order, required_role, status)
         VALUES (?, ?, ?, ?, ?)`,
        [documentId, stage.stage_name, stage.stage_order, stage.required_role, stage.status]
      );

      // Get the created stage
      const stageResult = await queryOne(
        'SELECT id, document_id, stage_name, stage_order, required_role, status, assigned_to, completed_at, created_at FROM workflow_stages WHERE id = ?',
        [result.lastInsertRowid]
      );
      createdStages.push(stageResult.rows[0]);
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
    const docResult = await queryOne('SELECT uploaded_by FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    if (userRole === 'personnel' && docResult.rows[0].uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
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
    const { status } = req.body;
    const userId = req.user.id;

    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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

    // Update status
    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    await execute(
      `UPDATE workflow_stages 
       SET status = ?, completed_at = ?
       WHERE id = ?`,
      [status, completedAt, id]
    );

    // Get updated stage
    const updateResult = await queryOne('SELECT * FROM workflow_stages WHERE id = ?', [id]);

    // Update document status if all stages are completed
    if (status === 'completed') {
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
        'stage_status_updated',
        `Stage "${stage.stage_name}" status updated to ${status}`
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
             u.name as uploaded_by_name,
             (SELECT COUNT(*) FROM signatures s WHERE s.workflow_stage_id = ws.id) as signature_count
      FROM workflow_stages ws
      JOIN documents d ON ws.document_id = d.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE ws.required_role = ?
        AND (ws.assigned_to = ? OR ws.assigned_to IS NULL)
        AND ws.status IN ('pending', 'in_progress')
      ORDER BY ws.created_at DESC`,
      [userRole, userId]
    );

    res.json({ pendingApprovals: result.rows });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
};

module.exports = {
  createDefaultWorkflow,
  getWorkflowByDocument,
  assignStage,
  updateStageStatus,
  getPendingApprovals
};
