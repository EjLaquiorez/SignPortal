import { useState, useEffect } from 'react';
import { documentsAPI } from '../services/api';
import DocumentUpload from '../components/Documents/DocumentUpload';
import DocumentList from '../components/Documents/DocumentList';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = filter ? { status: filter } : {};
      const response = await documentsAPI.list(params);
      setDocuments(response.data.documents || []);
      setError('');
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Documents</h1>
          <p style={styles.subtitle}>Manage and track your documents</p>
        </div>
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      <div style={styles.filters}>
        <label style={styles.filterLabel}>
          Filter by status:
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Documents</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      
      {loading ? (
        <div style={styles.loading}>Loading documents...</div>
      ) : (
        <DocumentList documents={documents} onUpdate={fetchDocuments} />
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1.5rem'
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
  filters: {
    marginBottom: '1.5rem',
    padding: '1rem 1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem'
  }
};

export default Documents;
