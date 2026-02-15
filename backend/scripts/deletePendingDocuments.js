const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../signingportal.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database:', dbPath);
  console.log('\n=== Deleting Pending Documents ===\n');
  
  // Enable foreign keys for cascade deletes
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      console.error('Error enabling foreign keys:', err);
      db.close();
      return;
    }
    
    // First, get all pending documents to show what will be deleted
    db.all(
      `SELECT id, tracking_number, document_title, original_filename, status, 
              purpose, case_reference_number, created_at 
       FROM documents 
       WHERE status = 'pending'`,
      (err, pendingDocs) => {
        if (err) {
          console.error('Error fetching pending documents:', err);
          db.close();
          return;
        }
        
        if (pendingDocs.length === 0) {
          console.log('No pending documents found.');
          db.close();
          return;
        }
        
        console.log(`Found ${pendingDocs.length} pending document(s):\n`);
        pendingDocs.forEach((doc, index) => {
          console.log(`${index + 1}. ID: ${doc.id}`);
          console.log(`   Title: ${doc.document_title || doc.original_filename || 'N/A'}`);
          console.log(`   Tracking: ${doc.tracking_number || 'N/A'}`);
          console.log(`   Case #: ${doc.case_reference_number || 'N/A'}`);
          console.log(`   Purpose: ${doc.purpose || 'N/A'}`);
          console.log(`   Created: ${doc.created_at}`);
          console.log('');
        });
        
        // Delete all pending documents
        // Cascade delete will handle related records (workflow_stages, signatures, etc.)
        db.run(
          `DELETE FROM documents WHERE status = 'pending'`,
          function(err) {
            if (err) {
              console.error('Error deleting pending documents:', err);
              db.close();
              return;
            }
            
            console.log(`\n✓ Successfully deleted ${this.changes} pending document(s).\n`);
            console.log('=== Deletion Complete ===\n');
            db.close();
          }
        );
      }
    );
  });
});
