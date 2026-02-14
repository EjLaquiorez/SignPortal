import { Link } from 'react-router-dom';
import { documentsAPI } from '../../services/api';
import { DOCUMENT_STATUS } from '../../utils/constants';

const DocumentList = ({ documents, onUpdate }) => {
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

  if (documents.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No documents found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div style={styles.tableContainer} className="hide-mobile">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Filename</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Size</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Uploaded By</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} style={styles.tr}>
                <td style={styles.td}>
                  <Link to={`/documents/${doc.id}`} style={styles.link}>
                    {doc.original_filename}
                  </Link>
                </td>
                <td style={styles.td}>{doc.file_type || 'N/A'}</td>
                <td style={styles.td}>{(doc.file_size / 1024).toFixed(2)} KB</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.status,
                      backgroundColor: getStatusColor(doc.status)
                    }}
                  >
                    {doc.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={styles.td}>{doc.uploaded_by_name || 'N/A'}</td>
                <td style={styles.td}>{new Date(doc.created_at).toLocaleDateString()}</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      onClick={async () => {
                        try {
                          const response = await documentsAPI.download(doc.id);
                          const blob = new Blob([response.data]);
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.original_filename;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          alert('Failed to download document');
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
                <h3 style={styles.cardTitle}>{doc.original_filename}</h3>
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
              <p style={styles.cardInfo}><strong>Type:</strong> {doc.file_type || 'N/A'}</p>
              <p style={styles.cardInfo}><strong>Size:</strong> {(doc.file_size / 1024).toFixed(2)} KB</p>
              <p style={styles.cardInfo}><strong>Uploaded by:</strong> {doc.uploaded_by_name || 'N/A'}</p>
              <p style={styles.cardInfo}><strong>Created:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
            </div>
            <div style={styles.cardActions}>
              <button
                onClick={async () => {
                  try {
                    const response = await documentsAPI.download(doc.id);
                    const blob = new Blob([response.data]);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.original_filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err) {
                    alert('Failed to download document');
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
