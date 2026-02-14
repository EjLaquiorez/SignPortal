import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/documents', label: 'Documents' },
    ...(user?.role === ROLES.AUTHORITY || user?.role === ROLES.ADMIN
      ? [{ path: '/pending', label: 'Pending Approvals' }]
      : []),
    ...(user?.role === ROLES.ADMIN
      ? [{ path: '/admin', label: 'Administration' }]
      : [])
  ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {})
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 60px)',
    padding: '1.5rem 0',
    borderRight: '1px solid #e2e8f0',
    height: '100%',
    overflowY: 'auto'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0 0.5rem'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    color: '#64748b',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '6px',
    margin: '0 0.5rem'
  },
  navItemActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600'
  }
};

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .navItem:hover:not(.navItemActive) {
      background-color: #f8fafc;
      color: #1e293b;
    }
    @media (max-width: 768px) {
      .sidebar {
        box-shadow: 2px 0 8px rgba(0,0,0,0.08);
      }
    }
  `;
  document.head.appendChild(style);
}

export default Sidebar;
