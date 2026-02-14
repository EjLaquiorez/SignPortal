import { useState, useEffect } from 'react';

const DocumentPreview = ({ fileData }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (fileData?.type === 'pdf' && fileData?.preview) {
      setPdfUrl(fileData.preview);
    } else {
      setPdfUrl(null);
    }

    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileData]);

  if (!fileData) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📄</div>
        <h3 style={styles.emptyTitle}>Document Preview</h3>
        <p style={styles.emptyText}>
          Select a file to see a preview here
        </p>
      </div>
    );
  }

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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Document Preview</h2>
      </div>

      <div style={styles.fileInfo}>
        <div style={styles.fileIcon}>{getFileIcon(fileData.file.name)}</div>
        <div style={styles.fileDetails}>
          <div style={styles.fileName}>{fileData.file.name}</div>
          <div style={styles.fileMeta}>
            {formatFileSize(fileData.file.size)} • {fileData.file.type || 'Unknown type'}
          </div>
        </div>
      </div>

      <div style={styles.previewArea}>
        {fileData.type === 'image' && fileData.preview && (
          <div style={styles.imageContainer}>
            <img 
              src={fileData.preview} 
              alt="Document preview" 
              style={styles.previewImage}
            />
          </div>
        )}

        {fileData.type === 'pdf' && fileData.preview && (
          <div style={styles.pdfContainer}>
            <iframe
              src={fileData.preview}
              style={styles.pdfFrame}
              title="PDF Preview"
            />
            <div style={styles.pdfNote}>
              PDF Preview - Scroll to view full document
            </div>
          </div>
        )}

        {fileData.type === 'other' && (
          <div style={styles.otherFileContainer}>
            <div style={styles.otherFileIcon}>{getFileIcon(fileData.file.name)}</div>
            <div style={styles.otherFileText}>
              Preview not available for this file type
            </div>
            <div style={styles.otherFileSubtext}>
              {fileData.file.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f9fafb'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  fileInfo: {
    padding: '1rem 1.5rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#ffffff'
  },
  fileIcon: {
    fontSize: '2.5rem',
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
  previewArea: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem'
  },
  imageContainer: {
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 300px)',
    objectFit: 'contain',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white'
  },
  pdfContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '500px'
  },
  pdfFrame: {
    flex: 1,
    width: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: 'white'
  },
  pdfNote: {
    marginTop: '0.75rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    textAlign: 'center'
  },
  otherFileContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center'
  },
  otherFileIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5
  },
  otherFileText: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  otherFileSubtext: {
    fontSize: '0.875rem',
    color: '#9ca3af'
  },
  emptyState: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center',
    color: '#9ca3af'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.3
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '0.5rem'
  },
  emptyText: {
    fontSize: '0.875rem',
    color: '#9ca3af'
  }
};

export default DocumentPreview;
