const db = require('../src/config/database');
const { query, queryOne, execute } = require('../src/utils/dbHelper');

async function migrateToPNP() {
  try {
    console.log('Starting PNP migration...\n');

    // Helper to check if column exists
    const columnExists = async (tableName, columnName) => {
      try {
        const result = await query(
          `PRAGMA table_info(${tableName})`
        );
        return result.rows.some(col => col.name === columnName);
      } catch (e) {
        return false;
      }
    };

    // Helper to check if table exists
    const tableExists = async (tableName) => {
      try {
        const result = await queryOne(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName]
        );
        return result.rows.length > 0;
      } catch (e) {
        return false;
      }
    };

    // Helper to check if index exists
    const indexExists = async (indexName) => {
      try {
        const result = await queryOne(
          `SELECT name FROM sqlite_master WHERE type='index' AND name=?`,
          [indexName]
        );
        return result.rows.length > 0;
      } catch (e) {
        return false;
      }
    };

    // 1. Extend Users table
    console.log('1. Extending users table...');
    const userColumns = [
      { name: 'rank', type: 'TEXT' },
      { name: 'designation', type: 'TEXT' },
      { name: 'unit', type: 'TEXT' },
      { name: 'badge_number', type: 'TEXT' }
    ];

    for (const col of userColumns) {
      const exists = await columnExists('users', col.name);
      if (!exists) {
        await execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ Added column: ${col.name}`);
      } else {
        console.log(`   - Column already exists: ${col.name}`);
      }
    }

    // 2. Extend Documents table
    console.log('\n2. Extending documents table...');
    const documentColumns = [
      { name: 'document_title', type: 'TEXT' },
      { name: 'purpose', type: 'TEXT' },
      { name: 'office_unit', type: 'TEXT' },
      { name: 'case_reference_number', type: 'TEXT' },
      { name: 'classification_level', type: 'TEXT' },
      { name: 'priority', type: 'TEXT' },
      { name: 'deadline', type: 'DATETIME' },
      { name: 'notes', type: 'TEXT' },
      { name: 'is_urgent', type: 'INTEGER DEFAULT 0' }
    ];

    for (const col of documentColumns) {
      const exists = await columnExists('documents', col.name);
      if (!exists) {
        await execute(`ALTER TABLE documents ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ Added column: ${col.name}`);
      } else {
        console.log(`   - Column already exists: ${col.name}`);
      }
    }

    // 3. Extend Workflow Stages table
    console.log('\n3. Extending workflow_stages table...');
    const stageColumns = [
      { name: 'deadline', type: 'DATETIME' },
      { name: 'comments', type: 'TEXT' },
      { name: 'rejection_reason', type: 'TEXT' }
    ];

    for (const col of stageColumns) {
      const exists = await columnExists('workflow_stages', col.name);
      if (!exists) {
        await execute(`ALTER TABLE workflow_stages ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ Added column: ${col.name}`);
      } else {
        console.log(`   - Column already exists: ${col.name}`);
      }
    }

    // 4. Extend Signatures table
    console.log('\n4. Extending signatures table...');
    const signatureColumns = [
      { name: 'rank', type: 'TEXT' },
      { name: 'designation', type: 'TEXT' },
      { name: 'signature_position', type: 'TEXT' }
    ];

    for (const col of signatureColumns) {
      const exists = await columnExists('signatures', col.name);
      if (!exists) {
        await execute(`ALTER TABLE signatures ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ Added column: ${col.name}`);
      } else {
        console.log(`   - Column already exists: ${col.name}`);
      }
    }

    // 5. Create Document Attachments table
    console.log('\n5. Creating document_attachments table...');
    const attachmentsExists = await tableExists('document_attachments');
    if (!attachmentsExists) {
      await execute(`
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
        )
      `);
      console.log('   ✓ Created document_attachments table');
    } else {
      console.log('   - Table already exists: document_attachments');
    }

    // 6. Create Notifications table
    console.log('\n6. Creating notifications table...');
    const notificationsExists = await tableExists('notifications');
    if (!notificationsExists) {
      await execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
          workflow_stage_id INTEGER REFERENCES workflow_stages(id) ON DELETE SET NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ Created notifications table');
    } else {
      console.log('   - Table already exists: notifications');
    }

    // 7. Create Workflow Comments table
    console.log('\n7. Creating workflow_comments table...');
    const commentsExists = await tableExists('workflow_comments');
    if (!commentsExists) {
      await execute(`
        CREATE TABLE IF NOT EXISTS workflow_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workflow_stage_id INTEGER REFERENCES workflow_stages(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          comment TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ Created workflow_comments table');
    } else {
      console.log('   - Table already exists: workflow_comments');
    }

    // 8. Create new indexes
    console.log('\n8. Creating indexes...');
    const indexes = [
      { name: 'idx_documents_purpose', sql: 'CREATE INDEX IF NOT EXISTS idx_documents_purpose ON documents(purpose)' },
      { name: 'idx_documents_office_unit', sql: 'CREATE INDEX IF NOT EXISTS idx_documents_office_unit ON documents(office_unit)' },
      { name: 'idx_documents_classification', sql: 'CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification_level)' },
      { name: 'idx_documents_priority', sql: 'CREATE INDEX IF NOT EXISTS idx_documents_priority ON documents(priority)' },
      { name: 'idx_documents_deadline', sql: 'CREATE INDEX IF NOT EXISTS idx_documents_deadline ON documents(deadline)' },
      { name: 'idx_workflow_stages_deadline', sql: 'CREATE INDEX IF NOT EXISTS idx_workflow_stages_deadline ON workflow_stages(deadline)' },
      { name: 'idx_document_attachments_document_id', sql: 'CREATE INDEX IF NOT EXISTS idx_document_attachments_document_id ON document_attachments(document_id)' },
      { name: 'idx_notifications_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)' },
      { name: 'idx_notifications_is_read', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)' },
      { name: 'idx_workflow_comments_stage_id', sql: 'CREATE INDEX IF NOT EXISTS idx_workflow_comments_stage_id ON workflow_comments(workflow_stage_id)' }
    ];

    for (const idx of indexes) {
      const exists = await indexExists(idx.name);
      if (!exists) {
        await execute(idx.sql);
        console.log(`   ✓ Created index: ${idx.name}`);
      } else {
        console.log(`   - Index already exists: ${idx.name}`);
      }
    }

    console.log('\n✓ Migration completed successfully!');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    db.close();
    process.exit(1);
  }
}

migrateToPNP();
