// PNP Organizational Structure and Unit Hierarchy
// Maps units to their approval chains and escalation paths

const unitHierarchy = {
  // Regional Level
  'Regional Office': {
    level: 'regional',
    parent: null,
    approvalChain: ['Regional Director', 'Deputy Regional Director'],
    escalationPath: ['Regional Director']
  },
  
  // Provincial Level
  'Provincial Office': {
    level: 'provincial',
    parent: 'Regional Office',
    approvalChain: ['Provincial Director', 'Deputy Provincial Director', 'Regional Director'],
    escalationPath: ['Provincial Director', 'Regional Director']
  },
  
  // City/Municipal Level
  'City Police Station': {
    level: 'city',
    parent: 'Provincial Office',
    approvalChain: ['City Chief of Police', 'Provincial Director', 'Regional Director'],
    escalationPath: ['City Chief of Police', 'Provincial Director']
  },
  'Municipal Police Station': {
    level: 'municipal',
    parent: 'Provincial Office',
    approvalChain: ['Municipal Chief of Police', 'Provincial Director', 'Regional Director'],
    escalationPath: ['Municipal Chief of Police', 'Provincial Director']
  },
  
  // Divisions
  'Investigation and Detective Management': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['IDM Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['IDM Chief', 'Unit Commander']
  },
  'Intelligence Division': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['Intelligence Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['Intelligence Chief', 'Unit Commander']
  },
  'Human Resource and Doctrine': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['HRD Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['HRD Chief', 'Unit Commander']
  },
  'Logistics': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['Logistics Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['Logistics Chief', 'Unit Commander']
  },
  'Finance': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['Finance Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['Finance Chief', 'Unit Commander']
  },
  'Operations': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['Operations Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['Operations Chief', 'Unit Commander']
  },
  'Legal Division': {
    level: 'division',
    parent: 'Provincial Office',
    approvalChain: ['Legal Chief', 'Unit Commander', 'Provincial Director'],
    escalationPath: ['Legal Chief', 'Unit Commander']
  }
};

// Get unit hierarchy information
const getUnitHierarchy = (unitName) => {
  return unitHierarchy[unitName] || null;
};

// Get parent unit
const getParentUnit = (unitName) => {
  const unit = getUnitHierarchy(unitName);
  return unit ? unit.parent : null;
};

// Get approval chain for a unit
const getApprovalChain = (unitName) => {
  const unit = getUnitHierarchy(unitName);
  return unit ? unit.approvalChain : [];
};

// Get escalation path for a unit
const getEscalationPath = (unitName) => {
  const unit = getUnitHierarchy(unitName);
  return unit ? unit.escalationPath : [];
};

// Get all available units
const getAvailableUnits = () => {
  return Object.keys(unitHierarchy);
};

// Get units by level
const getUnitsByLevel = (level) => {
  return Object.keys(unitHierarchy).filter(
    unit => unitHierarchy[unit].level === level
  );
};

module.exports = {
  unitHierarchy,
  getUnitHierarchy,
  getParentUnit,
  getApprovalChain,
  getEscalationPath,
  getAvailableUnits,
  getUnitsByLevel
};
