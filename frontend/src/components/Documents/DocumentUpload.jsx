import { useState } from 'react';
import { documentsAPI } from '../../services/api';

const PURPOSE_OPTIONS = [
  'Investigation Report',
  'Incident Report',
  'Intelligence Report',
  'Administrative Request',
  'Financial Request',
  'Procurement Documents',
  'Legal Documents',
  'Personnel Records',
  'Case Follow-up'
];

const UNIT_OPTIONS = [
  'Regional Office',
  'Provincial Office',
  'City Police Station',
  'Municipal Police Station',
  'Investigation and Detective Management',
  'Intelligence Division',
  'Human Resource and Doctrine',
  'Logistics',
  'Finance',
  'Operations',
  'Legal Division'
];

const CLASSIFICATION_OPTIONS = [
  'For Official Use Only',
  'Restricted',
  'Confidential',
  'Secret'
];

const PRIORITY_OPTIONS = [
  'Routine',
  'Urgent',
  'Priority',
  'Emergency'
];

const DocumentUpload = ({ onUploadSuccess, onFileSelect }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // PNP metadata fields
  const [documentTitle, setDocumentTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [officeUnit, setOfficeUnit] = useState('');
  const [caseReferenceNumber, setCaseReferenceNumber] = useState('');
  const [classificationLevel, setClassificationLevel] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        setFile(null);
        setFilePreview(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
      
      // Create preview for images and PDFs
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
          if (onFileSelect) {
            onFileSelect({ file: selectedFile, preview: reader.result, type: 'image' });
          }
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
          if (onFileSelect) {
            onFileSelect({ file: selectedFile, preview: reader.result, type: 'pdf' });
          }
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
        if (onFileSelect) {
          onFileSelect({ file: selectedFile, preview: null, type: 'other' });
        }
      }
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (onFileSelect) {
      onFileSelect(null);
    }
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📊',
      'pptx': '📊',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'txt': '📄',
      'zip': '📦',
      'rar': '📦'
    };
    return iconMap[extension] || '📎';
  };

  const handleAttachmentsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      setError('Some files exceed 50MB limit and were not added');
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
    setError('');
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!file) {
      setError('Please select a main document file');
      return;
    }
    if (!documentTitle || !documentTitle.trim()) {
      setError('Document title is required');
      return;
    }
    if (!purpose) {
      setError('Purpose is required');
      return;
    }
    if (!officeUnit) {
      setError('Office/Unit is required');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      // Create FormData with file and metadata
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_title', documentTitle.trim());
      formData.append('purpose', purpose);
      formData.append('office_unit', officeUnit);
      if (caseReferenceNumber) formData.append('case_reference_number', caseReferenceNumber.trim());
      if (classificationLevel) formData.append('classification_level', classificationLevel);
      formData.append('priority', priority);
      if (deadline) formData.append('deadline', deadline);
      if (notes) formData.append('notes', notes.trim());

      const response = await documentsAPI.upload(formData);
      
      // Upload attachments if any
      if (attachments.length > 0 && response.data?.document?.id) {
        for (const attachment of attachments) {
          const attachmentFormData = new FormData();
          attachmentFormData.append('file', attachment);
          await documentsAPI.uploadAttachment(response.data.document.id, attachmentFormData);
        }
      }

      setSuccess(true);
      // Reset form
      setFile(null);
      setFilePreview(null);
      setAttachments([]);
      setDocumentTitle('');
      setPurpose('');
      setOfficeUnit('');
      setCaseReferenceNumber('');
      setClassificationLevel('');
      setPriority('Routine');
      setDeadline('');
      setNotes('');
      e.target.reset();
      
      // Clear preview in parent component
      if (onFileSelect) {
        onFileSelect(null);
      }
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Upload Document</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Document Title */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Document Title <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            required
            style={styles.input}
            placeholder="Enter document title"
            disabled={uploading}
          />
        </div>

        {/* Purpose */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Purpose <span style={styles.required}>*</span>
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            style={styles.select}
            disabled={uploading}
          >
            <option value="">Select purpose</option>
            {PURPOSE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Office/Unit */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Office/Unit/Division <span style={styles.required}>*</span>
          </label>
          <select
            value={officeUnit}
            onChange={(e) => setOfficeUnit(e.target.value)}
            required
            style={styles.select}
            disabled={uploading}
          >
            <option value="">Select office/unit</option>
            {UNIT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Case Reference Number */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Case/Reference Number</label>
          <input
            type="text"
            value={caseReferenceNumber}
            onChange={(e) => setCaseReferenceNumber(e.target.value)}
            style={styles.input}
            placeholder="Enter case or reference number"
            disabled={uploading}
          />
        </div>

        {/* Classification Level */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Classification Level</label>
          <select
            value={classificationLevel}
            onChange={(e) => setClassificationLevel(e.target.value)}
            style={styles.select}
            disabled={uploading}
          >
            <option value="">Select classification</option>
            {CLASSIFICATION_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={styles.select}
            disabled={uploading}
          >
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Deadline */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={styles.input}
            disabled={uploading}
          />
        </div>

        {/* Notes */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Notes/Remarks</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            placeholder="Additional remarks or notes"
            rows={4}
            disabled={uploading}
          />
        </div>

        {/* Main Document File */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Main Document <span style={styles.required}>*</span>
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            style={styles.fileInput}
            disabled={uploading}
            required
          />
          {file && (
            <div style={styles.filePreviewContainer}>
              <div style={styles.filePreviewHeader}>
                <div style={styles.filePreviewInfo}>
                  <span style={styles.fileIcon}>{getFileIcon(file.name)}</span>
                  <div style={styles.fileDetails}>
                    <div style={styles.fileName}>{file.name}</div>
                    <div style={styles.fileMeta}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  style={styles.removeFileButton}
                  disabled={uploading}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
              {filePreview && (
                <div style={styles.imagePreview}>
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    style={styles.previewImage}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Supporting Attachments (Optional)</label>
          <input
            type="file"
            onChange={handleAttachmentsChange}
            style={styles.fileInput}
            disabled={uploading}
            multiple
          />
          {attachments.length > 0 && (
            <div style={styles.attachmentsList}>
              {attachments.map((att, index) => (
                <div key={index} style={styles.attachmentItem}>
                  <span>{att.name}</span>
                  <span style={styles.fileSize}>
                    ({(att.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    style={styles.removeButton}
                    disabled={uploading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !documentTitle || !purpose || !officeUnit}
          style={{
            ...styles.submitButton,
            ...((uploading || !file || !documentTitle || !purpose || !officeUnit) ? styles.buttonDisabled : {})
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>Document uploaded successfully!</div>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1f2937'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  required: {
    color: '#dc2626'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit'
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease'
  },
  fileInput: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  filePreviewContainer: {
    marginTop: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#f9fafb'
  },
  filePreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  filePreviewInfo: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    flex: 1
  },
  fileIcon: {
    fontSize: '2rem',
    lineHeight: '1'
  },
  fileDetails: {
    flex: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    wordBreak: 'break-word',
    marginBottom: '0.25rem'
  },
  fileMeta: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  removeFileButton: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '1.5rem',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
    flexShrink: 0
  },
  imagePreview: {
    marginTop: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  previewImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    display: 'block'
  },
  filePreviewContainer: {
    marginTop: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#f9fafb'
  },
  filePreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  filePreviewInfo: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    flex: 1
  },
  fileIcon: {
    fontSize: '2rem',
    lineHeight: '1'
  },
  fileDetails: {
    flex: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    wordBreak: 'break-word',
    marginBottom: '0.25rem'
  },
  fileMeta: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  removeFileButton: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '1.5rem',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
    flexShrink: 0
  },
  imagePreview: {
    marginTop: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  previewImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    display: 'block'
  },
  fileInfo: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  fileSize: {
    color: '#9ca3af',
    fontSize: '0.8125rem'
  },
  attachmentsList: {
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    fontSize: '0.875rem'
  },
  removeButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '0 0.5rem'
  },
  submitButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '0.5rem'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    color: '#dc2626',
    fontSize: '0.875rem',
    backgroundColor: '#fef2f2',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #fecaca',
    marginTop: '1rem'
  },
  success: {
    color: '#10b981',
    fontSize: '0.875rem',
    backgroundColor: '#f0fdf4',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #bbf7d0',
    marginTop: '1rem'
  }
};

export default DocumentUpload;
