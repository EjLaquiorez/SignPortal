import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentsAPI, workflowAPI } from '../services/api';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

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
  const [myTasks, setMyTasks] = useState([]);
  const [classificationBreakdown, setClassificationBreakdown] = useState({});
  const [unitBreakdown, setUnitBreakdown] = useState({});
  const [priorityBreakdown, setPriorityBreakdown] = useState({});
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

      // Get documents assigned to current user (My Tasks)
      const myAssignedTasks = [];
      if (user?.id) {
        for (const doc of documents) {
          try {
            const workflowRes = await workflowAPI.getByDocument(doc.id);
            const workflow = workflowRes.data.workflow || [];
            const assignedStages = workflow.filter(stage => 
              stage.assigned_to === user.id && 
              (stage.status === 'pending' || stage.status === 'in_progress')
            );
            if (assignedStages.length > 0) {
              myAssignedTasks.push({
                ...doc,
                currentStage: assignedStages[0],
                workflow: workflow
              });
            }
          } catch (err) {
            // Skip if workflow not accessible
            console.debug('Workflow not accessible for document:', doc.id);
          }
        }
      }

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
      setMyTasks(myAssignedTasks.slice(0, 5));
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
      'Emergency': 'var(--error-600)',
      'Priority': 'var(--warning-600)',
      'Urgent': 'var(--warning-500)',
      'Routine': 'var(--gray-500)'
    };
    return colors[priority] || 'var(--gray-500)';
  };

  const getPriorityVariant = (priority) => {
    const variants = {
      'Emergency': 'error',
      'Priority': 'warning',
      'Urgent': 'warning',
      'Routine': 'default'
    };
    return variants[priority] || 'default';
  };

  if (loading) {
    return (
      <div>
        <div style={styles.header}>
          <SkeletonText lines={2} />
        </div>
        <div style={styles.statsGrid}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div style={styles.contentGrid}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .stat-icon-blue {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        .stat-icon-info {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }
        .stat-icon-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .stat-icon-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        .stat-icon-neutral {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        .stat-icon-gray {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
        }
        .stat-card {
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }
        .stat-link:hover {
          color: var(--primary-600);
        }
        .filter-chip:hover {
          background-color: #e5e7eb;
          border-color: #d1d5db;
        }
        .search-input:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .alert-doc-link:hover {
          text-decoration: underline;
        }
      `}</style>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
      </div>
      
      {/* Search and Quick Filters */}
      <div style={styles.searchSection}>
        <div style={styles.searchBar}>
            <input
            type="text"
            placeholder="Search documents by title, case number, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            className="search-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.location.href = `/documents?search=${encodeURIComponent(searchQuery)}`;
              }
            }}
          />
          <Button 
            onClick={() => {
              if (searchQuery.trim()) {
                window.location.href = `/documents?search=${encodeURIComponent(searchQuery)}`;
              }
            }}
            variant="primary"
            style={styles.searchButton}
          >
            Search
          </Button>
        </div>
        <div style={styles.quickFilters}>
          <Link to="/documents?status=pending" style={styles.filterChip} className="filter-chip">Pending</Link>
          <Link to="/documents?priority=Urgent" style={styles.filterChip} className="filter-chip">Urgent</Link>
          <Link to="/documents?sort_by=deadline&sort_order=asc" style={styles.filterChip} className="filter-chip">Overdue</Link>
          {(user?.role === 'authority' || user?.role === 'admin') && (
            <Link to="/pending" style={styles.filterChip} className="filter-chip">My Approvals</Link>
          )}
        </div>
      </div>

      {/* Alert Section */}
      {(stats.overdueDocuments > 0 || stats.urgentDocuments > 0) && (
        <div style={styles.alerts}>
          {stats.overdueDocuments > 0 && (
            <div style={styles.alertCard}>
              <div style={styles.alertIcon}>⚠</div>
              <div style={styles.alertContent}>
                <div style={styles.alertTitle}>{stats.overdueDocuments} Overdue Document{stats.overdueDocuments !== 1 ? 's' : ''}</div>
                <div style={styles.alertText}>Documents past their deadline require immediate attention</div>
                {overdueDocs.length > 0 && (
                  <div style={styles.alertDocs}>
                    {overdueDocs.slice(0, 3).map(doc => (
                      <Link key={doc.id} to={`/documents/${doc.id}`} style={styles.alertDocLink} className="alert-doc-link">
                        • {doc.document_title || doc.original_filename}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div style={styles.alertActions}>
                <Button as={Link} to="/documents?sort_by=deadline&sort_order=asc" variant="primary" size="sm">
                  Review Now
                </Button>
                <Link to="/documents?sort_by=deadline&sort_order=asc" style={styles.alertLink}>
                  View All →
                </Link>
              </div>
            </div>
          )}
          {stats.urgentDocuments > 0 && (
            <div style={{...styles.alertCard, backgroundColor: '#fef2f2', borderColor: '#fecaca'}}>
              <div style={{...styles.alertIcon, color: '#dc2626'}}>🚨</div>
              <div style={styles.alertContent}>
                <div style={{...styles.alertTitle, color: '#991b1b'}}>{stats.urgentDocuments} Urgent Document{stats.urgentDocuments !== 1 ? 's' : ''}</div>
                <div style={{...styles.alertText, color: '#b91c1c'}}>High priority documents need your review</div>
                {urgentDocs.length > 0 && (
                  <div style={styles.alertDocs}>
                    {urgentDocs.slice(0, 3).map(doc => (
                      <Link key={doc.id} to={`/documents/${doc.id}`} style={{...styles.alertDocLink, color: '#b91c1c'}}>
                        • {doc.document_title || doc.original_filename}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div style={styles.alertActions}>
                <Button as={Link} to="/documents?priority=Urgent" variant="danger" size="sm">
                  View Urgent
                </Button>
                <Link to="/documents?priority=Urgent" style={{...styles.alertLink, color: '#dc2626'}}>
                  View All →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <Link to="/documents" style={styles.statCardLink} className="stat-card">
          <div style={styles.statCardContent}>
            <div style={styles.statIconWrapper} className="stat-icon-neutral">
              <div style={styles.statIcon}>📄</div>
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.totalDocuments}</div>
              <div style={styles.statLabel}>Total Documents</div>
            </div>
          </div>
        </Link>
        
        <Link to="/documents?status=pending" style={styles.statCardLink} className="stat-card">
          <div style={styles.statCardContent}>
            <div style={styles.statIconWrapper} className="stat-icon-neutral">
              <div style={styles.statIcon}>⏳</div>
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statValue}>{stats.pendingDocuments}</div>
              <div style={styles.statLabel}>Pending Documents</div>
            </div>
          </div>
        </Link>
        
        {(user?.role === 'authority' || user?.role === 'admin') && (
          <Link to="/pending" style={styles.statCardLink} className="stat-card">
            <div style={styles.statCardContent}>
              <div style={styles.statIconWrapper} className="stat-icon-neutral">
                <div style={styles.statIcon}>✓</div>
              </div>
              <div style={styles.statInfo}>
                <div style={styles.statValue}>{stats.pendingApprovals}</div>
                <div style={styles.statLabel}>Pending Approvals</div>
              </div>
            </div>
          </Link>
        )}
        
        <Link to="/documents?priority=Urgent" style={styles.statCardLink} className="stat-card">
          <div style={styles.statCardContent}>
            <div style={styles.statIconWrapper} className={stats.urgentDocuments > 0 ? "stat-icon-danger" : "stat-icon-neutral"}>
              <div style={styles.statIcon}>🚨</div>
            </div>
            <div style={styles.statInfo}>
              <div style={{
                ...styles.statValue,
                color: stats.urgentDocuments > 0 ? '#dc2626' : 'var(--text-primary)'
              }}>
                {stats.urgentDocuments}
              </div>
              <div style={styles.statLabel}>Urgent Documents</div>
            </div>
          </div>
        </Link>
        
        <Link to="/documents?sort_by=deadline&sort_order=asc" style={styles.statCardLink} className="stat-card">
          <div style={styles.statCardContent}>
            <div style={styles.statIconWrapper} className={stats.overdueDocuments > 0 ? "stat-icon-warning" : "stat-icon-neutral"}>
              <div style={styles.statIcon}>⚠️</div>
            </div>
            <div style={styles.statInfo}>
              <div style={{
                ...styles.statValue,
                color: stats.overdueDocuments > 0 ? '#ea580c' : 'var(--text-primary)'
              }}>
                {stats.overdueDocuments}
              </div>
              <div style={styles.statLabel}>Overdue Documents</div>
            </div>
          </div>
        </Link>
      </div>

      <div style={styles.contentGrid}>
        {/* My Tasks Section */}
        {myTasks.length > 0 && (
          <Card padding="lg">
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>My Tasks</h2>
              <Link to="/documents?assigned_to=me" style={styles.viewAllLink}>View All →</Link>
            </div>
            <div style={styles.docList}>
              {myTasks.map((doc) => (
                <Link 
                  key={doc.id} 
                  to={`/documents/${doc.id}`} 
                  style={styles.docItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                    e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={styles.docHeader}>
                    <span style={styles.docTitle}>{doc.document_title || doc.original_filename}</span>
                    <Badge variant="primary" size="sm">Assigned</Badge>
                  </div>
                  {doc.currentStage && (
                    <div style={styles.workflowProgress}>
                      <div style={styles.progressLabel}>Current Stage: {doc.currentStage.stage_name}</div>
                      <div style={styles.progressBar}>
                        {doc.workflow && doc.workflow.map((stage, idx) => (
                          <div 
                            key={stage.id}
                            style={{
                              ...styles.progressStep,
                              backgroundColor: stage.status === 'completed' ? '#10b981' : 
                                            stage.id === doc.currentStage.id ? '#3b82f6' : '#e5e7eb',
                              color: stage.status === 'completed' || stage.id === doc.currentStage.id ? 'white' : '#6b7280'
                            }}
                            title={stage.stage_name}
                          >
                            {stage.status === 'completed' ? '✓' : idx + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={styles.docMeta}>
                    <span>{doc.purpose || 'N/A'}</span>
                    {doc.deadline && (
                      <span style={styles.deadline}>Due: {formatDateTime(doc.deadline)}</span>
                    )}
                  </div>
                  <Button 
                    as={Link} 
                    to={`/documents/${doc.id}`} 
                    variant="primary" 
                    size="sm"
                    style={styles.actionButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Take Action
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Urgent Documents */}
        {urgentDocs.length > 0 ? (
          <Card padding="lg">
            <h2 style={styles.sectionTitle}>Urgent Documents</h2>
            <div style={styles.docList}>
              {urgentDocs.map((doc) => (
                <Link 
                  key={doc.id} 
                  to={`/documents/${doc.id}`} 
                  style={styles.docItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.borderColor = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={styles.docHeader}>
                    <span style={styles.docTitle}>{doc.document_title || doc.original_filename}</span>
                    {doc.priority && (
                      <Badge variant={getPriorityVariant(doc.priority)} size="sm">
                        {doc.priority}
                      </Badge>
                    )}
                  </div>
                  <div style={styles.docMeta}>
                    <span>{doc.purpose || 'N/A'}</span>
                    {doc.deadline && (
                      <span style={styles.deadline}>Due: {formatDateTime(doc.deadline)}</span>
                    )}
                  </div>
                  <Button 
                    as={Link} 
                    to={`/documents/${doc.id}`} 
                    variant="danger" 
                    size="sm"
                    style={styles.actionButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Review Now
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Overdue Documents */}
        {overdueDocs.length > 0 ? (
          <Card padding="lg">
            <h2 style={styles.sectionTitle}>Overdue Documents</h2>
            <div style={styles.docList}>
              {overdueDocs.map((doc) => (
                <Link 
                  key={doc.id} 
                  to={`/documents/${doc.id}`} 
                  style={styles.docItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--error-50)';
                    e.currentTarget.style.borderColor = 'var(--error-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={styles.docHeader}>
                    <span style={styles.docTitle}>{doc.document_title || doc.original_filename}</span>
                    <Badge variant="error" size="sm">OVERDUE</Badge>
                  </div>
                  <div style={styles.docMeta}>
                    <span>{doc.purpose || 'N/A'}</span>
                    {doc.deadline && (
                      <span style={{...styles.deadline, color: 'var(--error-600)'}}>
                        Was due: {formatDateTime(doc.deadline)}
                      </span>
                    )}
                  </div>
                  <Button 
                    as={Link} 
                    to={`/documents/${doc.id}`} 
                    variant="danger" 
                    size="sm"
                    style={styles.actionButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Take Action
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 ? (
          <Card padding="lg">
            <h2 style={styles.sectionTitle}>Upcoming Deadlines</h2>
            <div style={styles.deadlineList}>
              {upcomingDeadlines.map((doc) => (
                <Link 
                  key={doc.id} 
                  to={`/documents/${doc.id}`} 
                  style={styles.deadlineItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                    e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
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
          </Card>
        ) : null}

        {/* Classification Breakdown */}
        <Card padding="lg">
          <h2 style={styles.sectionTitle}>By Classification</h2>
          {Object.keys(classificationBreakdown).length > 0 ? (
            <div style={styles.breakdownList}>
              {Object.entries(classificationBreakdown).map(([key, value]) => (
                <div key={key} style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>{key}</span>
                  <Badge variant="default" size="sm">{value}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="No classification data available" />
          )}
        </Card>

        {/* Unit Breakdown */}
        <Card padding="lg">
          <h2 style={styles.sectionTitle}>By Unit</h2>
          {Object.keys(unitBreakdown).length > 0 ? (
            <div style={styles.breakdownList}>
              {Object.entries(unitBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([key, value]) => (
                  <div key={key} style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>{key}</span>
                    <Badge variant="default" size="sm">{value}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState description="No unit data available" />
          )}
        </Card>

        {/* Priority Breakdown */}
        <Card padding="lg">
          <h2 style={styles.sectionTitle}>By Priority</h2>
          <div style={styles.breakdownList}>
            {['Emergency', 'Priority', 'Urgent', 'Routine'].map((priority) => (
              <div key={priority} style={styles.breakdownItem}>
                <Badge variant={getPriorityVariant(priority)} size="sm">
                  {priority}
                </Badge>
                <span style={styles.breakdownValue}>{priorityBreakdown[priority] || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <Button as={Link} to="/documents" variant="primary" size="lg" fullWidth>
            Upload Document
          </Button>
          {(user?.role === 'authority' || user?.role === 'admin') && (
            <Button as={Link} to="/pending" variant="outline" size="lg" fullWidth>
              Review Pending
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: 'var(--spacing-8)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-2)',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
  },
  searchSection: {
    marginBottom: 'var(--spacing-6)',
  },
  searchBar: {
    display: 'flex',
    gap: 'var(--spacing-3)',
    marginBottom: 'var(--spacing-3)',
  },
  searchInput: {
    flex: 1,
    padding: 'var(--spacing-3) var(--spacing-4)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  searchButton: {
    flexShrink: 0,
  },
  quickFilters: {
    display: 'flex',
    gap: 'var(--spacing-2)',
    flexWrap: 'wrap',
  },
  filterChip: {
    padding: 'var(--spacing-2) var(--spacing-3)',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    transition: 'all 0.2s ease',
  },
  alerts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
    marginBottom: 'var(--spacing-8)',
  },
  alertCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--spacing-4)',
    padding: 'var(--spacing-4) var(--spacing-5)',
    backgroundColor: 'var(--warning-50)',
    border: '1px solid var(--warning-200)',
    borderRadius: 'var(--radius-lg)',
  },
  alertIcon: {
    fontSize: 'var(--text-2xl)',
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--warning-800)',
    marginBottom: 'var(--spacing-1)',
  },
  alertText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--warning-700)',
    marginBottom: 'var(--spacing-2)',
  },
  alertDocs: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-1)',
    marginTop: 'var(--spacing-2)',
  },
  alertDocLink: {
    fontSize: 'var(--text-xs)',
    color: 'var(--warning-700)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  alertActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-2)',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  alertLink: {
    color: 'var(--warning-600)',
    textDecoration: 'none',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    transition: 'color 0.2s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--spacing-4)',
    marginBottom: 'var(--spacing-8)',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'var(--spacing-5)',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    display: 'block',
  },
  statCardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  statCardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-4)',
  },
  statIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIcon: {
    fontSize: '24px',
    lineHeight: '1',
  },
  statInfo: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-1)',
    lineHeight: '1.2',
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    lineHeight: '1.4',
  },
  statLink: {
    display: 'inline-block',
    marginTop: 'var(--spacing-2)',
    color: 'var(--primary-500)',
    textDecoration: 'none',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    transition: 'color 0.2s ease',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: 'var(--spacing-6)',
    marginBottom: 'var(--spacing-8)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-4)',
  },
  sectionTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--text-primary)',
    margin: 0,
  },
  viewAllLink: {
    color: 'var(--primary-500)',
    textDecoration: 'none',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    transition: 'color 0.2s ease',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-3)',
  },
  docItem: {
    padding: 'var(--spacing-3)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all var(--transition-base)',
    backgroundColor: 'var(--bg-primary)',
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-2)',
    gap: 'var(--spacing-2)',
  },
  docTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
    flex: 1,
  },
  docMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    gap: 'var(--spacing-4)',
  },
  deadline: {
    fontSize: 'var(--text-xs)',
  },
  workflowProgress: {
    marginTop: 'var(--spacing-2)',
    marginBottom: 'var(--spacing-2)',
  },
  progressLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--spacing-2)',
  },
  progressBar: {
    display: 'flex',
    gap: 'var(--spacing-1)',
    alignItems: 'center',
  },
  progressStep: {
    flex: 1,
    height: '24px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    transition: 'all 0.2s ease',
  },
  actionButton: {
    marginTop: 'var(--spacing-2)',
    width: '100%',
  },
  deadlineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-3)',
  },
  deadlineItem: {
    display: 'flex',
    gap: 'var(--spacing-4)',
    padding: 'var(--spacing-3)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all var(--transition-base)',
    backgroundColor: 'var(--bg-primary)',
  },
  deadlineDate: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--primary-500)',
    minWidth: '80px',
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-1)',
  },
  deadlineMeta: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-3)',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-3)',
    backgroundColor: 'var(--gray-50)',
    borderRadius: 'var(--radius-md)',
  },
  breakdownLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
  },
  breakdownValue: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--text-primary)',
  },
  quickActions: {
    marginTop: 'var(--spacing-8)',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--spacing-4)',
  },
};

export default Dashboard;
