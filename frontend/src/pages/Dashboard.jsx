import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentsAPI, workflowAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingDocuments: 0,
    pendingApprovals: 0,
    urgentDocuments: 0,
    overdueDocuments: 0
  });
  const [urgentDocs, setUrgentDocs] = useState([]);
  const [overdueDocs, setOverdueDocs] = useState([]);
  const [classificationBreakdown, setClassificationBreakdown] = useState({});
  const [unitBreakdown, setUnitBreakdown] = useState({});
  const [priorityBreakdown, setPriorityBreakdown] = useState({});
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [documentsRes, pendingRes] = await Promise.all([
        documentsAPI.list(),
        user?.role === 'authority' || user?.role === 'admin' 
          ? workflowAPI.getPending() 
          : Promise.resolve({ data: { pendingApprovals: [] } })
      ]);

      const documents = documentsRes.data.documents || [];
      const pendingApprovals = pendingRes.data.pendingApprovals || [];

      // Calculate stats
      const urgent = documents.filter(d => d.is_urgent || d.priority === 'Emergency' || d.priority === 'Urgent');
      const overdue = documents.filter(d => {
        if (!d.deadline) return false;
        return new Date(d.deadline) < new Date() && d.status !== 'completed' && d.status !== 'rejected';
      });

      // Classification breakdown
      const classification = {};
      documents.forEach(doc => {
        const key = doc.classification_level || 'Unclassified';
        classification[key] = (classification[key] || 0) + 1;
      });

      // Unit breakdown
      const unit = {};
      documents.forEach(doc => {
        const key = doc.office_unit || 'Unassigned';
        unit[key] = (unit[key] || 0) + 1;
      });

      // Priority breakdown
      const priority = {};
      documents.forEach(doc => {
        const key = doc.priority || 'Routine';
        priority[key] = (priority[key] || 0) + 1;
      });

      // Upcoming deadlines (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = documents
        .filter(doc => {
          if (!doc.deadline) return false;
          const deadline = new Date(doc.deadline);
          return deadline >= now && deadline <= nextWeek && doc.status !== 'completed' && doc.status !== 'rejected';
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

      setStats({
        totalDocuments: documents.length,
        pendingDocuments: documents.filter(d => d.status === 'pending').length,
        pendingApprovals: pendingApprovals.length,
        urgentDocuments: urgent.length,
        overdueDocuments: overdue.length
      });
      setUrgentDocs(urgent.slice(0, 5));
      setOverdueDocs(overdue.slice(0, 5));
      setClassificationBreakdown(classification);
      setUnitBreakdown(unit);
      setPriorityBreakdown(priority);
      setUpcomingDeadlines(upcoming);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
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

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
      </div>
      
      {/* Alert Section */}
      {(stats.overdueDocuments > 0 || stats.urgentDocuments > 0) && (
        <div style={styles.alerts}>
          {stats.overdueDocuments > 0 && (
            <div style={styles.alertCard}>
              <div style={styles.alertIcon}>⚠</div>
              <div>
                <div style={styles.alertTitle}>{stats.overdueDocuments} Overdue Document{stats.overdueDocuments !== 1 ? 's' : ''}</div>
                <div style={styles.alertText}>Documents past their deadline require immediate attention</div>
              </div>
              <Link to="/documents?sort_by=deadline&sort_order=asc" style={styles.alertLink}>
                View All →
              </Link>
            </div>
          )}
          {stats.urgentDocuments > 0 && (
            <div style={{...styles.alertCard, backgroundColor: '#fef2f2', borderColor: '#fecaca'}}>
              <div style={{...styles.alertIcon, color: '#dc2626'}}>🚨</div>
              <div>
                <div style={{...styles.alertTitle, color: '#991b1b'}}>{stats.urgentDocuments} Urgent Document{stats.urgentDocuments !== 1 ? 's' : ''}</div>
                <div style={{...styles.alertText, color: '#b91c1c'}}>High priority documents need your review</div>
              </div>
              <Link to="/documents?priority=Urgent" style={{...styles.alertLink, color: '#dc2626'}}>
                View All →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalDocuments}</div>
          <div style={styles.statLabel}>Total Documents</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.pendingDocuments}</div>
          <div style={styles.statLabel}>Pending Documents</div>
        </div>
        {(user?.role === 'authority' || user?.role === 'admin') && (
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.pendingApprovals}</div>
            <div style={styles.statLabel}>Pending Approvals</div>
            {stats.pendingApprovals > 0 && (
              <Link to="/pending" style={styles.statLink}>View All →</Link>
            )}
          </div>
        )}
        <div style={{...styles.statCard, borderColor: stats.urgentDocuments > 0 ? '#dc2626' : '#e2e8f0'}}>
          <div style={{...styles.statValue, color: stats.urgentDocuments > 0 ? '#dc2626' : '#1e293b'}}>
            {stats.urgentDocuments}
          </div>
          <div style={styles.statLabel}>Urgent Documents</div>
        </div>
        <div style={{...styles.statCard, borderColor: stats.overdueDocuments > 0 ? '#ea580c' : '#e2e8f0'}}>
          <div style={{...styles.statValue, color: stats.overdueDocuments > 0 ? '#ea580c' : '#1e293b'}}>
            {stats.overdueDocuments}
          </div>
          <div style={styles.statLabel}>Overdue Documents</div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* Urgent Documents */}
        {urgentDocs.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Urgent Documents</h2>
            <div style={styles.docList}>
              {urgentDocs.map((doc) => (
                <Link key={doc.id} to={`/documents/${doc.id}`} style={styles.docItem}>
                  <div style={styles.docHeader}>
                    <span style={styles.docTitle}>{doc.document_title || doc.original_filename}</span>
                    {doc.priority && (
                      <span style={{
                        ...styles.priorityBadge,
                        backgroundColor: getPriorityColor(doc.priority)
                      }}>
                        {doc.priority}
                      </span>
                    )}
                  </div>
                  <div style={styles.docMeta}>
                    <span>{doc.purpose || 'N/A'}</span>
                    {doc.deadline && (
                      <span style={styles.deadline}>Due: {formatDateTime(doc.deadline)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Documents */}
        {overdueDocs.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Overdue Documents</h2>
            <div style={styles.docList}>
              {overdueDocs.map((doc) => (
                <Link key={doc.id} to={`/documents/${doc.id}`} style={styles.docItem}>
                  <div style={styles.docHeader}>
                    <span style={styles.docTitle}>{doc.document_title || doc.original_filename}</span>
                    <span style={styles.overdueBadge}>OVERDUE</span>
                  </div>
                  <div style={styles.docMeta}>
                    <span>{doc.purpose || 'N/A'}</span>
                    {doc.deadline && (
                      <span style={{...styles.deadline, color: '#dc2626'}}>
                        Was due: {formatDateTime(doc.deadline)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Upcoming Deadlines</h2>
            <div style={styles.deadlineList}>
              {upcomingDeadlines.map((doc) => (
                <Link key={doc.id} to={`/documents/${doc.id}`} style={styles.deadlineItem}>
                  <div style={styles.deadlineDate}>
                    {formatDate(doc.deadline)}
                  </div>
                  <div style={styles.deadlineInfo}>
                    <div style={styles.deadlineTitle}>{doc.document_title || doc.original_filename}</div>
                    <div style={styles.deadlineMeta}>{doc.purpose || 'N/A'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Classification Breakdown */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>By Classification</h2>
          <div style={styles.breakdownList}>
            {Object.entries(classificationBreakdown).map(([key, value]) => (
              <div key={key} style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>{key}</span>
                <span style={styles.breakdownValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Breakdown */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>By Unit</h2>
          <div style={styles.breakdownList}>
            {Object.entries(unitBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([key, value]) => (
                <div key={key} style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>{key}</span>
                  <span style={styles.breakdownValue}>{value}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>By Priority</h2>
          <div style={styles.breakdownList}>
            {['Emergency', 'Priority', 'Urgent', 'Routine'].map((priority) => (
              <div key={priority} style={styles.breakdownItem}>
                <span style={{
                  ...styles.priorityLabel,
                  color: getPriorityColor(priority)
                }}>
                  {priority}
                </span>
                <span style={styles.breakdownValue}>{priorityBreakdown[priority] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <Link to="/documents" style={styles.actionCard}>
            <div style={styles.actionText}>Upload Document</div>
          </Link>
          {(user?.role === 'authority' || user?.role === 'admin') && (
            <Link to="/pending" style={styles.actionCard}>
              <div style={styles.actionText}>Review Pending</div>
            </Link>
          )}
        </div>
      </div>
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
  alerts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem'
  },
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px'
  },
  alertIcon: {
    fontSize: '1.5rem'
  },
  alertTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#9a3412',
    marginBottom: '0.25rem'
  },
  alertText: {
    fontSize: '0.8125rem',
    color: '#c2410c'
  },
  alertLink: {
    marginLeft: 'auto',
    color: '#ea580c',
    textDecoration: 'none',
    fontSize: '0.8125rem',
    fontWeight: '500'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '1.75rem',
    borderRadius: '8px',
    border: '2px solid',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.5rem'
  },
  statLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  statLink: {
    display: 'inline-block',
    marginTop: '0.75rem',
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.8125rem',
    fontWeight: '500'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
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
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  docItem: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.2s ease'
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    gap: '0.5rem'
  },
  docTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    flex: 1
  },
  priorityBadge: {
    padding: '0.125rem 0.5rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.625rem',
    fontWeight: '600'
  },
  overdueBadge: {
    padding: '0.125rem 0.5rem',
    backgroundColor: '#ea580c',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.625rem',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  docMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8125rem',
    color: '#64748b',
    gap: '1rem'
  },
  deadline: {
    fontSize: '0.75rem'
  },
  deadlineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  deadlineItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    textDecoration: 'none',
    color: 'inherit'
  },
  deadlineDate: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#2563eb',
    minWidth: '80px'
  },
  deadlineInfo: {
    flex: 1
  },
  deadlineTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '0.25rem'
  },
  deadlineMeta: {
    fontSize: '0.8125rem',
    color: '#64748b'
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },
  breakdownLabel: {
    fontSize: '0.875rem',
    color: '#374151'
  },
  breakdownValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  priorityLabel: {
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  quickActions: {
    marginTop: '2rem'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  actionText: {
    color: '#1e293b',
    fontSize: '0.875rem',
    fontWeight: '500'
  }
};

export default Dashboard;
