const { query, queryOne, execute } = require('../utils/dbHelper');
const { detectFileType } = require('../utils/fileHandler');
const { createDefaultWorkflow } = require('./workflowController');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file size (50MB limit)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const userId = req.user.id;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${originalname}`;
    const fileType = detectFileType(originalname, mimetype);

    // Insert document into database
    const result = await execute(
      `INSERT INTO documents (filename, original_filename, file_data, file_type, file_size, uploaded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [filename, originalname, buffer, fileType, size, userId, 'pending']
    );

    const documentId = result.lastInsertRowid;

    // Get the created document
    const docResult = await queryOne(
      'SELECT id, filename, original_filename, file_type, file_size, uploaded_by, status, created_at FROM documents WHERE id = ?',
      [documentId]
    );
    const document = docResult.rows[0];

    // Create default workflow stages
    await createDefaultWorkflow(document.id);

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [document.id, userId, 'uploaded', `Document uploaded: ${originalname}`]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        filename: document.filename,
        original_filename: document.original_filename,
        file_type: document.file_type,
        file_size: document.file_size,
        status: document.status,
        uploaded_by: document.uploaded_by,
        created_at: document.created_at
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

const listDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, search } = req.query;

    let sql = `
      SELECT d.id, d.filename, d.original_filename, d.file_type, d.file_size, 
             d.status, d.created_at, d.updated_at,
             u.name as uploaded_by_name, u.email as uploaded_by_email
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by role - personnel can only see their own, authority/admin can see all
    if (userRole === 'personnel') {
      sql += ` AND d.uploaded_by = ?`;
      params.push(userId);
    }

    // Filter by status
    if (status) {
      sql += ` AND d.status = ?`;
      params.push(status);
    }

    // Search by filename (SQLite uses LIKE instead of ILIKE)
    if (search) {
      sql += ` AND d.original_filename LIKE ?`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY d.created_at DESC`;

    const result = await query(sql, params);

    res.json({
      documents: result.rows.map(doc => ({
        ...doc,
        file_size: parseInt(doc.file_size)
      }))
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await query(
      `SELECT d.id, d.filename, d.original_filename, d.file_type, d.file_size, 
              d.status, d.created_at, d.updated_at,
              u.name as uploaded_by_name, u.email as uploaded_by_email,
              d.uploaded_by
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];

    // Check permissions - personnel can only see their own
    if (userRole === 'personnel' && document.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      document: {
        ...document,
        file_size: parseInt(document.file_size)
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await queryOne(
      'SELECT d.*, u.id as uploaded_by_id FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id WHERE d.id = ?',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];

    // Check permissions
    if (userRole === 'personnel' && document.uploaded_by_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', document.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
    res.setHeader('Content-Length', document.file_size);

    // Send file data
    res.send(Buffer.from(document.file_data));
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if document exists and get owner
    const docResult = await queryOne('SELECT uploaded_by FROM documents WHERE id = ?', [id]);
    
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Check permissions - only admin or owner can delete
    if (userRole !== 'admin' && document.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete document (cascade will handle related records)
    await execute('DELETE FROM documents WHERE id = ?', [id]);

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [id, userId, 'deleted', 'Document deleted']
    );

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  getDocument,
  downloadDocument,
  deleteDocument
};
