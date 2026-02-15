# Sample Documents Seeding Guide

This guide explains how to seed the database with sample documents for demo purposes.

## Quick Start

To seed sample documents into the database, run:

```bash
cd backend
npm run seed-documents
```

Or directly:

```bash
cd backend
node scripts/seedSampleDocuments.js
```

## Prerequisites

1. **Database must be initialized**: Run `npm run init-db` first if you haven't already
2. **Sample users must exist**: Run `npm run seed-users` to create sample users
3. **Sample files must exist**: Ensure the `samples/` directory structure is in place:
   ```
   samples/
   ├── documents/          # Sample document files
   ├── attachments/        # Sample attachment files
   ├── data/              # JSON metadata files
   └── README.md
   ```

## What Gets Seeded

The script will create **8 sample documents** with:

- ✅ Full metadata (title, purpose, case number, classification, priority, etc.)
- ✅ File content from sample files
- ✅ Tracking numbers (auto-generated)
- ✅ Workflow stages (based on document purpose and unit)
- ✅ Document history entries
- ✅ Status: All documents start in "pending" status

## Sample Documents Created

1. **Investigation Report - Theft Case** (INV-2024-001)
   - Classification: Confidential
   - Priority: Urgent
   - Uploader: personnel1@pnp.gov.ph

2. **Intelligence Report - Metro Manila Operations** (INT-2024-002)
   - Classification: Secret
   - Priority: Priority
   - Uploader: personnel2@pnp.gov.ph

3. **Administrative Request - Annual Leave Application** (ADM-2024-003)
   - Classification: For Official Use Only
   - Priority: Routine
   - Uploader: personnel3@pnp.gov.ph

4. **Financial Request - Q1 2024 Operational Expenses** (FIN-2024-004)
   - Classification: For Official Use Only
   - Priority: Urgent
   - Uploader: personnel4@pnp.gov.ph

5. **Incident Report - Traffic Accident EDSA** (INC-2024-005)
   - Classification: Restricted
   - Priority: Emergency
   - Uploader: personnel1@pnp.gov.ph

6. **Procurement Request - Office Equipment** (PROC-2024-006)
   - Classification: For Official Use Only
   - Priority: Priority
   - Uploader: operationschief@pnp.gov.ph

7. **Budget Report - Q1 2024 Financial Summary** (FIN-2024-007)
   - Classification: For Official Use Only
   - Priority: Routine
   - Uploader: personnel4@pnp.gov.ph

8. **Inventory List - Equipment and Supplies** (PROC-2024-008)
   - Classification: For Official Use Only
   - Priority: Routine
   - Uploader: logisticschief@pnp.gov.ph

## Workflow Status

All documents are created with workflow stages based on their purpose and office unit. The workflows will be in "pending" status, ready for approval by the appropriate authorities.

## Re-running the Script

The script is **idempotent** - it will:
- ✅ Skip documents that already exist (based on case reference number)
- ✅ Create new documents if they don't exist
- ✅ Generate new tracking numbers for new documents

You can safely run the script multiple times without creating duplicates.

## Troubleshooting

### Error: "User not found"
- **Solution**: Run `npm run seed-users` first to create sample users

### Error: "File not found"
- **Solution**: Ensure sample files exist in `samples/documents/` directory
- Check that filenames in `sampleDocuments.json` match actual files

### Error: "Database not initialized"
- **Solution**: Run `npm run init-db` to initialize the database schema

## Viewing Seeded Documents

After seeding, you can:

1. **Log in** to the system with any sample user account
2. **Navigate to Documents** page to see all seeded documents
3. **View document details** by clicking on any document
4. **Test workflow approval** by logging in as appropriate authority users

## Sample User Accounts

Use these accounts to test the seeded documents:

- **Personnel**: personnel1@pnp.gov.ph / personnel123
- **Supervisor**: supervisor1@pnp.gov.ph / supervisor123
- **Unit Commander**: unitcommander1@pnp.gov.ph / commander123
- **Provincial Director**: provincialdirector@pnp.gov.ph / director123
- **Regional Director**: regionaldirector@pnp.gov.ph / director123

## Next Steps

1. ✅ Seed users: `npm run seed-users`
2. ✅ Seed documents: `npm run seed-documents`
3. ✅ Start the application: `npm run dev` (backend) and `npm run dev` (frontend)
4. ✅ Log in and explore the seeded documents!

---

**Note**: These are demo/sample documents only. Do not use in production environments.
