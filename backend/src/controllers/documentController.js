const { query, queryOne, execute } = require('../utils/dbHelper');
const { detectFileType } = require('../utils/fileHandler');
const { createDefaultWorkflow } = require('./workflowController');
const { generateTrackingNumber } = require('../utils/trackingNumber');
const { checkDocumentAccess, buildAccessFilter } = require('../utils/documentAccess');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file size (50MB limit)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    // Extract PNP metadata from request body
    const {
      document_title,
      purpose,
      office_unit,
      case_reference_number,
      classification_level,
      priority,
      deadline,
      notes
    } = req.body;

    // Validate required fields
    if (!document_title || !purpose || !office_unit) {
      return res.status(400).json({ 
        error: 'Document title, purpose, and office/unit are required' 
      });
    }

    // Validate classification level
    const validClassifications = ['For Official Use Only', 'Restricted', 'Confidential', 'Secret'];
    if (classification_level && !validClassifications.includes(classification_level)) {
      return res.status(400).json({ 
        error: `Invalid classification level. Must be one of: ${validClassifications.join(', ')}` 
      });
    }

    // Validate priority
    const validPriorities = ['Routine', 'Urgent', 'Priority', 'Emergency'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      });
    }

    // Determine if urgent based on priority
    const isUrgent = priority === 'Urgent' || priority === 'Emergency' || priority === 'Priority';

    const { originalname, buffer, mimetype, size } = req.file;
    const userId = req.user.id;

    // Generate unique tracking number
    const trackingNumber = await generateTrackingNumber(purpose);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${originalname}`;
    const fileType = detectFileType(originalname, mimetype);

    // Insert document into database with all PNP metadata
    const result = await execute(
      `INSERT INTO documents (
        tracking_number, filename, original_filename, file_data, file_type, file_size, 
        uploaded_by, status, document_title, purpose, office_unit, 
        case_reference_number, classification_level, priority, deadline, 
        notes, is_urgent, current_stage_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trackingNumber, filename, originalname, buffer, fileType, size, userId, 'pending',
        document_title, purpose, office_unit, case_reference_number || null,
        classification_level || null, priority || 'Routine', deadline || null,
        notes || null, isUrgent ? 1 : 0, 'Pending Initial Review'
      ]
    );

    const documentId = result.lastInsertRowid;

    // Get the created document with all fields
    const docResult = await queryOne(
      `SELECT id, filename, original_filename, file_type, file_size, 
              uploaded_by, status, document_title, purpose, office_unit,
              case_reference_number, classification_level, priority, deadline,
              notes, is_urgent, created_at, updated_at
       FROM documents WHERE id = ?`,
      [documentId]
    );
    const document = docResult.rows[0];

    // Create workflow stages based on document purpose and unit
    await createDefaultWorkflow(document.id, purpose, office_unit);

    // Log to history with full details
    const historyDetails = `Document uploaded: ${document_title} (${purpose}) - Case: ${case_reference_number || 'N/A'}`;
    await execute(
      'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [document.id, userId, 'uploaded', historyDetails]
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        filename: document.filename,
        original_filename: document.original_filename,
        file_type: document.file_type,
        file_size: parseInt(document.file_size),
        status: document.status,
        uploaded_by: document.uploaded_by,
        document_title: document.document_title,
        purpose: document.purpose,
        office_unit: document.office_unit,
        case_reference_number: document.case_reference_number,
        classification_level: document.classification_level,
        priority: document.priority,
        deadline: document.deadline,
        notes: document.notes,
        is_urgent: document.is_urgent === 1,
        created_at: document.created_at,
        updated_at: document.updated_at
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
    const { 
      status, 
      search, 
      purpose, 
      office_unit, 
      classification_level, 
      priority,
      sort_by,
      sort_order 
    } = req.query;

    // Check which columns exist in documents table
    const tableInfo = await query('PRAGMA table_info(documents)');
    const existingColumns = tableInfo.rows.map(col => col.name);
    
        // Build SELECT clause with only existing columns
        const baseColumns = ['d.id', 'd.filename', 'd.original_filename', 'd.file_type', 'd.file_size', 
                             'd.status', 'd.created_at', 'd.updated_at'];
        const pnpColumns = [
          { col: 'tracking_number', alias: 'd.tracking_number' },
          { col: 'document_title', alias: 'd.document_title' },
          { col: 'purpose', alias: 'd.purpose' },
          { col: 'office_unit', alias: 'd.office_unit' },
          { col: 'case_reference_number', alias: 'd.case_reference_number' },
          { col: 'classification_level', alias: 'd.classification_level' },
          { col: 'priority', alias: 'd.priority' },
          { col: 'deadline', alias: 'd.deadline' },
          { col: 'notes', alias: 'd.notes' },
          { col: 'is_urgent', alias: 'd.is_urgent' },
          { col: 'current_stage_name', alias: 'd.current_stage_name' }
        ];
    
    const selectColumns = [...baseColumns];
    pnpColumns.forEach(pnpCol => {
      if (existingColumns.includes(pnpCol.col)) {
        selectColumns.push(pnpCol.alias);
      }
    });
    selectColumns.push('u.name as uploaded_by_name', 'u.email as uploaded_by_email');
    
    // Build access filter based on user role and assignments
    const accessFilter = await buildAccessFilter(userId, userRole);
    
    let sql = `
      SELECT ${selectColumns.join(', ')}
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1 ${accessFilter.sql}
    `;
    const params = [...accessFilter.params];

    // Filter by status
    if (status) {
      sql += ` AND d.status = ?`;
      params.push(status);
    }

    // Filter by purpose
    if (purpose && existingColumns.includes('purpose')) {
      sql += ` AND d.purpose = ?`;
      params.push(purpose);
    }

    // Filter by office/unit
    if (office_unit && existingColumns.includes('office_unit')) {
      sql += ` AND d.office_unit = ?`;
      params.push(office_unit);
    }

    // Filter by classification level
    if (classification_level && existingColumns.includes('classification_level')) {
      sql += ` AND d.classification_level = ?`;
      params.push(classification_level);
    }

    // Filter by priority
    if (priority && existingColumns.includes('priority')) {
      sql += ` AND d.priority = ?`;
      params.push(priority);
    }

    // Search by case number, title, or filename
    if (search) {
      const searchConditions = ['d.original_filename LIKE ?'];
      const searchTerm = `%${search}%`;
      let searchParams = [searchTerm];
      
      if (existingColumns.includes('case_reference_number')) {
        searchConditions.push('d.case_reference_number LIKE ?');
        searchParams.push(searchTerm);
      }
      if (existingColumns.includes('document_title')) {
        searchConditions.push('d.document_title LIKE ?');
        searchParams.push(searchTerm);
      }
      
      sql += ` AND (${searchConditions.join(' OR ')})`;
      params.push(...searchParams);
    }

    // Sorting - only use fields that exist
    const validSortFields = ['created_at', 'updated_at'];
    if (existingColumns.includes('deadline')) validSortFields.push('deadline');
    if (existingColumns.includes('priority')) validSortFields.push('priority');
    if (existingColumns.includes('document_title')) validSortFields.push('document_title');
    
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    
    // Special sorting for priority (Emergency > Priority > Urgent > Routine)
    if (sortField === 'priority' && existingColumns.includes('priority')) {
      sql += ` ORDER BY 
        CASE d.priority 
          WHEN 'Emergency' THEN 1 
          WHEN 'Priority' THEN 2 
          WHEN 'Urgent' THEN 3 
          WHEN 'Routine' THEN 4 
          ELSE 5 
        END ${sortDir}, d.created_at DESC`;
    } else {
      sql += ` ORDER BY d.${sortField} ${sortDir}`;
    }

    const result = await query(sql, params);

    res.json({
      documents: result.rows.map(doc => ({
        ...doc,
        file_size: parseInt(doc.file_size),
        is_urgent: doc.is_urgent === 1 || doc.is_urgent === 0 ? doc.is_urgent === 1 : false,
        // Ensure all PNP fields have defaults if they don't exist
        tracking_number: doc.tracking_number || null,
        document_title: doc.document_title || doc.original_filename || '',
        purpose: doc.purpose || null,
        office_unit: doc.office_unit || null,
        case_reference_number: doc.case_reference_number || null,
        classification_level: doc.classification_level || null,
        priority: doc.priority || 'Routine',
        deadline: doc.deadline || null,
        notes: doc.notes || null,
        current_stage_name: doc.current_stage_name || null
      }))
    });
  } catch (error) {
    console.error('List documents error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
              d.document_title, d.purpose, d.office_unit, d.case_reference_number,
              d.classification_level, d.priority, d.deadline, d.notes, d.is_urgent,
              u.name as uploaded_by_name, u.email as uploaded_by_email,
              u.rank as uploaded_by_rank, u.designation as uploaded_by_designation,
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

    // Check document access using strict access control
    const accessCheck = await checkDocumentAccess(userId, userRole, parseInt(id));
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to view this document' 
      });
    }

    res.json({
      document: {
        ...document,
        file_size: parseInt(document.file_size),
        is_urgent: document.is_urgent === 1
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
      `SELECT d.*, u.id as uploaded_by_id, u.name as uploaded_by_name, u.rank as uploaded_by_rank 
       FROM documents d 
       LEFT JOIN users u ON d.uploaded_by = u.id 
       WHERE d.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];

    // Check document access using strict access control
    const accessCheck = await checkDocumentAccess(userId, userRole, parseInt(id));
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to download this document' 
      });
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
