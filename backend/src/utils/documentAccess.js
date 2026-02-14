const { query, queryOne } = require('./dbHelper');

/**
 * Check if a user has access to a document
 * 
 * Access Rules:
 * - Admin: Full access to all documents
 * - Personnel: Only documents they uploaded
 * - Authority: Documents where they are assigned to any workflow stage
 * 
 * @param {number} userId - The user ID to check
 * @param {string} userRole - The user's role (admin, personnel, authority)
 * @param {number} documentId - The document ID to check access for
 * @returns {Promise<{hasAccess: boolean, reason: string}>}
 */
const checkDocumentAccess = async (userId, userRole, documentId) => {
  try {
    // Admin has full access
    if (userRole === 'admin') {
      return { hasAccess: true, reason: 'admin_access' };
    }

    // Get document owner
    const docResult = await queryOne(
      'SELECT uploaded_by FROM documents WHERE id = ?',
      [documentId]
    );

    if (docResult.rows.length === 0) {
      return { hasAccess: false, reason: 'document_not_found' };
    }

    const document = docResult.rows[0];

    // Personnel can only see their own documents
    if (userRole === 'personnel') {
      if (document.uploaded_by === userId) {
        return { hasAccess: true, reason: 'document_owner' };
      }
      return { hasAccess: false, reason: 'not_authorized_personnel' };
    }

    // Authority users: Check if assigned to any workflow stage
    if (userRole === 'authority') {
      // Check if user is assigned to any workflow stage for this document
      const stageResult = await query(
        `SELECT id, stage_name, status, assigned_to 
         FROM workflow_stages 
         WHERE document_id = ? AND assigned_to = ?`,
        [documentId, userId]
      );

      if (stageResult.rows.length > 0) {
        return { hasAccess: true, reason: 'workflow_assigned' };
      }

      // Also check if document owner (in case they uploaded and are also authority)
      if (document.uploaded_by === userId) {
        return { hasAccess: true, reason: 'document_owner' };
      }

      return { hasAccess: false, reason: 'not_assigned_to_workflow' };
    }

    return { hasAccess: false, reason: 'unknown_role' };
  } catch (error) {
    console.error('Document access check error:', error);
    return { hasAccess: false, reason: 'access_check_failed' };
  }
};

/**
 * Get list of document IDs that a user has access to
 * 
 * @param {number} userId - The user ID
 * @param {string} userRole - The user's role
 * @returns {Promise<number[]>} Array of document IDs
 */
const getAccessibleDocumentIds = async (userId, userRole) => {
  try {
    // Admin can access all documents
    if (userRole === 'admin') {
      const result = await query('SELECT id FROM documents');
      return result.rows.map(row => row.id);
    }

    // Personnel can only see their own documents
    if (userRole === 'personnel') {
      const result = await query(
        'SELECT id FROM documents WHERE uploaded_by = ?',
        [userId]
      );
      return result.rows.map(row => row.id);
    }

    // Authority: Documents where assigned to workflow stages OR documents they uploaded
    if (userRole === 'authority') {
      const result = await query(
        `SELECT DISTINCT d.id 
         FROM documents d
         LEFT JOIN workflow_stages ws ON d.id = ws.document_id
         WHERE d.uploaded_by = ? OR ws.assigned_to = ?`,
        [userId, userId]
      );
      return result.rows.map(row => row.id);
    }

    return [];
  } catch (error) {
    console.error('Get accessible document IDs error:', error);
    return [];
  }
};

/**
 * Build SQL WHERE clause for document access filtering
 * 
 * @param {number} userId - The user ID
 * @param {string} userRole - The user's role
 * @returns {Promise<{sql: string, params: any[]}>}
 */
const buildAccessFilter = async (userId, userRole) => {
  try {
    // Admin: No filter (can see all)
    if (userRole === 'admin') {
      return { sql: '', params: [] };
    }

    // Personnel: Only their own documents
    if (userRole === 'personnel') {
      return { 
        sql: 'AND d.uploaded_by = ?', 
        params: [userId] 
      };
    }

    // Authority: Documents where assigned to workflow OR documents they uploaded
    if (userRole === 'authority') {
      return {
        sql: `AND (d.uploaded_by = ? OR EXISTS (
          SELECT 1 FROM workflow_stages ws 
          WHERE ws.document_id = d.id AND ws.assigned_to = ?
        ))`,
        params: [userId, userId]
      };
    }

    // Default: No access
    return { sql: 'AND 1=0', params: [] };
  } catch (error) {
    console.error('Build access filter error:', error);
    return { sql: 'AND 1=0', params: [] };
  }
};

module.exports = {
  checkDocumentAccess,
  getAccessibleDocumentIds,
  buildAccessFilter
};
