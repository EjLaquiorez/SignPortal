import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsAPI, workflowAPI } from '../services/api';
import WorkflowStages from '../components/Workflow/WorkflowStages';
import DocumentViewerModal from '../components/Documents/DocumentViewerModal';
import DocumentVersions from '../components/Documents/DocumentVersions';

const DocumentDetail = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const [docRes, attRes] = await Promise.all([
        documentsAPI.get(id),
        documentsAPI.listAttachments(id).catch(() => ({ data: { attachments: [] } }))
      ]);

      setDocument(docRes.data.document);
      setAttachments(attRes.data.attachments || []);

      // Fetch document history (if endpoint exists)
      // For now, we'll get it from workflow
      const workflowRes = await workflowAPI.getByDocument(id).catch(() => ({ data: { workflow: [] } }));
      // History would come from a separate endpoint, but we can derive some from workflow
      
    } catch (err) {
      setError('Failed to load document details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Emergency': '#dc2626',
      'Priority': '#ea580c',
      'Urgent': '#f59e0b',
      'Routine': '#64748b'
    };
    return colors[priority] || '#64748b';
  };

  const getClassificationColor = (classification) => {
    const colors = {
      'Secret': '#991b1b',
      'Confidential': '#b91c1c',
      'Restricted': '#c2410c',
      'For Official Use Only': '#7c2d12'
    };
    return colors[classification] || '#64748b';
  };

  if (loading) {
    return <div style={styles.loading}>Loading document details...</div>;
  }

  if (error || !document) {
    return (
      <div style={styles.error}>
        {error || 'Document not found'}
        <Link to="/documents" style={styles.backLink}>← Back to Documents</Link>
      </div>
    );
  }

  const isOverdue = document.deadline && new Date(document.deadline) < new Date();

  return (
    <div style={styles.container}>
      <DocumentViewerModal
        document={document}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
      <div style={styles.header}>
        <Link to="/documents" style={styles.backButton}>← Back to Documents</Link>
        <div style={styles.headerActions}>
          <button
            onClick={async () => {
              try {
                const response = await documentsAPI.download(document.id);
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
            }}
            style={styles.downloadButton}
          >
            Download Document
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Document Metadata */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Document Information</h2>
          {document.tracking_number && (
            <div style={styles.trackingNumberBanner}>
              <span style={styles.trackingLabel}>Tracking Number:</span>
              <span style={styles.trackingValue}>📋 {document.tracking_number}</span>
            </div>
          )}
          {document.current_stage_name && (
            <div style={styles.currentStageBanner}>
              <span style={styles.stageLabel}>Current Status:</span>
              <span style={styles.stageValue}>{document.current_stage_name}</span>
            </div>
          )}
          <div style={styles.metadataGrid}>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Title:</span>
              <span style={styles.metadataValue}>{document.document_title || document.original_filename}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Purpose:</span>
              <span style={styles.metadataValue}>{document.purpose || 'N/A'}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Office/Unit:</span>
              <span style={styles.metadataValue}>{document.office_unit || 'N/A'}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Case/Reference #:</span>
              <span style={styles.metadataValue}>{document.case_reference_number || 'N/A'}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Classification:</span>
              {document.classification_level ? (
                <span style={{
                  ...styles.badge,
                  backgroundColor: getClassificationColor(document.classification_level)
                }}>
                  {document.classification_level}
                </span>
              ) : (
                <span style={styles.metadataValue}>N/A</span>
              )}
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Priority:</span>
              {document.priority ? (
                <span style={{
                  ...styles.badge,
                  backgroundColor: getPriorityColor(document.priority)
                }}>
                  {document.priority}
                </span>
              ) : (
                <span style={styles.metadataValue}>Routine</span>
              )}
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Deadline:</span>
              <span style={{
                ...styles.metadataValue,
                color: isOverdue ? '#dc2626' : '#64748b',
                fontWeight: isOverdue ? '600' : '400'
              }}>
                {document.deadline ? formatDateTime(document.deadline) : 'N/A'}
                {isOverdue && ' ⚠ Overdue'}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Status:</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: document.status === 'completed' ? '#10b981' :
                                 document.status === 'rejected' ? '#ef4444' :
                                 document.status === 'in_progress' ? '#3b82f6' : '#f59e0b'
              }}>
                {document.status.replace('_', ' ')}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Uploaded by:</span>
              <span style={styles.metadataValue}>
                {document.uploaded_by_name || 'N/A'}
                {document.uploaded_by_rank && ` (${document.uploaded_by_rank})`}
                {document.uploaded_by_designation && ` - ${document.uploaded_by_designation}`}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Created:</span>
              <span style={styles.metadataValue}>{formatDateTime(document.created_at)}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Last Updated:</span>
              <span style={styles.metadataValue}>{formatDateTime(document.updated_at)}</span>
            </div>
            {document.notes && (
              <div style={{...styles.metadataItem, gridColumn: '1 / -1'}}>
                <span style={styles.metadataLabel}>Notes:</span>
                <div style={styles.notes}>{document.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Timeline */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Workflow Timeline</h2>
          <WorkflowStages documentId={id} />
        </div>

        {/* Document Versions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Document Versions</h2>
          <DocumentVersions documentId={id} />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Supporting Attachments</h2>
            <div style={styles.attachmentsList}>
              {attachments.map((att) => (
                <div key={att.id} style={styles.attachmentItem}>
                  <div style={styles.attachmentInfo}>
                    <span style={styles.attachmentName}>{att.original_filename}</span>
                    <span style={styles.attachmentSize}>
                      {(att.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span style={styles.attachmentDate}>
                      Uploaded: {formatDateTime(att.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await documentsAPI.downloadAttachment(att.id);
                        const blob = new Blob([response.data], { 
                          type: att.file_type || 'application/octet-stream' 
                        });
                        const url = window.URL.createObjectURL(blob);
                        const a = window.document.createElement('a');
                        a.href = url;
                        a.download = att.original_filename;
                        window.document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        window.document.body.removeChild(a);
                      } catch (err) {
                        alert('Failed to download attachment: ' + (err.response?.data?.error || err.message));
                        console.error('Download error:', err);
                      }
                    }}
                    style={styles.downloadAttachmentButton}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  backButton: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem'
  },
  previewButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  downloadButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e2e8f0'
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem'
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  metadataLabel: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#64748b'
  },
  metadataValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    wordBreak: 'break-word'
  },
  badge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-block',
    width: 'fit-content'
  },
  statusBadge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-block',
    textTransform: 'capitalize'
  },
  notes: {
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },
  attachmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  attachmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#f9fafb'
  },
  attachmentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1
  },
  attachmentName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937'
  },
  attachmentSize: {
    fontSize: '0.8125rem',
    color: '#64748b'
  },
  attachmentDate: {
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  trackingNumberBanner: {
    padding: '1rem',
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  trackingLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e40af'
  },
  trackingValue: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: '0.5px'
  },
  currentStageBanner: {
    padding: '1rem',
    backgroundColor: '#fff7ed',
    border: '2px solid #ea580c',
    borderRadius: '8px',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  stageLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#9a3412'
  },
  stageValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ea580c'
  },
  downloadAttachmentButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  },
  error: {
    padding: '2rem',
    textAlign: 'center',
    color: '#dc2626'
  },
  backLink: {
    display: 'block',
    marginTop: '1rem',
    color: '#2563eb',
    textDecoration: 'none'
  }
};

export default DocumentDetail;
