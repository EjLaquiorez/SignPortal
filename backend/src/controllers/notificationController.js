const { query, queryOne, execute } = require('../utils/dbHelper');

// Create a notification
const createNotification = async (userId, documentId, workflowStageId, type, message) => {
  try {
    const result = await execute(
      'INSERT INTO notifications (user_id, document_id, workflow_stage_id, type, message) VALUES (?, ?, ?, ?, ?)',
      [userId, documentId, workflowStageId, type, message]
    );
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, limit } = req.query;

    // Check if notifications table exists
    const tableCheck = await queryOne(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'"
    );

    if (tableCheck.rows.length === 0) {
      // Table doesn't exist yet - return empty array
      return res.json({ notifications: [] });
    }

    let sql = `
      SELECT n.*, 
             d.document_title, d.original_filename, d.purpose, d.case_reference_number,
             ws.stage_name,
             u.name as document_uploaded_by_name
      FROM notifications n
      LEFT JOIN documents d ON n.document_id = d.id
      LEFT JOIN workflow_stages ws ON n.workflow_stage_id = ws.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (unread_only === 'true') {
      sql += ` AND n.is_read = 0`;
    }

    sql += ` ORDER BY n.created_at DESC`;

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const result = await query(sql, params);

    res.json({
      notifications: result.rows.map(notif => ({
        ...notif,
        is_read: notif.is_read === 1
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    // Return empty array instead of error to prevent frontend crashes
    res.json({ notifications: [] });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if notifications table exists
    const tableCheck = await queryOne(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'"
    );

    if (tableCheck.rows.length === 0) {
      // Table doesn't exist yet - return 0 count
      return res.json({ unread_count: 0 });
    }

    const result = await queryOne(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ 
      unread_count: result.rows[0]?.count || 0 
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    // Return 0 instead of error to prevent frontend crashes
    res.json({ unread_count: 0 });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notifResult = await queryOne('SELECT user_id FROM notifications WHERE id = ?', [id]);
    if (notifResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notifResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notifResult = await queryOne('SELECT user_id FROM notifications WHERE id = ?', [id]);
    if (notifResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notifResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await execute('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
