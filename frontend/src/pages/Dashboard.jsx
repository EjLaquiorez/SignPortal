import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentsAPI, workflowAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingDocuments: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [documentsRes, pendingRes] = await Promise.all([
          documentsAPI.list(),
          user?.role === 'authority' || user?.role === 'admin' 
            ? workflowAPI.getPending() 
            : Promise.resolve({ data: { pendingApprovals: [] } })
        ]);

        const documents = documentsRes.data.documents || [];
        const pendingApprovals = pendingRes.data.pendingApprovals || [];

        setStats({
          totalDocuments: documents.length,
          pendingDocuments: documents.filter(d => d.status === 'pending').length,
          pendingApprovals: pendingApprovals.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

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
      </div>

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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '1.75rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
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
  quickActions: {
    marginTop: '2rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem'
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

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .actionCard:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
}

export default Dashboard;
