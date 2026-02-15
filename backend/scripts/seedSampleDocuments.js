const db = require('../src/config/database');
const { query, queryOne, execute } = require('../src/utils/dbHelper');
const { generateTrackingNumber } = require('../src/utils/trackingNumber');
const { createDefaultWorkflow } = require('../src/controllers/workflowController');
const { detectFileType } = require('../src/utils/fileHandler');
const fs = require('fs');
const path = require('path');

async function seedSampleDocuments() {
  try {
    console.log('Starting sample document seeding...\n');

    // Read sample documents metadata from JSON file
    const samplesDir = path.join(__dirname, '../../samples');
    const documentsDataPath = path.join(samplesDir, 'data/sampleDocuments.json');
    const documentsDir = path.join(samplesDir, 'documents');

    if (!fs.existsSync(documentsDataPath)) {
      console.error(`✗ Sample documents data file not found: ${documentsDataPath}`);
      console.log('\nPlease ensure the samples directory exists with sampleDocuments.json');
      process.exit(1);
    }

    if (!fs.existsSync(documentsDir)) {
      console.error(`✗ Sample documents directory not found: ${documentsDir}`);
      console.log('\nPlease ensure the samples/documents directory exists with sample files');
      process.exit(1);
    }

    const documentsData = JSON.parse(fs.readFileSync(documentsDataPath, 'utf8'));
    console.log(`Found ${documentsData.length} documents to seed.\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const docData of documentsData) {
      try {
        // Check if document already exists by tracking number or case reference
        let existing = null;
        if (docData.case_reference_number) {
          existing = await queryOne(
            'SELECT id FROM documents WHERE case_reference_number = ?',
            [docData.case_reference_number]
          );
        }

        if (existing && existing.rows.length > 0) {
          console.log(`⚠ Document already exists: ${docData.document_title} (${docData.case_reference_number}) - Skipping`);
          skipped++;
          continue;
        }

        // Get user ID for uploader
        const userResult = await queryOne(
          'SELECT id FROM users WHERE email = ?',
          [docData.uploaded_by_email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
          console.log(`⚠ User not found: ${docData.uploaded_by_email} - Skipping document: ${docData.document_title}`);
          skipped++;
          continue;
        }

        const userId = userResult.rows[0].id;

        // Read the sample file
        const filePath = path.join(documentsDir, docData.filename);
        if (!fs.existsSync(filePath)) {
          console.log(`⚠ File not found: ${docData.filename} - Skipping document: ${docData.document_title}`);
          skipped++;
          continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileSize = fileBuffer.length;
        const originalFilename = docData.filename;
        const timestamp = Date.now();
        const filename = `${timestamp}_${originalFilename}`;
        // Detect file type based on extension
        const fileType = detectFileType(originalFilename, 'application/octet-stream');

        // Generate tracking number
        const trackingNumber = await generateTrackingNumber(docData.purpose);

        // Determine if urgent based on priority
        const isUrgent = docData.is_urgent || 
                        docData.priority === 'Urgent' || 
                        docData.priority === 'Emergency' || 
                        docData.priority === 'Priority';

        // Insert document into database
        const result = await execute(
          `INSERT INTO documents (
            tracking_number, filename, original_filename, file_data, file_type, file_size, 
            uploaded_by, status, document_title, purpose, office_unit, 
            case_reference_number, classification_level, priority, deadline, 
            notes, is_urgent, current_stage_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            trackingNumber,
            filename,
            originalFilename,
            fileBuffer,
            fileType,
            fileSize,
            userId,
            'pending',
            docData.document_title,
            docData.purpose,
            docData.office_unit,
            docData.case_reference_number || null,
            docData.classification_level || null,
            docData.priority || 'Routine',
            docData.deadline || null,
            docData.notes || null,
            isUrgent ? 1 : 0,
            'Pending Initial Review'
          ]
        );

        const documentId = result.lastInsertRowid;

        // Create workflow stages for the document
        await createDefaultWorkflow(documentId, docData.purpose, docData.office_unit);

        // Log to history
        const historyDetails = `Sample document seeded: ${docData.document_title} (${docData.purpose}) - Case: ${docData.case_reference_number || 'N/A'}`;
        await execute(
          'INSERT INTO document_history (document_id, user_id, action, details) VALUES (?, ?, ?, ?)',
          [documentId, userId, 'uploaded', historyDetails]
        );

        console.log(`✓ Created document: ${docData.document_title}`);
        console.log(`  Tracking: ${trackingNumber}`);
        console.log(`  Case #: ${docData.case_reference_number || 'N/A'}`);
        console.log(`  Status: pending`);
        console.log('');

        created++;
      } catch (error) {
        console.error(`✗ Error creating document ${docData.document_title}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Seeding Summary:');
    console.log(`  ✓ Created: ${created} documents`);
    console.log(`  ⚠ Skipped: ${skipped} documents`);
    console.log(`  ✗ Errors: ${errors} documents`);
    console.log('='.repeat(60));

    if (created > 0) {
      console.log('\n✓ Sample documents seeded successfully!');
      console.log('\nAll documents are in "pending" status and ready for workflow approval.');
      console.log('You can now log in and view/approve these documents in the system.');
    }

  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedSampleDocuments()
    .then(() => {
      console.log('\nSeeding script completed.');
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('Seeding error:', error);
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        process.exit(1);
      });
    });
}

module.exports = seedSampleDocuments;
