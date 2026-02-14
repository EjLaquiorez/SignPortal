// Workflow templates based on document purpose
// Maps document purposes to required approval stages

const workflowTemplates = {
  'Investigation Report': [
    { stage_name: 'Police Staff Review', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Provincial Director Review', stage_order: 3, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Regional Director Final Approval', stage_order: 4, required_role: 'authority', requires_signed_upload: true }
  ],
  'Incident Report': [
    { stage_name: 'Police Staff Review', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Provincial Director Final Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true }
  ],
  'Intelligence Report': [
    { stage_name: 'Police Staff Review', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Intelligence Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Provincial Director Review', stage_order: 4, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Regional Director Final Approval', stage_order: 5, required_role: 'authority', requires_signed_upload: true }
  ],
  'Administrative Request': [
    { stage_name: 'Police Staff Submission', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'HR Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true }
  ],
  'Financial Request': [
    { stage_name: 'Police Staff Submission', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Finance Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Provincial Director Final Approval', stage_order: 4, required_role: 'authority', requires_signed_upload: true }
  ],
  'Procurement Documents': [
    { stage_name: 'Police Staff Submission', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Logistics Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Finance Division Review', stage_order: 3, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 4, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Provincial Director Final Approval', stage_order: 5, required_role: 'authority', requires_signed_upload: true }
  ],
  'Legal Documents': [
    { stage_name: 'Police Staff Submission', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Legal Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Provincial Director Final Approval', stage_order: 4, required_role: 'authority', requires_signed_upload: true }
  ],
  'Personnel Records': [
    { stage_name: 'Police Staff Submission', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'HR Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true }
  ],
  'Case Follow-up': [
    { stage_name: 'Police Staff Review', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Investigation Division Review', stage_order: 2, required_role: 'authority', requires_signed_upload: true },
    { stage_name: 'Unit Commander Approval', stage_order: 3, required_role: 'authority', requires_signed_upload: true }
  ],
  // Default template for unknown purposes
  'default': [
    { stage_name: 'Personnel Sign', stage_order: 1, required_role: 'personnel', requires_signed_upload: true },
    { stage_name: 'Authority Confirm', stage_order: 2, required_role: 'authority', requires_signed_upload: true }
  ]
};

// Get workflow template for a given purpose
const getWorkflowTemplate = (purpose) => {
  return workflowTemplates[purpose] || workflowTemplates['default'];
};

// Get all available purposes
const getAvailablePurposes = () => {
  return Object.keys(workflowTemplates).filter(key => key !== 'default');
};

module.exports = {
  workflowTemplates,
  getWorkflowTemplate,
  getAvailablePurposes
};
