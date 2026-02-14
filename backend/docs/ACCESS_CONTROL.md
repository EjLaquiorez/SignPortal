# Document Access Control System

## Overview

The SignPortal system implements **strict access control and confidentiality** for all uploaded documents. Each document is only visible to:

1. **The original uploader** (personnel who uploaded the document)
2. **Authorized personnel assigned to workflow stages** (approvers/reviewers)
3. **System administrators** (full access for management purposes)

This ensures that sensitive and classified documents are protected and only accessible to relevant personnel, similar to secure document workflows used in organizations like the Philippine National Police.

---

## Access Control Rules

### 1. System Administrators (`admin` role)
- **Full Access**: Can view, download, and manage all documents in the system
- **Purpose**: System administration, troubleshooting, and oversight

### 2. Personnel (`personnel` role)
- **Limited Access**: Can only view and manage documents they uploaded
- **Cannot Access**: Documents uploaded by other personnel, even within the same department
- **Purpose**: Ensures personnel can track their own document submissions

### 3. Authority Users (`authority` role)
- **Workflow-Based Access**: Can only access documents where they are assigned to a workflow stage
- **Assignment Required**: Must be explicitly assigned to a workflow stage to gain access
- **Cannot Access**: Documents where they are not assigned, even if they are in the same department
- **Purpose**: Ensures only designated approvers can review and sign documents

---

## How Access is Determined

### For Personnel:
```sql
-- Personnel can only see documents they uploaded
WHERE documents.uploaded_by = user_id
```

### For Authority:
```sql
-- Authority can see documents where:
-- 1. They uploaded the document (if they are also personnel), OR
-- 2. They are assigned to any workflow stage for that document
WHERE documents.uploaded_by = user_id 
   OR EXISTS (
     SELECT 1 FROM workflow_stages 
     WHERE workflow_stages.document_id = documents.id 
     AND workflow_stages.assigned_to = user_id
   )
```

### For Admin:
```sql
-- Admin can see all documents (no filter)
-- No WHERE clause restrictions
```

---

## Implementation Details

### Core Utility: `documentAccess.js`

Located at: `backend/src/utils/documentAccess.js`

#### Functions:

1. **`checkDocumentAccess(userId, userRole, documentId)`**
   - Checks if a user has access to a specific document
   - Returns: `{ hasAccess: boolean, reason: string }`
   - Used for: Individual document access verification

2. **`getAccessibleDocumentIds(userId, userRole)`
   - Returns array of document IDs the user can access
   - Used for: Bulk access checks and filtering

3. **`buildAccessFilter(userId, userRole)`**
   - Builds SQL WHERE clause for document filtering
   - Returns: `{ sql: string, params: any[] }`
   - Used for: Query construction in list operations

---

## Protected Endpoints

All document-related endpoints enforce access control:

### Document Management
- `GET /api/documents` - List documents (filtered by access)
- `GET /api/documents/:id` - Get document details (access check)
- `GET /api/documents/:id/download` - Download document (access check)
- `DELETE /api/documents/:id` - Delete document (owner/admin only)

### Document Versions
- `GET /api/documents/:id/versions` - List versions (access check)
- `GET /api/documents/:id/versions/:versionId` - Get version (access check)
- `GET /api/documents/:id/versions/:versionId/download` - Download version (access check)
- `GET /api/documents/:id/versions/current` - Get current version (access check)
- `POST /api/documents/:id/versions` - Upload signed version (access check)

### Workflow
- `GET /api/workflow/:id` - Get workflow stages (access check)
- `GET /api/workflow/pending` - Get pending approvals (only assigned stages)

---

## Workflow Assignment

### How Documents Become Accessible to Authority Users

1. **Document Upload**: When a document is uploaded, workflow stages are created based on the document's purpose
2. **Stage Assignment**: Authority users are assigned to specific workflow stages
3. **Access Granted**: Once assigned, the authority user gains access to the document
4. **Access Maintained**: Access is maintained even after stage completion for audit purposes

### Example Workflow:

