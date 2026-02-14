const { queryOne } = require('./dbHelper');

// Generate unique tracking number in format: PNP-YYYY-TYPE-####
// Example: PNP-2026-INV-0001
const generateTrackingNumber = async (purpose) => {
  try {
    const year = new Date().getFullYear();
    
    // Map purpose to abbreviation
    const purposeMap = {
      'Investigation Report': 'INV',
      'Incident Report': 'INC',
      'Intelligence Report': 'INT',
      'Administrative Request': 'ADM',
      'Financial Request': 'FIN',
      'Procurement Documents': 'PRO',
      'Legal Documents': 'LEG',
      'Personnel Records': 'PER',
      'Case Follow-up': 'CAS'
    };
    
    const prefix = purposeMap[purpose] || 'DOC';
    const baseNumber = `PNP-${year}-${prefix}`;
    
    // Get the highest sequence number for this prefix and year
    const result = await queryOne(
      `SELECT tracking_number FROM documents 
       WHERE tracking_number LIKE ? 
       ORDER BY tracking_number DESC 
       LIMIT 1`,
      [`${baseNumber}-%`]
    );
    
    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].tracking_number;
      const lastSequence = parseInt(lastNumber.split('-').pop());
      sequence = lastSequence + 1;
    }
    
    // Format sequence as 4-digit number with leading zeros
    const sequenceStr = sequence.toString().padStart(4, '0');
    
    return `${baseNumber}-${sequenceStr}`;
  } catch (error) {
    console.error('Error generating tracking number:', error);
    // Fallback: use timestamp-based number
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `PNP-${year}-DOC-${timestamp}`;
  }
};

module.exports = {
  generateTrackingNumber
};
