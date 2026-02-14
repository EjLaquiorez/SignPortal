const { query, queryOne, execute } = require('./dbHelper');
const { createNotification } = require('../controllers/notificationController');

// Check for overdue documents and stages
const checkOverdueDocuments = async () => {
  try {
    const now = new Date().toISOString();

    // Find overdue documents
    const overdueDocs = await query(
      `SELECT id, document_title, case_reference_number, deadline, priority, uploaded_by, office_unit
       FROM documents
       WHERE deadline IS NOT NULL 
         AND deadline < ?
         AND status NOT IN ('completed', 'rejected')`,
      [now]
    );

    // Find overdue workflow stages
    const overdueStages = await query(
      `SELECT ws.id, ws.document_id, ws.stage_name, ws.deadline, ws.assigned_to, ws.status,
              d.document_title, d.case_reference_number, d.priority
       FROM workflow_stages ws
       JOIN documents d ON ws.document_id = d.id
       WHERE ws.deadline IS NOT NULL
         AND ws.deadline < ?
         AND ws.status NOT IN ('completed', 'rejected')
         AND d.status NOT IN ('completed', 'rejected')`,
      [now]
    );

    // Process overdue documents
    for (const doc of overdueDocs.rows) {
      // Update priority if not already urgent
      if (doc.priority !== 'Emergency' && doc.priority !== 'Urgent') {
        await execute(
          'UPDATE documents SET priority = ?, is_urgent = 1 WHERE id = ?',
          ['Urgent', doc.id]
        );
      }

      // Notify document uploader
      if (doc.uploaded_by) {
        await createNotification(
          doc.uploaded_by,
          doc.id,
          null,
          'document_overdue',
          `Document "${doc.document_title}" (Case: ${doc.case_reference_number || 'N/A'}) is overdue. Deadline: ${new Date(doc.deadline).toLocaleDateString()}`
        );
      }
    }

    // Process overdue stages
    for (const stage of overdueStages.rows) {
      // Notify assigned user
      if (stage.assigned_to) {
        await createNotification(
          stage.assigned_to,
          stage.document_id,
          stage.id,
          'stage_overdue',
          `Stage "${stage.stage_name}" for document "${stage.document_title}" is overdue. Deadline: ${new Date(stage.deadline).toLocaleDateString()}`
        );
      }

      // Auto-escalate if deadline passed by more than 1 day
      const deadlineDate = new Date(stage.deadline);
      const daysOverdue = Math.floor((new Date() - deadlineDate) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue >= 1) {
        // Find next stage in workflow
        const allStages = await query(
          'SELECT id, stage_order, assigned_to FROM workflow_stages WHERE document_id = ? ORDER BY stage_order',
          [stage.document_id]
        );

        const currentStageIndex = allStages.rows.findIndex(s => s.id === stage.id);
        if (currentStageIndex < allStages.rows.length - 1) {
          const nextStage = allStages.rows[currentStageIndex + 1];
          
          // If next stage exists and is pending, escalate
          if (nextStage && nextStage.status === 'pending') {
            // Mark current stage as escalated
            await execute(
              'UPDATE workflow_stages SET comments = ? WHERE id = ?',
              [`Auto-escalated due to overdue deadline (${daysOverdue} days overdue)`, stage.id]
            );

            // Notify next stage assignee
            if (nextStage.assigned_to) {
              await createNotification(
                nextStage.assigned_to,
                stage.document_id,
                nextStage.id,
                'stage_escalated',
                `Stage "${nextStage.stage_name}" has been escalated due to overdue previous stage. Document: "${stage.document_title}"`
              );
            }
          }
        }
      }
    }

    return {
      overdueDocuments: overdueDocs.rows.length,
      overdueStages: overdueStages.rows.length
    };
  } catch (error) {
    console.error('Check overdue documents error:', error);
    throw error;
  }
};

// Get overdue documents for a user
const getUserOverdueDocuments = async (userId) => {
  try {
    const now = new Date().toISOString();

    const result = await query(
      `SELECT d.id, d.document_title, d.case_reference_number, d.deadline, d.priority,
              ws.id as stage_id, ws.stage_name, ws.deadline as stage_deadline
       FROM documents d
       LEFT JOIN workflow_stages ws ON d.id = ws.document_id AND ws.assigned_to = ?
       WHERE (d.deadline < ? OR ws.deadline < ?)
         AND d.status NOT IN ('completed', 'rejected')
         AND (ws.status IS NULL OR ws.status NOT IN ('completed', 'rejected'))
       ORDER BY COALESCE(ws.deadline, d.deadline) ASC`,
      [userId, now, now]
    );

    return result.rows;
  } catch (error) {
    console.error('Get user overdue documents error:', error);
    throw error;
  }
};

// Calculate deadline for a stage based on document priority
const calculateStageDeadline = (documentDeadline, stageOrder, totalStages, priority) => {
  if (!documentDeadline) return null;

  const deadlineDate = new Date(documentDeadline);
  const daysPerStage = {
    'Emergency': 1,
    'Priority': 2,
    'Urgent': 3,
    'Routine': 5
  };
  const daysForStage = daysPerStage[priority] || 5;

  // Distribute deadline across stages
  const daysFromStart = (totalStages - stageOrder) * daysForStage;
  deadlineDate.setDate(deadlineDate.getDate() - daysFromStart);

  return deadlineDate.toISOString();
};

module.exports = {
  checkOverdueDocuments,
  getUserOverdueDocuments,
  calculateStageDeadline
};
