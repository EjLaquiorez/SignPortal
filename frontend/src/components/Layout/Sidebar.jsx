import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import Icon from '../ui/Icon';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/upload', label: 'Upload Document', icon: 'upload' },
    { path: '/documents', label: 'Documents', icon: 'documents' },
    ...(user?.role === ROLES.AUTHORITY || user?.role === ROLES.ADMIN
      ? [{ path: '/pending', label: 'Pending Approvals', icon: 'pending' }]
      : []),
    ...(user?.role === ROLES.ADMIN
      ? [{ path: '/admin', label: 'Administration', icon: 'admin' }]
      : [])
  ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside style={styles.sidebar} aria-label="Main navigation">
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
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {item.icon && (
                <Icon
                  name={item.icon}
                  size={20}
                  color={isActive ? 'var(--primary-600)' : 'var(--gray-500)'}
                  style={{ marginRight: 'var(--spacing-3)' }}
                />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-primary)',
    minHeight: 'calc(100vh - 64px)',
    padding: 'var(--spacing-4) 0',
    borderRight: '1px solid var(--border-color)',
    height: '100%',
    overflowY: 'auto',
    boxShadow: 'inset -1px 0 0 var(--border-color)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-1)',
    padding: '0 var(--spacing-2)',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--spacing-3) var(--spacing-4)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all var(--transition-base)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    borderRadius: 'var(--radius-md)',
    margin: '0 var(--spacing-2)',
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'var(--primary-50)',
    color: 'var(--primary-600)',
    fontWeight: 'var(--font-semibold)',
  }
};

// Add hover effect via inline styles in component

export default Sidebar;
