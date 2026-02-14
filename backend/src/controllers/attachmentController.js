const { query, queryOne, execute } = require('../utils/dbHelper');
const { detectFileType } = require('../utils/fileHandler');

// Upload attachment for a document
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Validate file size (50MB limit)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT uploaded_by FROM documents WHERE id = ?', [id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Check permissions - personnel can only add attachments to their own documents
    if (req.user.role === 'personnel' && document.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { originalname, buffer, mimetype, size } = req.file;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${originalname}`;
    const fileType = detectFileType(originalname, mimetype);

    // Insert attachment into database
    const result = await execute(
      `INSERT INTO document_attachments (document_id, filename, original_filename, file_data, file_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, filename, originalname, buffer, fileType, size, userId]
    );

    const attachmentId = result.lastInsertRowid;

    // Get the created attachment
    const attachmentResult = await queryOne(
      'SELECT id, document_id, filename, original_filename, file_type, file_size, uploaded_by, created_at FROM document_attachments WHERE id = ?',
      [attachmentId]
    );
    const attachment = attachmentResult.rows[0];

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [id, userId, 'attachment_uploaded', `Attachment uploaded: ${originalname}`]
    );

    res.status(201).json({
      message: 'Attachment uploaded successfully',
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        original_filename: attachment.original_filename,
        file_type: attachment.file_type,
        file_size: parseInt(attachment.file_size),
        uploaded_by: attachment.uploaded_by,
        created_at: attachment.created_at
      }
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

// List attachments for a document
const listAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify document exists and user has access
    const docResult = await queryOne('SELECT uploaded_by FROM documents WHERE id = ?', [id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Check permissions
    if (userRole === 'personnel' && document.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT da.id, da.filename, da.original_filename, da.file_type, da.file_size, 
              da.uploaded_by, da.created_at,
              u.name as uploaded_by_name, u.email as uploaded_by_email
       FROM document_attachments da
       LEFT JOIN users u ON da.uploaded_by = u.id
       WHERE da.document_id = ?
       ORDER BY da.created_at DESC`,
      [id]
    );

    res.json({
      attachments: result.rows.map(att => ({
        ...att,
        file_size: parseInt(att.file_size)
      }))
    });
  } catch (error) {
    console.error('List attachments error:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

// Download attachment
const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await queryOne(
      `SELECT da.*, d.uploaded_by as document_uploaded_by
       FROM document_attachments da
       JOIN documents d ON da.document_id = d.id
       WHERE da.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = result.rows[0];

    // Check permissions
    if (userRole === 'personnel' && attachment.document_uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
    res.setHeader('Content-Length', attachment.file_size);

    // Send file data
    res.send(Buffer.from(attachment.file_data));
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get attachment with document info
    const attResult = await queryOne(
      `SELECT da.*, d.id as document_id, d.uploaded_by as document_uploaded_by
       FROM document_attachments da
       JOIN documents d ON da.document_id = d.id
       WHERE da.id = ?`,
      [id]
    );

    if (attResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = attResult.rows[0];

    // Check permissions - only admin, document owner, or attachment uploader can delete
    if (userRole !== 'admin' && 
        attachment.document_uploaded_by !== userId && 
        attachment.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete attachment
    await execute('DELETE FROM document_attachments WHERE id = ?', [id]);

    // Log to history
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [attachment.document_id, userId, 'attachment_deleted', `Attachment deleted: ${attachment.original_filename}`]
    );

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

module.exports = {
  uploadAttachment,
  listAttachments,
  downloadAttachment,
  deleteAttachment
};
