import { useState, useEffect } from 'react';
import { documentsAPI } from '../../services/api';

const DocumentViewerModal = ({ document, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);

  useEffect(() => {
    if (isOpen && document) {
      loadPreview();
    } else {
      // Cleanup preview URL when modal closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, document]);

  const loadPreview = async () => {
    if (!document) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await documentsAPI.download(document.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: document.file_type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setFileType(document.file_type || '');
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const response = await documentsAPI.download(document.id);
      const blob = new Blob([response.data], { type: document.file_type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.original_filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download document');
      console.error(err);
    }
  };

  const isImage = fileType?.startsWith('image/');
  const isPDF = fileType === 'application/pdf';
  const canPreview = isImage || isPDF;

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{document?.document_title || document?.original_filename}</h2>
          <div style={styles.headerActions}>
            <button onClick={handleDownload} style={styles.downloadButton}>
              Download
            </button>
            <button onClick={onClose} style={styles.closeButton}>
              ✕
            </button>
          </div>
        </div>

        <div style={styles.content}>
          {loading && (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading preview...</p>
            </div>
          )}

          {error && (
            <div style={styles.error}>
              <p>{error}</p>
              <button onClick={handleDownload} style={styles.downloadButton}>
                Download Instead
              </button>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <>
              {isImage && (
                <div style={styles.imageContainer}>
                  <img 
                    src={previewUrl} 
                    alt={document.original_filename}
                    style={styles.previewImage}
                  />
                </div>
              )}

              {isPDF && (
                <div style={styles.pdfContainer}>
                  <iframe
                    src={previewUrl}
                    style={styles.pdfFrame}
                    title="PDF Preview"
                  />
                </div>
              )}

              {!canPreview && (
                <div style={styles.unsupportedContainer}>
                  <div style={styles.unsupportedIcon}>📄</div>
                  <p style={styles.unsupportedText}>
                    Preview not available for this file type
                  </p>
                  <p style={styles.unsupportedSubtext}>
                    {document.original_filename} ({document.file_type || 'Unknown type'})
                  </p>
                  <button onClick={handleDownload} style={styles.downloadButton}>
                    Download to View
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  downloadButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  closeButton: {
    padding: '0.5rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.25rem',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    backgroundColor: '#f9fafb'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#6b7280'
  },
  spinner: {
    width: '3rem',
    height: '3rem',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  error: {
    textAlign: 'center',
    color: '#dc2626',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center'
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: 'calc(90vh - 150px)',
    objectFit: 'contain',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white'
  },
  pdfContainer: {
    width: '100%',
    height: '100%',
    minHeight: '600px'
  },
  pdfFrame: {
    width: '100%',
    height: '100%',
    minHeight: '600px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: 'white'
  },
  unsupportedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '3rem',
    textAlign: 'center'
  },
  unsupportedIcon: {
    fontSize: '4rem',
    opacity: 0.5
  },
  unsupportedText: {
    fontSize: '1rem',
    color: '#6b7280',
    fontWeight: '500',
    margin: 0
  },
  unsupportedSubtext: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0
  }
};

// Add spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default DocumentViewerModal;
