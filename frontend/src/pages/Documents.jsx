import { useState, useEffect } from 'react';
import { documentsAPI } from '../services/api';
import DocumentUpload from '../components/Documents/DocumentUpload';
import DocumentList from '../components/Documents/DocumentList';
import DocumentPreview from '../components/Documents/DocumentPreview';

const PURPOSE_OPTIONS = [
  'Investigation Report',
  'Incident Report',
  'Intelligence Report',
  'Administrative Request',
  'Financial Request',
  'Procurement Documents',
  'Legal Documents',
  'Personnel Records',
  'Case Follow-up'
];

const UNIT_OPTIONS = [
  'Regional Office',
  'Provincial Office',
  'City Police Station',
  'Municipal Police Station',
  'Investigation and Detective Management',
  'Intelligence Division',
  'Human Resource and Doctrine',
  'Logistics',
  'Finance',
  'Operations',
  'Legal Division'
];

const CLASSIFICATION_OPTIONS = [
  'For Official Use Only',
  'Restricted',
  'Confidential',
  'Secret'
];

const PRIORITY_OPTIONS = [
  'Routine',
  'Urgent',
  'Priority',
  'Emergency'
];

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  
  // Filters
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const [officeUnit, setOfficeUnit] = useState('');
  const [classification, setClassification] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [status, purpose, officeUnit, classification, priority, search, sortBy, sortOrder]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      if (purpose) params.purpose = purpose;
      if (officeUnit) params.office_unit = officeUnit;
      if (classification) params.classification_level = classification;
      if (priority) params.priority = priority;
      if (search) params.search = search;
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      
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

  const clearFilters = () => {
    setStatus('');
    setPurpose('');
    setOfficeUnit('');
    setClassification('');
    setPriority('');
    setSearch('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Documents</h1>
          <p style={styles.subtitle}>Manage and track your documents</p>
        </div>
        {!isLargeScreen && (
          <DocumentUpload onUploadSuccess={handleUploadSuccess} onFileSelect={setSelectedFile} />
        )}
      </div>

      {/* Two-column layout for large screens */}
      {isLargeScreen ? (
        <div style={styles.twoColumnLayout}>
          {/* Left: Document Preview */}
          <div style={styles.leftColumn}>
            <DocumentPreview fileData={selectedFile} />
          </div>

          {/* Right: Upload Form */}
          <div style={styles.rightColumn}>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} onFileSelect={setSelectedFile} />
          </div>
        </div>
      ) : (
        <>
          {/* Search and Sort Bar - Mobile/Tablet */}
          <div style={styles.searchBar}>
            <div style={styles.searchInputWrapper}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by case number, title, or filename..."
                style={styles.searchInput}
              />
            </div>
            <div style={styles.sortControls}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="document_title">Title</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={styles.select}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={styles.filterToggle}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={styles.filters}>
              <div style={styles.filterRow}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Purposes</option>
                    {PURPOSE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Office/Unit</label>
                  <select
                    value={officeUnit}
                    onChange={(e) => setOfficeUnit(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Units</option>
                    {UNIT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Classifications</option>
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <button
                    onClick={clearFilters}
                    style={styles.clearButton}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
          
          {loading ? (
            <div style={styles.loading}>Loading documents...</div>
          ) : (
            <DocumentList 
              documents={documents.map(doc => ({
                ...doc,
                isOverdue: isOverdue(doc.deadline)
              }))} 
              onUpdate={fetchDocuments} 
            />
          )}
        </>
      )}

      {/* Document List and Filters for Large Screens - Below the two columns */}
      {isLargeScreen && (
        <>
          {/* Search and Sort Bar */}
          <div style={styles.searchBar}>
            <div style={styles.searchInputWrapper}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by case number, title, or filename..."
                style={styles.searchInput}
              />
            </div>
            <div style={styles.sortControls}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="document_title">Title</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={styles.select}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={styles.filterToggle}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={styles.filters}>
              <div style={styles.filterRow}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Purposes</option>
                    {PURPOSE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Office/Unit</label>
                  <select
                    value={officeUnit}
                    onChange={(e) => setOfficeUnit(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Units</option>
                    {UNIT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Classifications</option>
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <button
                    onClick={clearFilters}
                    style={styles.clearButton}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
          
          {loading ? (
            <div style={styles.loading}>Loading documents...</div>
          ) : (
            <DocumentList 
              documents={documents.map(doc => ({
                ...doc,
                isOverdue: isOverdue(doc.deadline)
              }))} 
              onUpdate={fetchDocuments} 
            />
          )}
        </>
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
  searchBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchInputWrapper: {
    flex: '1',
    minWidth: '300px'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontFamily: 'inherit'
  },
  sortControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  filters: {
    marginBottom: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    alignItems: 'end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  filterLabel: {
    fontSize: '0.8125rem',
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
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit'
  },
  filterToggle: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#991b1b',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '2rem',
    alignItems: 'start',
    '@media (max-width: 1023px)': {
      gridTemplateColumns: '1fr'
    }
  },
  leftColumn: {
    minHeight: '600px',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 200px)'
  },
  rightColumn: {
    position: 'sticky',
    top: '1rem',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto'
  }
};

export default Documents;
