import { useState, useEffect } from 'react';
import { workflowAPI } from '../services/api';
import { Link } from 'react-router-dom';

const PendingApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getPending();
      setPendingApprovals(response.data.pendingApprovals || []);
      setError('');
    } catch (err) {
      setError('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (stageId, userId) => {
    try {
      await workflowAPI.assignStage(stageId, userId);
      fetchPendingApprovals();
    } catch (err) {
      alert('Failed to assign stage');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Pending Approvals</h1>
        <p style={styles.subtitle}>Review and approve pending document stages</p>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      
      {pendingApprovals.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No pending approvals</p>
        </div>
      ) : (
        <div style={styles.list}>
          {pendingApprovals.map((approval) => (
            <div key={approval.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{approval.original_filename}</h3>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Stage:</span>
                  <span style={styles.infoValue}>{approval.stage_name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Status:</span>
                  <span style={styles.infoValue}>{approval.status.replace('_', ' ')}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Uploaded by:</span>
                  <span style={styles.infoValue}>{approval.uploaded_by_name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Signatures:</span>
                  <span style={styles.infoValue}>{approval.signature_count || 0}</span>
                </div>
              </div>
              <div style={styles.actions}>
                <Link
                  to={`/documents/${approval.document_id}`}
                  style={styles.button}
                >
                  View Document
                </Link>
                {!approval.assigned_to && (
                  <button
                    onClick={() => handleAssign(approval.id, null)}
                    style={styles.buttonSecondary}
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.875rem'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  },
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
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.25rem',
    marginTop: '1.5rem'
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s ease'
  },
  cardHeader: {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    wordBreak: 'break-word'
  },
  cardBody: {
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem'
  },
  infoLabel: {
    color: '#64748b',
    fontWeight: '500'
  },
  infoValue: {
    color: '#1e293b',
    textTransform: 'capitalize'
  },
  actions: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  button: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    flex: 1,
    textAlign: 'center'
  },
  buttonSecondary: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#64748b',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    flex: 1
  }
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .card:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .buttonSecondary:hover {
      background-color: #475569;
    }
  `;
  document.head.appendChild(style);
}

export default PendingApprovals;
