# SignPortal Functionality Test Guide

## Overview

This test suite verifies all core functionality of the SignPortal system, including:
- Authentication and user management
- Document upload with PNP metadata
- Access control and confidentiality
- Workflow creation and assignment
- Document versioning
- Physical signature workflow
- Document approval flow

## Prerequisites

Before running the tests, ensure:

1. **Backend server is running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Database is initialized**
   ```bash
   npm run init-db
   ```

3. **PNP migration is applied**
   ```bash
   npm run migrate-pnp
   ```

4. **Versioning migration is applied**
   ```bash
   npm run migrate-versioning
   ```

5. **Sample users are seeded**
   ```bash
   npm run seed-users
   ```

## Running the Tests

### Run All Tests
```bash
cd backend
npm test
```

Or directly:
```bash
node scripts/testFunctionality.js
```

### Test Output

The test suite provides detailed output with:
- ✅ **Green checkmarks** for passed tests
- ❌ **Red X marks** for failed tests
- ⚠️ **Yellow warnings** for non-critical issues
- 📊 **Summary statistics** at the end

## Test Coverage

### Test 1: Authentication & User Management
- ✓ Personnel login
- ✓ Supervisor login
- ✓ Unit Commander login
- ✓ Provincial Director login
- ✓ Admin login
- ✓ Get current user info

### Test 2: Document Upload & Metadata
- ✓ Upload document with PNP metadata
- ✓ Verify tracking number format (PNP-YYYY-TYPE-####)
- ✓ Get document details
- ✓ Verify document status and stage

### Test 3: Access Control & Confidentiality
- ✓ Personnel can see their own documents
- ✓ Supervisor cannot see unassigned documents
- ✓ Unit Commander cannot see unassigned documents
- ✓ Access control enforcement

### Test 4: Workflow Creation & Stage Assignment
- ✓ Get workflow stages for document
- ✓ Assign workflow stage to supervisor
- ✓ Verify supervisor can see document after assignment

### Test 5: Document Versioning
- ✓ List document versions
- ✓ Get current document version
- ✓ Version history tracking

### Test 6: Physical Signature Workflow
- ✓ Download document for signature
- ✓ Upload signed document version
- ✓ Verify workflow auto-progression after signed upload
- ✓ Stage auto-completion

### Test 7: Pending Approvals
- ✓ Get pending approvals for authority users
- ✓ Notification system

### Test 8: Document List & Filtering
- ✓ List documents with status filter
- ✓ Search documents by tracking number

### Test 9: Admin Functions
- ✓ Admin can see all documents
- ✓ Admin access verification

## Expected Results

### Successful Test Run
```
✅ Passed: 25+
❌ Failed: 0
⚠️  Warnings: 0-2

📊 Pass Rate: 100%
🎉 All critical tests passed!
```

### Common Issues

#### Issue: Login Failures
**Error**: `✗ Personnel login failed: Invalid email or password`

**Solution**: 
- Ensure sample users are seeded: `npm run seed-users`
- Verify user exists in database
- Check password matches sampleUsers.json

#### Issue: Document Upload Fails
**Error**: `✗ Document upload failed: ...`

**Solution**:
- Verify backend server is running on port 5000
- Check database migrations are applied
- Ensure user has proper permissions

#### Issue: Access Control Tests Fail
**Error**: `✗ Supervisor can see document they should not have access to`

**Solution**:
- Verify access control implementation is active
- Check workflow stage assignments
- Review documentAccess.js utility

#### Issue: Workflow Assignment Fails
**Error**: `⚠ Stage assignment failed: ...`

**Solution**:
- Ensure admin or authority user is logged in
- Verify workflow stage exists
- Check user has correct role for assignment

## Manual Testing

For manual testing, use these sample credentials:

### Personnel
- **Email**: personnel1@pnp.gov.ph
- **Password**: personnel123
- **Can**: Upload documents, view own documents

### Supervisor
- **Email**: supervisor1@pnp.gov.ph
- **Password**: supervisor123
- **Can**: View assigned documents, upload signed versions

### Unit Commander
- **Email**: unitcommander1@pnp.gov.ph
- **Password**: commander123
- **Can**: View assigned documents, approve/reject

### Provincial Director
- **Email**: provincialdirector@pnp.gov.ph
- **Password**: director123
- **Can**: View assigned documents, final approval

### Admin
- **Email**: admin@pnp.gov.ph
- **Password**: admin123
- **Can**: Full system access

## Test Workflow Example

1. **Personnel uploads document**
   - Creates Investigation Report
   - Gets tracking number: PNP-2024-INV-0001
   - Workflow stages created automatically

2. **Admin assigns stages**
   - Assigns Stage 1 to Supervisor
   - Assigns Stage 2 to Unit Commander
   - Assigns Stage 3 to Provincial Director

3. **Supervisor reviews**
   - Downloads document
   - Signs document offline
   - Uploads signed version
   - Stage auto-completes

4. **Workflow progresses**
   - Document moves to next stage
   - Unit Commander receives notification
   - Process repeats until completion

## Continuous Integration

For CI/CD pipelines, run tests with:

```bash
# Set API URL if different
export API_URL=http://localhost:5000/api
npm test
```

Exit code:
- `0` = All tests passed
- `1` = Some tests failed

## Troubleshooting

### Backend Not Running
```bash
# Start backend
cd backend
npm run dev
```

### Database Issues
```bash
# Reset database (WARNING: Deletes all data)
npm run init-db
npm run migrate-pnp
npm run migrate-versioning
npm run seed-users
```

### Port Already in Use
```bash
# Stop processes on port 5000
npm run stop
```

## Next Steps

After tests pass:
1. Review any warnings
2. Test manual workflows in frontend
3. Verify access control in production-like scenarios
4. Test with multiple concurrent users
5. Load test with multiple documents

## Test Maintenance

When adding new features:
1. Add corresponding test cases
2. Update test coverage documentation
3. Ensure backward compatibility
4. Test edge cases

---

**Last Updated**: 2024
**Test Suite Version**: 1.0