```
Document: Investigation Report
├── Stage 1: Police Staff Review
│   └── Assigned to: PSMS Pedro Martinez (supervisor1@pnp.gov.ph)
│       → Has access to document
├── Stage 2: Unit Commander Approval
│   └── Assigned to: PLTCOL Antonio Cruz (unitcommander1@pnp.gov.ph)
│       → Has access to document
├── Stage 3: Provincial Director Review
│   └── Assigned to: PCOL Ricardo Dela Rosa (provincialdirector@pnp.gov.ph)
│       → Has access to document
└── Stage 4: Regional Director Final Approval
    └── Assigned to: PBGEN Alfredo Lim (regionaldirector@pnp.gov.ph)
        → Has access to document
```

**Note**: Each authority user can only see documents where they are assigned. If `PSMS Pedro Martinez` is not assigned to a document, they cannot see it, even if it's an investigation report.

---

## Security Features

### 1. Query-Level Filtering
- Access control is enforced at the database query level
- Prevents unauthorized documents from appearing in API responses

### 2. Endpoint-Level Verification
- Each endpoint verifies access before processing requests
- Returns `403 Forbidden` if access is denied

### 3. Audit Trail
- All access attempts are logged in `document_history` table
- Tracks who accessed what and when

### 4. No Department-Wide Access
- Even if users are in the same department/unit, they cannot see each other's documents
- Access is strictly based on ownership or workflow assignment

---

## Error Messages

When access is denied, users receive clear error messages:

- `403 Forbidden`: "Access denied: You do not have permission to view this document"
- `403 Forbidden`: "Access denied: You do not have permission to download this document"
- `403 Forbidden`: "Access denied: You do not have permission to view this document workflow"

---

## Testing Access Control

### Test Scenarios:

1. **Personnel Upload Test**
   - Login as `personnel1@pnp.gov.ph`
   - Upload a document
   - Login as `personnel2@pnp.gov.ph`
   - Verify: Cannot see personnel1's document

2. **Authority Assignment Test**
   - Upload document as personnel
   - Assign stage to authority user
   - Login as assigned authority
   - Verify: Can see and access document
   - Login as different authority (not assigned)
   - Verify: Cannot see document

3. **Admin Access Test**
   - Login as admin
   - Verify: Can see all documents regardless of ownership or assignment

---

## Migration Notes

If upgrading from a previous version:

1. Existing documents will maintain their current access patterns
2. Authority users will need to be assigned to workflow stages to gain access
3. Personnel will continue to see only their own documents
4. Admins will continue to have full access

---

## Best Practices

1. **Assign Stages Promptly**: Assign authority users to workflow stages immediately after document upload
2. **Review Assignments**: Regularly review workflow stage assignments to ensure correct personnel have access
3. **Audit Logs**: Monitor `document_history` for unauthorized access attempts
4. **Role Management**: Ensure users have correct roles (personnel vs authority) based on their responsibilities

---

## Technical Implementation

### File Structure:
```
backend/
├── src/
│   ├── utils/
│   │   └── documentAccess.js          # Access control utilities
│   └── controllers/
│       ├── documentController.js       # Document CRUD (with access control)
│       ├── documentVersionController.js # Version management (with access control)
│       └── workflowController.js       # Workflow management (with access control)
```

### Key Code Pattern:
```javascript
// In any controller function
const accessCheck = await checkDocumentAccess(userId, userRole, documentId);
if (!accessCheck.hasAccess) {
  return res.status(403).json({ 
    error: 'Access denied: You do not have permission...' 
  });
}
```

---

## Summary

The access control system ensures:
- ✅ Documents are only visible to uploaders and assigned approvers
- ✅ Authority users cannot see documents unless assigned
- ✅ Personnel cannot see other personnel's documents
- ✅ Admins have full access for system management
- ✅ Access is enforced at both query and endpoint levels
- ✅ Clear error messages guide users when access is denied

This creates a secure, traceable, and confidential document workflow suitable for sensitive government and organizational use.
