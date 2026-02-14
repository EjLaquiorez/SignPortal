import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { documentsAPI, workflowAPI } from '../../services/api';
import WorkflowStages from '../Workflow/WorkflowStages';

const DocumentViewer = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.get(id);
      setDocument(response.data.document);
      setError('');
    } catch (err) {
      setError('Failed to load document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await documentsAPI.download(id);
      const blob = new Blob([response.data], { 
        type: document.file_type || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.original_filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download document: ' + (err.response?.data?.error || err.message));
      console.error('Download error:', err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (error || !document) {
    return <div style={styles.error}>{error || 'Document not found'}</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{document.original_filename}</h1>
          <div style={styles.meta}>
            <span style={styles.metaItem}>Type: {document.file_type}</span>
            <span style={styles.metaItem}>Size: {(document.file_size / 1024).toFixed(2)} KB</span>
            <span style={styles.metaItem}>Status: {document.status.replace('_', ' ')}</span>
            <span style={styles.metaItem}>Uploaded: {new Date(document.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <button onClick={handleDownload} style={styles.downloadButton}>
          Download
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.preview}>
          <h2 style={styles.sectionTitle}>Document Preview</h2>
          <div style={styles.previewContent}>
            <p style={styles.previewText}>File preview not available. Please download to view.</p>
          </div>
        </div>

        <div style={styles.workflow}>
          <h2 style={styles.sectionTitle}>Workflow Stages</h2>
          <WorkflowStages documentId={id} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  },
  error: {
    padding: '2rem',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0'
  },
  headerContent: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    wordBreak: 'break-word',
    marginBottom: '0.75rem'
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#64748b'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center'
  },
  downloadButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
    transition: 'background-color 0.2s ease'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2rem'
  },
  preview: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  workflow: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem'
  },
  previewContent: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px dashed #e2e8f0'
  },
  previewText: {
    color: '#64748b',
    fontSize: '0.875rem'
  }
};

// Add responsive styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 769px) {
      .header {
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: start !important;
      }
      .content {
        grid-template-columns: 1fr 1fr !important;
      }
    }
    @media (max-width: 768px) {
      .title {
        font-size: 1.25rem !important;
      }
      .meta {
        flex-direction: column !important;
        gap: 0.5rem !important;
      }
      .downloadButton {
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default DocumentViewer;
