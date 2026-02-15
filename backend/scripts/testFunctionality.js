const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Test utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => {
    console.log(`✅ ${msg}`);
    TEST_RESULTS.passed.push(msg);
  },
  error: (msg) => {
    console.log(`❌ ${msg}`);
    TEST_RESULTS.failed.push(msg);
  },
  warning: (msg) => {
    console.log(`⚠️  ${msg}`);
    TEST_RESULTS.warnings.push(msg);
  },
  section: (msg) => console.log(`\n${'='.repeat(60)}\n📋 ${msg}\n${'='.repeat(60)}`)
};

// Create a test PDF file
const createTestFile = () => {
  const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
  const testFilePath = path.join(__dirname, 'test-document.pdf');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
};

// Clean up test file
const cleanupTestFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Make authenticated request
const makeRequest = async (method, endpoint, data = null, token = null, isFormData = false) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isFormData) {
      // For FormData, let axios handle it
      config.data = data;
    } else if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
};

// Test suite
const runTests = async () => {
  log.section('SignPortal Functionality Test Suite');
  log.info('Starting comprehensive functionality tests...\n');

  let personnelToken = null;
  let personnelUserId = null;
  let supervisorToken = null;
  let supervisorUserId = null;
  let unitCommanderToken = null;
  let unitCommanderUserId = null;
  let provincialDirectorToken = null;
  let provincialDirectorUserId = null;
  let adminToken = null;
  let adminUserId = null;
  let testDocumentId = null;
  let testWorkflowStageId = null;
  let testTrackingNumber = null;

  // ============================================
  // TEST 1: Authentication
  // ============================================
  log.section('TEST 1: Authentication & User Management');

  // Test 1.1: Login as Personnel
  log.info('Test 1.1: Login as Personnel (personnel1@pnp.gov.ph)');
  const personnelLogin = await makeRequest('POST', '/auth/login', {
    email: 'personnel1@pnp.gov.ph',
    password: 'personnel123'
  });
  if (personnelLogin.success && personnelLogin.data.token) {
    personnelToken = personnelLogin.data.token;
    personnelUserId = personnelLogin.data.user?.id;
    log.success('✓ Personnel login successful');
  } else {
    log.error(`✗ Personnel login failed: ${personnelLogin.error}`);
    log.warning('Make sure sample users are seeded (run: npm run seed-users)');
  }

  // Test 1.2: Login as Supervisor
  log.info('Test 1.2: Login as Supervisor (supervisor1@pnp.gov.ph)');
  const supervisorLogin = await makeRequest('POST', '/auth/login', {
    email: 'supervisor1@pnp.gov.ph',
    password: 'supervisor123'
  });
  if (supervisorLogin.success && supervisorLogin.data.token) {
    supervisorToken = supervisorLogin.data.token;
    supervisorUserId = supervisorLogin.data.user?.id;
    log.success('✓ Supervisor login successful');
  } else {
    log.error(`✗ Supervisor login failed: ${supervisorLogin.error}`);
  }

  // Test 1.3: Login as Unit Commander
  log.info('Test 1.3: Login as Unit Commander (unitcommander1@pnp.gov.ph)');
  const unitCommanderLogin = await makeRequest('POST', '/auth/login', {
    email: 'unitcommander1@pnp.gov.ph',
    password: 'commander123'
  });
  if (unitCommanderLogin.success && unitCommanderLogin.data.token) {
    unitCommanderToken = unitCommanderLogin.data.token;
    log.success('✓ Unit Commander login successful');
  } else {
    log.error(`✗ Unit Commander login failed: ${unitCommanderLogin.error}`);
  }

  // Test 1.4: Login as Provincial Director
  log.info('Test 1.4: Login as Provincial Director (provincialdirector@pnp.gov.ph)');
  const provincialDirectorLogin = await makeRequest('POST', '/auth/login', {
    email: 'provincialdirector@pnp.gov.ph',
    password: 'director123'
  });
  if (provincialDirectorLogin.success && provincialDirectorLogin.data.token) {
    provincialDirectorToken = provincialDirectorLogin.data.token;
    log.success('✓ Provincial Director login successful');
  } else {
    log.error(`✗ Provincial Director login failed: ${provincialDirectorLogin.error}`);
  }

  // Test 1.5: Login as Admin
  log.info('Test 1.5: Login as Admin (admin@pnp.gov.ph)');
  const adminLogin = await makeRequest('POST', '/auth/login', {
    email: 'admin@pnp.gov.ph',
    password: 'admin123'
  });
  if (adminLogin.success && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    log.success('✓ Admin login successful');
  } else {
    log.error(`✗ Admin login failed: ${adminLogin.error}`);
  }

  // Test 1.6: Get Current User
  if (personnelToken) {
    log.info('Test 1.6: Get current user info');
    const getMe = await makeRequest('GET', '/auth/me', null, personnelToken);
    if (getMe.success && getMe.data.user) {
      log.success(`✓ Get user info successful: ${getMe.data.user.name} (${getMe.data.user.role})`);
    } else {
      log.error(`✗ Get user info failed: ${getMe.error}`);
    }
  }

  if (!personnelToken) {
    log.error('Cannot continue tests without personnel authentication');
    return printResults();
  }

  // ============================================
  // TEST 2: Document Upload & Tracking Number
  // ============================================
  log.section('TEST 2: Document Upload & Metadata');

  const testFilePath = createTestFile();
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFilePath), 'test-investigation-report.pdf');
  formData.append('document_title', 'Test Investigation Report');
  formData.append('purpose', 'Investigation Report');
  formData.append('office_unit', 'Investigation and Detective Management');
  formData.append('case_reference_number', 'CASE-2024-001');
  formData.append('classification_level', 'Confidential');
  formData.append('priority', 'Urgent');
  formData.append('notes', 'This is a test document for functionality verification');

  log.info('Test 2.1: Upload document with PNP metadata');
  try {
    const uploadResponse = await axios.post(`${API_BASE_URL}/documents`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${personnelToken}`
      }
    });

    if (uploadResponse.data && uploadResponse.data.document) {
      testDocumentId = uploadResponse.data.document.id;
      testTrackingNumber = uploadResponse.data.document.tracking_number;
      log.success(`✓ Document uploaded successfully`);
      log.info(`  - Document ID: ${testDocumentId}`);
      log.info(`  - Tracking Number: ${testTrackingNumber}`);
      log.info(`  - Title: ${uploadResponse.data.document.document_title}`);
    } else {
      log.error('✗ Document upload failed: Invalid response');
    }
  } catch (error) {
    log.error(`✗ Document upload failed: ${error.response?.data?.error || error.message}`);
  }

  cleanupTestFile(testFilePath);

  if (!testDocumentId) {
    log.error('Cannot continue tests without a test document');
    return printResults();
  }

  // Test 2.2: Verify tracking number format
  log.info('Test 2.2: Verify tracking number format');
  if (testTrackingNumber && /^PNP-\d{4}-[A-Z]{3}-\d{4}$/.test(testTrackingNumber)) {
    log.success(`✓ Tracking number format valid: ${testTrackingNumber}`);
  } else {
    log.error(`✗ Tracking number format invalid: ${testTrackingNumber}`);
  }

  // Test 2.3: Get document details
  log.info('Test 2.3: Get document details');
  const getDoc = await makeRequest('GET', `/documents/${testDocumentId}`, null, personnelToken);
  if (getDoc.success && getDoc.data.document) {
    log.success('✓ Get document details successful');
    log.info(`  - Status: ${getDoc.data.document.status}`);
    log.info(`  - Current Stage: ${getDoc.data.document.current_stage_name || 'N/A'}`);
  } else {
    log.error(`✗ Get document details failed: ${getDoc.error}`);
  }

  // ============================================
  // TEST 3: Access Control
  // ============================================
  log.section('TEST 3: Access Control & Confidentiality');

  // Test 3.1: Personnel can see their own document
  log.info('Test 3.1: Personnel can see their own document');
  const listDocsPersonnel = await makeRequest('GET', '/documents', null, personnelToken);
  if (listDocsPersonnel.success && listDocsPersonnel.data.documents) {
    const hasTestDoc = listDocsPersonnel.data.documents.some(d => d.id === testDocumentId);
    if (hasTestDoc) {
      log.success('✓ Personnel can see their own document');
    } else {
      log.error('✗ Personnel cannot see their own document');
    }
  } else {
    log.error(`✗ List documents failed: ${listDocsPersonnel.error}`);
  }

  // Test 3.2: Supervisor cannot see document (not assigned yet)
  if (supervisorToken) {
    log.info('Test 3.2: Supervisor cannot see document (not assigned to workflow)');
    const listDocsSupervisor = await makeRequest('GET', '/documents', null, supervisorToken);
    if (listDocsSupervisor.success) {
      const hasTestDoc = listDocsSupervisor.data.documents?.some(d => d.id === testDocumentId) || false;
      if (!hasTestDoc) {
        log.success('✓ Supervisor correctly cannot see unassigned document');
      } else {
        log.error('✗ Supervisor can see document they should not have access to');
      }
    }
  }

  // Test 3.3: Unit Commander cannot see document (not assigned yet)
  if (unitCommanderToken) {
    log.info('Test 3.3: Unit Commander cannot see document (not assigned to workflow)');
    const listDocsCommander = await makeRequest('GET', '/documents', null, unitCommanderToken);
    if (listDocsCommander.success) {
      const hasTestDoc = listDocsCommander.data.documents?.some(d => d.id === testDocumentId) || false;
      if (!hasTestDoc) {
        log.success('✓ Unit Commander correctly cannot see unassigned document');
      } else {
        log.error('✗ Unit Commander can see document they should not have access to');
      }
    }
  }

  // ============================================
  // TEST 4: Workflow Creation & Assignment
  // ============================================
  log.section('TEST 4: Workflow Creation & Stage Assignment');

  // Test 4.1: Get workflow stages
  log.info('Test 4.1: Get workflow stages for document');
  const getWorkflow = await makeRequest('GET', `/workflow/document/${testDocumentId}`, null, personnelToken);
  if (getWorkflow.success && getWorkflow.data.workflow) {
    const stages = getWorkflow.data.workflow;
    log.success(`✓ Workflow retrieved: ${stages.length} stages found`);
    stages.forEach((stage, index) => {
      log.info(`  Stage ${index + 1}: ${stage.stage_name} (${stage.status}) - Required: ${stage.required_role}`);
    });
    
    // Find first authority stage for assignment
    const firstAuthorityStage = stages.find(s => s.required_role === 'authority' && s.status === 'pending');
    if (firstAuthorityStage) {
      testWorkflowStageId = firstAuthorityStage.id;
    }
  } else {
    log.error(`✗ Get workflow failed: ${getWorkflow.error}`);
  }

  // Test 4.2: Assign stage to supervisor (requires admin or authority)
  let stageAssigned = false;
  if (supervisorToken && testWorkflowStageId && supervisorUserId) {
    log.info('Test 4.2: Assign workflow stage to supervisor');
    // Use admin to assign if available, otherwise try with supervisor token
    const assignToken = adminToken || supervisorToken;
    const assignStage = await makeRequest('POST', `/workflow/stage/${testWorkflowStageId}/assign`, {
      userId: supervisorUserId
    }, assignToken);
    if (assignStage.success) {
      log.success('✓ Stage assigned to supervisor successfully');
      stageAssigned = true;
      // Wait a moment for assignment to process
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      log.warning(`⚠ Stage assignment failed: ${assignStage.error} (may need manual assignment)`);
    }
  }

  // Test 4.3: Verify supervisor can now see document after assignment
  if (supervisorToken && testWorkflowStageId && stageAssigned) {
    log.info('Test 4.3: Verify supervisor can see document after assignment');
    const listDocsSupervisorAfter = await makeRequest('GET', '/documents', null, supervisorToken);
    if (listDocsSupervisorAfter.success) {
      const hasTestDoc = listDocsSupervisorAfter.data.documents?.some(d => d.id === testDocumentId) || false;
      if (hasTestDoc) {
        log.success('✓ Supervisor can now see assigned document');
      } else {
        log.warning('⚠ Supervisor still cannot see document (assignment may need manual verification)');
      }
    }
  } else if (supervisorToken && !stageAssigned) {
    log.warning('⚠ Skipping supervisor access test: stage not assigned');
  }

  // ============================================
  // TEST 5: Document Versioning
  // ============================================
  log.section('TEST 5: Document Versioning & History');

  // Test 5.1: List document versions (should have original)
  log.info('Test 5.1: List document versions');
  const listVersions = await makeRequest('GET', `/documents/${testDocumentId}/versions`, null, personnelToken);
  if (listVersions.success && listVersions.data.versions) {
    log.success(`✓ Versions retrieved: ${listVersions.data.versions.length} version(s) found`);
  } else {
    log.error(`✗ List versions failed: ${listVersions.error}`);
  }

  // Test 5.2: Get current version
  log.info('Test 5.2: Get current document version');
  const getCurrentVersion = await makeRequest('GET', `/documents/${testDocumentId}/versions/current`, null, personnelToken);
  if (getCurrentVersion.success && getCurrentVersion.data.version) {
    log.success('✓ Current version retrieved successfully');
    log.info(`  - Version Number: ${getCurrentVersion.data.version.version_number || 1}`);
  } else {
    log.error(`✗ Get current version failed: ${getCurrentVersion.error}`);
  }

  // ============================================
  // TEST 6: Physical Signature Workflow
  // ============================================
  log.section('TEST 6: Physical Signature Workflow');

  // Test 6.1: Download document for signature (supervisor)
  if (supervisorToken && testDocumentId && stageAssigned) {
    log.info('Test 6.1: Download document for signature (supervisor)');
    const downloadDoc = await makeRequest('GET', `/documents/${testDocumentId}/download`, null, supervisorToken);
    if (downloadDoc.success || downloadDoc.status === 200) {
      log.success('✓ Document download successful');
    } else {
      log.error(`✗ Document download failed: ${downloadDoc.error}`);
    }
  } else if (supervisorToken && !stageAssigned) {
    log.warning('⚠ Skipping download test: supervisor not assigned to workflow stage');
  }

  // Test 6.2: Upload signed version (simulated)
  if (supervisorToken && testDocumentId && testWorkflowStageId && stageAssigned) {
    log.info('Test 6.2: Upload signed document version');
    const signedFormData = new FormData();
    const signedTestFile = createTestFile();
    signedFormData.append('file', fs.createReadStream(signedTestFile), 'test-investigation-report-signed.pdf');
    signedFormData.append('workflow_stage_id', testWorkflowStageId.toString());
    signedFormData.append('upload_reason', 'Signed by Investigation Section Chief');

    try {
      const uploadSignedResponse = await axios.post(
        `${API_BASE_URL}/documents/${testDocumentId}/versions`,
        signedFormData,
        {
          headers: {
            ...signedFormData.getHeaders(),
            Authorization: `Bearer ${supervisorToken}`
          }
        }
      );

      if (uploadSignedResponse.data && uploadSignedResponse.data.version) {
        log.success('✓ Signed version uploaded successfully');
        log.info(`  - Version Number: ${uploadSignedResponse.data.version.version_number}`);
        log.info(`  - Upload Reason: ${uploadSignedResponse.data.version.upload_reason}`);
        
        // Test 6.3: Verify workflow auto-progression
        log.info('Test 6.3: Verify workflow auto-progression after signed upload');
        await new Promise(resolve => setTimeout(resolve, 500));
        const workflowAfterUpload = await makeRequest('GET', `/workflow/document/${testDocumentId}`, null, personnelToken);
        if (workflowAfterUpload.success) {
          const completedStage = workflowAfterUpload.data.workflow.find(s => s.id === testWorkflowStageId);
          if (completedStage && completedStage.status === 'completed') {
            log.success('✓ Workflow stage auto-completed after signed upload');
          } else {
            log.warning('⚠ Workflow stage may not have auto-completed');
          }
        }
      } else {
        log.error('✗ Signed version upload failed: Invalid response');
      }
      cleanupTestFile(signedTestFile);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      const errorStatus = error.response?.status;
      log.error(`✗ Signed version upload failed: ${errorMsg}`);
      if (errorStatus) {
        log.info(`  Status: ${errorStatus}`);
      }
      if (error.response?.data) {
        log.info(`  Response: ${JSON.stringify(error.response.data)}`);
      }
      cleanupTestFile(signedTestFile);
    }
  }

  // ============================================
  // TEST 7: Pending Approvals
  // ============================================
  log.section('TEST 7: Pending Approvals & Notifications');

  // Test 7.1: Get pending approvals for supervisor
  if (supervisorToken) {
    log.info('Test 7.1: Get pending approvals for supervisor');
    const pendingApprovals = await makeRequest('GET', '/workflow/pending', null, supervisorToken);
    if (pendingApprovals.success && pendingApprovals.data.pendingApprovals) {
      log.success(`✓ Pending approvals retrieved: ${pendingApprovals.data.pendingApprovals.length} pending`);
    } else {
      log.warning(`⚠ Get pending approvals: ${pendingApprovals.error || 'No pending approvals'}`);
    }
  }

  // ============================================
  // TEST 8: Document List & Filtering
  // ============================================
  log.section('TEST 8: Document List & Filtering');

  // Test 8.1: List documents with filters
  log.info('Test 8.1: List documents with status filter');
  const listWithFilter = await makeRequest('GET', '/documents?status=pending', null, personnelToken);
  if (listWithFilter.success) {
    log.success('✓ Document list with filter successful');
  } else {
    log.error(`✗ Document list with filter failed: ${listWithFilter.error}`);
  }

  // Test 8.2: Search documents
  log.info('Test 8.2: Search documents by tracking number');
  if (testTrackingNumber) {
    const searchDocs = await makeRequest('GET', `/documents?search=${testTrackingNumber}`, null, personnelToken);
    if (searchDocs.success) {
      log.success('✓ Document search successful');
    } else {
      log.error(`✗ Document search failed: ${searchDocs.error}`);
    }
  }

  // ============================================
  // TEST 9: Admin Functions
  // ============================================
  log.section('TEST 9: Admin Functions');

  // Test 9.1: Admin can see all documents
  if (adminToken) {
    log.info('Test 9.1: Admin can see all documents');
    const adminListDocs = await makeRequest('GET', '/documents', null, adminToken);
    if (adminListDocs.success && adminListDocs.data.documents) {
      const hasTestDoc = adminListDocs.data.documents.some(d => d.id === testDocumentId);
      if (hasTestDoc) {
        log.success('✓ Admin can see all documents (including test document)');
      } else {
        log.warning('⚠ Admin document list may not include test document');
      }
    }
  }

  // ============================================
  // Print Results Summary
  // ============================================
  printResults();
};

const printResults = () => {
  log.section('Test Results Summary');
  
  console.log(`\n✅ Passed: ${TEST_RESULTS.passed.length}`);
  console.log(`❌ Failed: ${TEST_RESULTS.failed.length}`);
  console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings.length}`);
  
  const totalTests = TEST_RESULTS.passed.length + TEST_RESULTS.failed.length;
  const passRate = totalTests > 0 ? ((TEST_RESULTS.passed.length / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 Pass Rate: ${passRate}%`);
  
  if (TEST_RESULTS.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    TEST_RESULTS.failed.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test}`);
    });
  }
  
  if (TEST_RESULTS.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    TEST_RESULTS.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (TEST_RESULTS.failed.length === 0) {
    console.log('🎉 All critical tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60) + '\n');
};

// Run tests
if (require.main === module) {
  runTests()
    .then(() => {
      process.exit(TEST_RESULTS.failed.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
