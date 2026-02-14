import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { signaturesAPI } from '../../services/api';

const SignaturePad = ({ workflowStageId, onSuccess, onCancel }) => {
  const signatureRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('canvas'); // 'canvas' or 'upload'

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSave = async () => {
    if (mode === 'canvas') {
      if (signatureRef.current?.isEmpty()) {
        setError('Please provide a signature by drawing on the canvas');
        return;
      }

      const dataURL = signatureRef.current.toDataURL();
      if (!dataURL || dataURL === 'data:,') {
        setError('Invalid signature data. Please try again.');
        return;
      }

      setUploading(true);
      setError('');

      try {
        await signaturesAPI.create({
          workflowStageId,
          signatureData: dataURL
        });
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to save signature. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await signaturesAPI.create({
        workflowStageId,
        file: file
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload signature');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabs}>
        <button
          onClick={() => setMode('canvas')}
          style={{
            ...styles.tab,
            ...(mode === 'canvas' ? styles.tabActive : {})
          }}
        >
          Draw Signature
        </button>
        <button
          onClick={() => setMode('upload')}
          style={{
            ...styles.tab,
            ...(mode === 'upload' ? styles.tabActive : {})
          }}
        >
          Upload Image
        </button>
      </div>

      {mode === 'canvas' ? (
        <div style={styles.canvasContainer}>
          <div style={styles.canvasWrapper}>
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 500,
                height: 200,
                className: 'signature-canvas'
              }}
              backgroundColor="#ffffff"
            />
          </div>
          <div style={styles.canvasActions}>
            <button onClick={handleClear} style={styles.clearButton}>
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.uploadContainer}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={styles.fileInput}
            disabled={uploading}
          />
          <p style={styles.uploadHint}>Select an image file to upload as your signature</p>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        {mode === 'canvas' && (
          <button
            onClick={handleSave}
            disabled={uploading}
            style={{
              ...styles.saveButton,
              ...(uploading ? styles.buttonDisabled : {})
            }}
          >
            {uploading ? 'Saving...' : 'Save Signature'}
          </button>
        )}
        <button onClick={onCancel} style={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  tabs: {
    display: 'flex',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0'
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
    flex: 1,
    transition: 'all 0.2s ease'
  },
  tabActive: {
    borderBottomColor: '#2563eb',
    color: '#2563eb',
    fontWeight: '600'
  },
  canvasContainer: {
    marginBottom: '1.5rem'
  },
  canvasWrapper: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '0.5rem',
    backgroundColor: '#fff',
    overflow: 'auto',
    marginBottom: '0.75rem'
  },
  canvasActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  uploadContainer: {
    padding: '2rem',
    textAlign: 'center',
    border: '1px dashed #e2e8f0',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    backgroundColor: '#f8fafc'
  },
  fileInput: {
    marginBottom: '1rem',
    width: '100%',
    maxWidth: '300px',
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  uploadHint: {
    color: '#64748b',
    fontSize: '0.875rem'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap'
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  }
};

// Add responsive styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .container {
        padding: 1rem !important;
      }
      .tab {
        padding: 0.5rem 1rem !important;
        font-size: 0.8125rem !important;
      }
      .actions {
        flex-direction: column !important;
      }
      .saveButton, .cancelButton {
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default SignaturePad;
