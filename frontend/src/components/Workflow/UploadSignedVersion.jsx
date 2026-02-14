import { useState } from 'react';
import { documentsAPI } from '../../services/api';

const UploadSignedVersion = ({ documentId, workflowStageId, stageName, onUploadSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadReason, setUploadReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess(false);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('workflow_stage_id', workflowStageId);
      if (uploadReason.trim()) {
        formData.append('upload_reason', uploadReason.trim());
      }

      await documentsAPI.uploadSignedVersion(documentId, formData);

      setSuccess(true);
      setFile(null);
      setFilePreview(null);
      setUploadReason('');
      e.target.reset();

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setTimeout(() => {
        setSuccess(false);
        if (onCancel) {
          onCancel();
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload signed version');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Update Signed Document Version</h3>
      <p style={styles.subtitle}>Stage: {stageName}</p>
      <div style={styles.instructions}>
        <p style={styles.instructionText}>
          <strong>Instructions:</strong>
        </p>
        <ol style={styles.instructionList}>
          <li>Download the current document version</li>
          <li>Get it physically signed by the authorized official</li>
          <li>Upload the signed version here</li>
          <li>Stage will automatically complete and progress to next stage</li>
        </ol>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          ✓ Signed version uploaded successfully! Stage has been automatically completed and workflow will progress to the next stage.
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Signed Document File <span style={styles.required}>*</span>
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            required
            disabled={uploading}
            style={styles.fileInput}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          {file && (
            <div style={styles.fileInfo}>
              <span style={styles.fileName}>{file.name}</span>
              <span style={styles.fileSize}>
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <button
                type="button"
                onClick={removeFile}
                style={styles.removeButton}
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}
          {filePreview && (
            <div style={styles.previewContainer}>
              {file.type.startsWith('image/') ? (
                <img src={filePreview} alt="Preview" style={styles.previewImage} />
              ) : file.type === 'application/pdf' ? (
                <iframe src={filePreview} style={styles.previewPdf} title="PDF Preview" />
              ) : null}
            </div>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Upload Reason / Notes (Optional)
          </label>
          <textarea
            value={uploadReason}
            onChange={(e) => setUploadReason(e.target.value)}
            style={styles.textarea}
            placeholder="e.g., Signed by Unit Commander on [date]"
            disabled={uploading}
            rows={3}
          />
        </div>

        <div style={styles.actions}>
          <button
            type="submit"
            disabled={uploading || !file}
            style={styles.submitButton}
          >
            {uploading ? 'Uploading...' : 'Upload Signed Version'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1rem'
  },
  instructions: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '1.5rem'
  },
  instructionText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '0.5rem',
    marginTop: 0
  },
  instructionList: {
    fontSize: '0.875rem',
    color: '#1e40af',
    margin: 0,
    paddingLeft: '1.5rem',
    lineHeight: '1.75'
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
    color: '#ef4444'
  },
  fileInput: {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    marginTop: '0.5rem'
  },
  fileName: {
    fontSize: '0.875rem',
    color: '#1f2937',
    flex: 1
  },
  fileSize: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  removeButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  previewContainer: {
    marginTop: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
    maxHeight: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    objectFit: 'contain'
  },
  previewPdf: {
    width: '100%',
    height: '300px',
    border: 'none'
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem'
  },
  submitButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  cancelButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca'
  },
  success: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    border: '1px solid #bbf7d0'
  }
};

export default UploadSignedVersion;
