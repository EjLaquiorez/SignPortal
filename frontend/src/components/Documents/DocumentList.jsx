import { useState } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI } from '../../services/api';
import { DOCUMENT_STATUS } from '../../utils/constants';
import DocumentViewerModal from './DocumentViewerModal';

const DocumentList = ({ documents, onUpdate }) => {
  const [previewDocument, setPreviewDocument] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (doc) => {
    setPreviewDocument(doc);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(id);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      alert('Failed to delete document');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [DOCUMENT_STATUS.PENDING]: '#f59e0b',
      [DOCUMENT_STATUS.IN_PROGRESS]: '#3b82f6',
      [DOCUMENT_STATUS.COMPLETED]: '#10b981',
      [DOCUMENT_STATUS.REJECTED]: '#ef4444'
    };
    return colors[status] || '#64748b';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (documents.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No documents found</p>
      </div>
    );
  }

  return (
    <div>
      <DocumentViewerModal
        document={previewDocument}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocument(null);
        }}
      />
      {/* Desktop Table View */}
      <div style={styles.tableContainer} className="hide-mobile">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Purpose</th>
              <th style={styles.th}>Case #</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Classification</th>
              <th style={styles.th}>Deadline</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr 
                key={doc.id} 
                style={{
                  ...styles.tr,
                  backgroundColor: doc.is_urgent ? '#fef2f2' : doc.isOverdue ? '#fff7ed' : 'transparent'
                }}
              >
                <td style={styles.td}>
                  <div style={styles.titleCell}>
                    <Link to={`/documents/${doc.id}`} style={styles.link}>
                      {doc.document_title || doc.original_filename}
                    </Link>
                    {doc.tracking_number && (
                      <span style={styles.trackingNumber}>📋 {doc.tracking_number}</span>
                    )}
                    {doc.is_urgent && (
                      <span style={styles.urgentBadge}>URGENT</span>
                    )}
                    {doc.isOverdue && (
                      <span style={styles.overdueBadge}>OVERDUE</span>
                    )}
                  </div>
                </td>
                <td style={styles.td}>{doc.purpose || 'N/A'}</td>
                <td style={styles.td}>{doc.case_reference_number || 'N/A'}</td>
                <td style={styles.td}>
                  {doc.priority && (
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getPriorityColor(doc.priority)
                      }}
                    >
                      {doc.priority}
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  {doc.classification_level && (
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getClassificationColor(doc.classification_level)
                      }}
                    >
                      {doc.classification_level}
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  <div style={styles.deadlineCell}>
                    {doc.deadline ? formatDateTime(doc.deadline) : 'N/A'}
                    {doc.isOverdue && (
                      <span style={styles.overdueIndicator}>⚠</span>
                    )}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.statusCell}>
                    <span
                      style={{
                        ...styles.status,
                        backgroundColor: getStatusColor(doc.status)
                      }}
                    >
                      {doc.status.replace('_', ' ')}
                    </span>
                    {doc.current_stage_name && (
                      <div style={styles.stageName}>{doc.current_stage_name}</div>
                    )}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      onClick={() => handlePreview(doc)}
                      style={styles.actionButtonPreview}
                    >
                      Preview
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await documentsAPI.download(doc.id);
                          const blob = new Blob([response.data], { 
                            type: doc.file_type || 'application/octet-stream' 
                          });
                          const url = window.URL.createObjectURL(blob);
                          const a = window.document.createElement('a');
                          a.href = url;
                          a.download = doc.original_filename;
                          window.document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          window.document.body.removeChild(a);
                        } catch (err) {
                          alert('Failed to download document: ' + (err.response?.data?.error || err.message));
                          console.error('Download error:', err);
                        }
                      }}
                      style={styles.actionButton}
                    >
                      Download
                    </button>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      style={styles.actionButtonDelete}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div style={styles.cardContainer} className="show-mobile">
        {documents.map((doc) => (
          <div key={doc.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <Link to={`/documents/${doc.id}`} style={styles.cardLink}>
                <h3 style={styles.cardTitle}>{doc.document_title || doc.original_filename}</h3>
                {doc.tracking_number && (
                  <div style={styles.cardTrackingNumber}>📋 {doc.tracking_number}</div>
                )}
              </Link>
              <span
                style={{
                  ...styles.status,
                  backgroundColor: getStatusColor(doc.status),
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {doc.status.replace('_', ' ')}
              </span>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.cardInfo}><strong>Purpose:</strong> {doc.purpose || 'N/A'}</p>
              <p style={styles.cardInfo}><strong>Case #:</strong> {doc.case_reference_number || 'N/A'}</p>
              <p style={styles.cardInfo}><strong>Office/Unit:</strong> {doc.office_unit || 'N/A'}</p>
              {doc.priority && (
                <p style={styles.cardInfo}>
                  <strong>Priority:</strong>{' '}
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: getPriorityColor(doc.priority),
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem'
                    }}
                  >
                    {doc.priority}
                  </span>
                </p>
              )}
              {doc.classification_level && (
                <p style={styles.cardInfo}>
                  <strong>Classification:</strong>{' '}
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: getClassificationColor(doc.classification_level),
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem'
                    }}
                  >
                    {doc.classification_level}
                  </span>
                </p>
              )}
              <p style={styles.cardInfo}>
                <strong>Deadline:</strong>{' '}
                {doc.deadline ? formatDateTime(doc.deadline) : 'N/A'}
                {doc.isOverdue && <span style={styles.overdueIndicator}> ⚠ Overdue</span>}
              </p>
              <p style={styles.cardInfo}><strong>Uploaded by:</strong> {doc.uploaded_by_name || 'N/A'}</p>
              <p style={styles.cardInfo}><strong>Created:</strong> {formatDate(doc.created_at)}</p>
            </div>
            <div style={styles.cardActions}>
              <button
                onClick={() => handlePreview(doc)}
                style={styles.cardButtonPreview}
              >
                Preview
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await documentsAPI.download(doc.id);
                    const blob = new Blob([response.data], { 
                      type: doc.file_type || 'application/octet-stream' 
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.original_filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err) {
                    alert('Failed to download document: ' + (err.response?.data?.error || err.message));
                    console.error('Download error:', err);
                  }
                }}
                style={styles.cardButton}
              >
                Download
              </button>
              <button
                onClick={(e) => handleDelete(doc.id, e)}
                style={styles.cardButtonDelete}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  emptyText: {
    color: '#64748b',
    fontSize: '0.875rem'
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px'
  },
  th: {
    padding: '0.875rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#1e293b'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease'
  },
  status: {
    padding: '0.25rem 0.625rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-block',
    textTransform: 'capitalize'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  actionButtonPreview: {
    padding: '0.375rem 0.875rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  actionButton: {
    padding: '0.375rem 0.875rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  actionButtonDelete: {
    padding: '0.375rem 0.875rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem'
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '0.75rem'
  },
  cardLink: {
    textDecoration: 'none',
    color: '#2563eb',
    flex: 1
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.9375rem',
    fontWeight: '600',
    wordBreak: 'break-word',
    color: '#1e293b'
  },
  cardBody: {
    marginBottom: '1rem'
  },
  cardInfo: {
    margin: '0.375rem 0',
    fontSize: '0.8125rem',
    color: '#64748b',
    lineHeight: '1.5'
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0'
  },
  cardButtonPreview: {
    flex: 1,
    padding: '0.625rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500'
  },
  cardButton: {
    flex: 1,
    padding: '0.625rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500'
  },
  cardButtonDelete: {
    flex: 1,
    padding: '0.625rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500'
  },
  titleCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  urgentBadge: {
    padding: '0.125rem 0.5rem',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '4px',
    fontSize: '0.625rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  overdueBadge: {
    padding: '0.125rem 0.5rem',
    backgroundColor: '#ea580c',
    color: 'white',
    borderRadius: '4px',
    fontSize: '0.625rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  badge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-block'
  },
  deadlineCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  overdueIndicator: {
    color: '#ea580c',
    fontSize: '1rem'
  }
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .table tbody tr:hover {
      background-color: #f8fafc;
    }
    .link:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
}

export default DocumentList;
