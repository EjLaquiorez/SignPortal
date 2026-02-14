const db = require('../src/config/database');
const { query, queryOne, execute } = require('../src/utils/dbHelper');

async function migrateToVersioning() {
  try {
    console.log('Starting Document Versioning migration...\n');

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

    // 1. Add columns to documents table
    console.log('1. Extending documents table...');
    const documentColumns = [
      { name: 'current_version_number', type: 'INTEGER DEFAULT 1' },
      { name: 'signature_method', type: "TEXT DEFAULT 'physical' CHECK (signature_method IN ('digital', 'physical', 'hybrid'))" },
      { name: 'tracking_number', type: 'TEXT' },
      { name: 'current_stage_name', type: 'TEXT' }
    ];

    for (const col of documentColumns) {
      if (!(await columnExists('documents', col.name))) {
        await execute(`ALTER TABLE documents ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ Added column: ${col.name}`);
      } else {
        console.log(`   - Column already exists: ${col.name}`);
      }
    }

    // Set default version number for existing documents
    await execute(`UPDATE documents SET current_version_number = 1 WHERE current_version_number IS NULL`);
    console.log('   ✓ Set default version numbers for existing documents');
    
    // Generate tracking numbers for existing documents without one
    try {
      const { generateTrackingNumber } = require('../src/utils/trackingNumber');
      const docsWithoutTracking = await query('SELECT id, purpose FROM documents WHERE tracking_number IS NULL OR tracking_number = ""');
      if (docsWithoutTracking.rows.length > 0) {
        console.log(`   Generating tracking numbers for ${docsWithoutTracking.rows.length} existing documents...`);
        for (const doc of docsWithoutTracking.rows) {
          const trackingNum = await generateTrackingNumber(doc.purpose || 'default');
          await execute('UPDATE documents SET tracking_number = ? WHERE id = ?', [trackingNum, doc.id]);
          console.log(`   ✓ Generated tracking number ${trackingNum} for document ${doc.id}`);
        }
      }
    } catch (err) {
      console.log('   ⚠ Could not generate tracking numbers for existing documents:', err.message);
    }
    
    // Create unique index on tracking_number if it doesn't exist
    try {
      const trackingIndexExists = await indexExists('idx_documents_tracking_number');
      if (!trackingIndexExists) {
        await execute('CREATE UNIQUE INDEX idx_documents_tracking_number ON documents(tracking_number) WHERE tracking_number IS NOT NULL');
        console.log('   ✓ Created unique index on tracking_number');
      }
    } catch (err) {
      console.log('   ⚠ Could not create unique index on tracking_number:', err.message);
    }

    // 2. Add columns to workflow_stages table
    console.log('\n2. Extending workflow_stages table...');
    const stageColumns = [
      { name: 'requires_signed_upload', type: 'INTEGER DEFAULT 0' },
      { name: 'signed_version_uploaded', type: 'INTEGER DEFAULT 0' }
    ];

    for (const col of stageColumns) {
      if (!(await columnExists('workflow_stages', col.name))) {
        await execute(`ALTER TABLE workflow_stages ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ Added column: ${col.name}`);
      } else {
        console.log(`   - Column already exists: ${col.name}`);
      }
    }

    // 3. Create document_versions table
    console.log('\n3. Creating document_versions table...');
    if (!(await tableExists('document_versions'))) {
      await execute(`
        CREATE TABLE document_versions (
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
        )
      `);
      console.log('   ✓ Created document_versions table');
    } else {
      console.log('   - Table already exists: document_versions');
    }

    // 4. Create indexes
    console.log('\n4. Creating indexes...');
    const indexes = [
      { name: 'idx_document_versions_document_id', sql: 'CREATE INDEX idx_document_versions_document_id ON document_versions(document_id)' },
      { name: 'idx_document_versions_stage_id', sql: 'CREATE INDEX idx_document_versions_stage_id ON document_versions(workflow_stage_id)' },
      { name: 'idx_document_versions_version_number', sql: 'CREATE INDEX idx_document_versions_version_number ON document_versions(document_id, version_number)' }
    ];

    for (const idx of indexes) {
      if (!(await indexExists(idx.name))) {
        await execute(idx.sql);
        console.log(`   ✓ Created index: ${idx.name}`);
      } else {
        console.log(`   - Index already exists: ${idx.name}`);
      }
    }

    console.log('\n✓ Migration completed successfully!');
    console.log('\nDocument versioning is now enabled.');
    console.log('You can now upload signed document versions for workflow stages.');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToVersioning()
    .then(() => {
      console.log('\nMigration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = migrateToVersioning;
