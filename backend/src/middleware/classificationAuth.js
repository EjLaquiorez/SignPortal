const { queryOne } = require('../utils/dbHelper');

// Middleware to check classification level access
const checkClassificationAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userUnit = req.user.unit;

    // Get document classification
    const docResult = await queryOne(
      'SELECT classification_level, office_unit, uploaded_by FROM documents WHERE id = ?',
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];
    const classification = document.classification_level;
    const docUnit = document.office_unit;

    // Admin can access all documents
    if (userRole === 'admin') {
      return next();
    }

    // Owner can always access their own documents
    if (document.uploaded_by === userId) {
      return next();
    }

    // Classification-based access control
    if (classification) {
      switch (classification) {
        case 'Secret':
          // Only admin and same unit authority can access Secret documents
          if (userRole !== 'authority' || docUnit !== userUnit) {
            return res.status(403).json({ 
              error: 'Access denied: Insufficient clearance level for Secret documents' 
            });
          }
          break;

        case 'Confidential':
          // Authority role and same unit can access
          if (userRole !== 'authority' || docUnit !== userUnit) {
            return res.status(403).json({ 
              error: 'Access denied: Insufficient clearance level for Confidential documents' 
            });
          }
          break;

        case 'Restricted':
          // Authority role can access, or same unit personnel
          if (userRole === 'authority' || (userRole === 'personnel' && docUnit === userUnit)) {
            return next();
          }
          return res.status(403).json({ 
            error: 'Access denied: Insufficient clearance level for Restricted documents' 
          });

        case 'For Official Use Only':
          // All authenticated users can access
          return next();

        default:
          // Unknown classification - allow access (backward compatibility)
          return next();
      }
    } else {
      // No classification - allow access
      return next();
    }

    next();
  } catch (error) {
    console.error('Classification access check error:', error);
    res.status(500).json({ error: 'Access check failed' });
  }
};

// Middleware to check if user has required rank/designation for approval
const checkRankDesignation = (requiredRank = null, requiredDesignation = null) => {
  return async (req, res, next) => {
    try {
      const userRank = req.user.rank;
      const userDesignation = req.user.designation;
      const userRole = req.user.role;

      // Admin bypasses rank/designation checks
      if (userRole === 'admin') {
        return next();
      }

      // Check rank if required
      if (requiredRank && userRank !== requiredRank) {
        return res.status(403).json({ 
          error: `Access denied: Required rank "${requiredRank}" not met. Your rank: ${userRank || 'Not set'}` 
        });
      }

      // Check designation if required
      if (requiredDesignation && userDesignation !== requiredDesignation) {
        return res.status(403).json({ 
          error: `Access denied: Required designation "${requiredDesignation}" not met. Your designation: ${userDesignation || 'Not set'}` 
        });
      }

      next();
    } catch (error) {
      console.error('Rank/designation check error:', error);
      res.status(500).json({ error: 'Access check failed' });
    }
  };
};

// Middleware to check unit-based access
const checkUnitAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userUnit = req.user.unit;
    const userRole = req.user.role;

    // Admin can access all
    if (userRole === 'admin') {
      return next();
    }

    // Get document unit
    const docResult = await queryOne('SELECT office_unit, uploaded_by FROM documents WHERE id = ?', [id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Owner can always access
    if (document.uploaded_by === req.user.id) {
      return next();
    }

    // Check unit match
    if (document.office_unit && document.office_unit !== userUnit) {
      return res.status(403).json({ 
        error: 'Access denied: Document belongs to a different unit' 
      });
    }

    next();
  } catch (error) {
    console.error('Unit access check error:', error);
    res.status(500).json({ error: 'Access check failed' });
  }
};

module.exports = {
  checkClassificationAccess,
  checkRankDesignation,
  checkUnitAccess
};
