-- SigningPortal Database Schema (SQLite)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('personnel', 'authority', 'admin')),
    name TEXT NOT NULL,
    rank TEXT,
    designation TEXT,
    unit TEXT,
    badge_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT UNIQUE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_data BLOB NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    document_title TEXT,
    purpose TEXT,
    office_unit TEXT,
    case_reference_number TEXT,
    classification_level TEXT CHECK (classification_level IN ('For Official Use Only', 'Restricted', 'Confidential', 'Secret')),
    priority TEXT CHECK (priority IN ('Routine', 'Urgent', 'Priority', 'Emergency')),
    deadline DATETIME,
    notes TEXT,
    is_urgent INTEGER DEFAULT 0,
    current_version_number INTEGER DEFAULT 1,
    signature_method TEXT DEFAULT 'physical' CHECK (signature_method IN ('digital', 'physical', 'hybrid')),
    current_stage_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow stages table
CREATE TABLE IF NOT EXISTS workflow_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    required_role TEXT NOT NULL CHECK (required_role IN ('personnel', 'authority', 'admin')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    deadline DATETIME,
    comments TEXT,
    rejection_reason TEXT,
    completed_at DATETIME,
    requires_signed_upload INTEGER DEFAULT 0,
    signed_version_uploaded INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Signatures table
CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_stage_id INTEGER REFERENCES workflow_stages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    signature_data BLOB NOT NULL,
    signature_type TEXT DEFAULT 'canvas' CHECK (signature_type IN ('canvas', 'upload')),
    rank TEXT,
    designation TEXT,
    signature_position TEXT,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
);

-- Document history table (audit trail)
CREATE TABLE IF NOT EXISTS document_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document attachments table (supporting evidence files)
CREATE TABLE IF NOT EXISTS document_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_data BLOB NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    workflow_stage_id INTEGER REFERENCES workflow_stages(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow comments table
CREATE TABLE IF NOT EXISTS workflow_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_stage_id INTEGER REFERENCES workflow_stages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    workflow_stage_id INTEGER REFERENCES workflow_stages(id) ON DELETE SET NULL,
    version_number INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_data BLOB NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    upload_reason TEXT,
    is_signed_version INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_purpose ON documents(purpose);
CREATE INDEX IF NOT EXISTS idx_documents_office_unit ON documents(office_unit);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification_level);
CREATE INDEX IF NOT EXISTS idx_documents_priority ON documents(priority);
CREATE INDEX IF NOT EXISTS idx_documents_deadline ON documents(deadline);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_document_id ON workflow_stages(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_assigned_to ON workflow_stages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_deadline ON workflow_stages(deadline);
CREATE INDEX IF NOT EXISTS idx_signatures_workflow_stage_id ON signatures(workflow_stage_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_history_user_id ON document_history(user_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_stage_id ON workflow_comments(stage_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_stage_id ON document_versions(workflow_stage_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(document_id, version_number);
