const multer = require('multer');

// Configure multer for memory storage (we'll store in database)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept all file types for now (can be restricted later)
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper to get file extension
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Helper to detect file type
const detectFileType = (filename, mimetype) => {
  const extension = getFileExtension(filename);
  const mimeMap = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  
  return mimeMap[extension] || mimetype || 'application/octet-stream';
};

module.exports = {
  upload,
  getFileExtension,
  detectFileType
};
