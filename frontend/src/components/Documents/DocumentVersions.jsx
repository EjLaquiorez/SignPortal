import { useState, useEffect } from 'react';
import { documentsAPI } from '../../services/api';

const DocumentVersions = ({ documentId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentVersion, setCurrentVersion] = useState(null);

  useEffect(() => {
    fetchVersions();
    fetchCurrentVersion();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.listVersions(documentId);
      setVersions(response.data.versions || []);
      setError('');
    } catch (err) {
      setError('Failed to load document versions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentVersion = async () => {
    try {
      const response = await documentsAPI.getCurrentVersion(documentId);
      setCurrentVersion(response.data.version);
    } catch (err) {
      console.error('Failed to load current version:', err);
    }
  };

  const handleDownload = async (versionId, filename) => {
    try {
      const response = await documentsAPI.downloadVersion(documentId, versionId);
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download version: ' + (err.response?.data?.error || err.message));
      console.error('Download error:', err);
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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading document versions...
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        {error}
      </div>
    );
  }

  // If no versions exist, show message
  if (versions.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No document versions found.</p>
        <p style={styles.emptySubtext}>The original document is version 1.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Version History & Approval Timeline</h3>
      {currentVersion && (
        <div style={styles.currentVersion}>
          <span style={styles.currentLabel}>Current Version:</span>
          <span style={styles.currentValue}>v{currentVersion.version_number || 1}</span>
        </div>
      )}

      <div style={styles.timeline}>
        {versions.map((version, index) => (
          <div key={version.id} style={styles.timelineItem}>
            {index < versions.length - 1 && (
              <div style={styles.timelineConnector} />
            )}
            <div
              style={{
                ...styles.versionItem,
                ...(currentVersion && version.version_number === currentVersion.version_number
                  ? styles.currentVersionItem
                  : {})
              }}
            >
              <div style={styles.versionHeader}>
                <div style={styles.versionNumber}>
                  Version {version.version_number}
                  {currentVersion && version.version_number === currentVersion.version_number && (
                    <span style={styles.currentBadge}>Current</span>
                  )}
                  {version.is_signed_version && (
                    <span style={styles.signedBadge}>✓ Signed</span>
                  )}
                </div>
                <div style={styles.versionDate}>
                  {formatDateTime(version.created_at)}
                </div>
              </div>

            <div style={styles.versionDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>File:</span>
                <span style={styles.detailValue}>{version.original_filename}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Size:</span>
                <span style={styles.detailValue}>{formatFileSize(version.file_size)}</span>
              </div>
              {version.stage_name && (
                <div style={styles.statusRow}>
                  <div style={styles.statusIndicator}>
                    {version.is_signed_version ? '✓' : '⏳'}
                  </div>
                  <div style={styles.statusText}>
                    <strong>
                      {version.is_signed_version 
                        ? `Signed by ${version.stage_name}` 
                        : `Pending ${version.stage_name}`}
                    </strong>
                    {version.stage_status && version.stage_status === 'completed' && (
                      <div style={styles.forwardedText}>→ Forwarded to next authority</div>
                    )}
                  </div>
                </div>
              )}
              {version.uploaded_by_name && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>
                    {version.is_signed_version ? 'Signed by:' : 'Uploaded by:'}
                  </span>
                  <span style={styles.detailValue}>
                    {version.uploaded_by_name}
                    {version.uploaded_by_rank && ` (${version.uploaded_by_rank})`}
                    {version.uploaded_by_designation && ` - ${version.uploaded_by_designation}`}
                  </span>
                </div>
              )}
              {version.upload_reason && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Reason:</span>
                  <span style={styles.detailValue}>{version.upload_reason}</span>
                </div>
              )}
            </div>

            <div style={styles.versionActions}>
              <button
                onClick={() => handleDownload(version.id, version.original_filename)}
                style={styles.downloadButton}
              >
                Download
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1rem'
  },
  currentVersion: {
    padding: '0.75rem',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    marginBottom: '1rem',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  currentLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  currentValue: {
    fontSize: '0.875rem',
    color: '#2563eb',
    fontWeight: '600'
  },
  versionItem: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '1rem',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s ease'
  },
  currentVersionItem: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  versionNumber: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  currentBadge: {
    padding: '0.125rem 0.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  signedBadge: {
    padding: '0.125rem 0.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  versionDate: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  versionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.75rem'
  },
  detailRow: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.875rem'
  },
  detailLabel: {
    color: '#6b7280',
    fontWeight: '500',
    minWidth: '100px'
  },
  detailValue: {
    color: '#1f2937',
    flex: 1
  },
  statusRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    marginTop: '0.5rem',
    marginBottom: '0.5rem'
  },
  statusIndicator: {
    fontSize: '1.25rem',
    lineHeight: '1'
  },
  statusText: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#1f2937'
  },
  forwardedText: {
    fontSize: '0.75rem',
    color: '#2563eb',
    marginTop: '0.25rem',
    fontStyle: 'italic'
  },
  versionActions: {
    display: 'flex',
    gap: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e2e8f0'
  },
  downloadButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#6b7280'
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: '#6b7280'
  },
  emptyText: {
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  },
  emptySubtext: {
    fontSize: '0.75rem',
    color: '#9ca3af'
  }
};

export default DocumentVersions;
