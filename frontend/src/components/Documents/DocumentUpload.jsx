import { useState } from 'react';
import { documentsAPI } from '../../services/api';

const DocumentUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      await documentsAPI.upload(file);
      setSuccess(true);
      setFile(null);
      e.target.reset();
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.fileLabel}>
          <input
            type="file"
            onChange={handleFileChange}
            style={styles.fileInput}
            disabled={uploading}
          />
          <span style={styles.fileButton}>
            {file ? file.name : 'Choose File'}
          </span>
        </label>
        <button
          type="submit"
          disabled={uploading || !file}
          style={{
            ...styles.button,
            ...((uploading || !file) ? styles.buttonDisabled : {})
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>Document uploaded successfully</div>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minWidth: '280px'
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  fileInput: {
    position: 'absolute',
    width: '0.1px',
    height: '0.1px',
    opacity: 0,
    overflow: 'hidden',
    zIndex: -1
  },
  fileButton: {
    padding: '0.625rem 1rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
  },
  button: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    color: '#dc2626',
    fontSize: '0.8125rem',
    backgroundColor: '#fef2f2',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #fecaca'
  },
  success: {
    color: '#10b981',
    fontSize: '0.8125rem',
    backgroundColor: '#f0fdf4',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #bbf7d0'
  }
};

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .fileButton:hover {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }
  `;
  document.head.appendChild(style);
}

export default DocumentUpload;
