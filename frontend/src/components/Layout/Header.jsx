import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '../Notifications/NotificationCenter';
import Icon from '../ui/Icon';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.leftSection}>
          <button 
            onClick={onMenuClick} 
            style={{
              ...styles.menuButton,
              ...(isMobile ? styles.menuButtonVisible : {})
            }}
            className="menu-button"
            aria-label="Toggle menu"
            aria-expanded="false"
          >
            <Icon name="menu" size={20} color="white" />
          </button>
          <h1 style={{
            ...styles.logo,
            ...(isMobile ? styles.logoMobile : {})
          }}>
            SigningPortal
          </h1>
        </div>
        <div style={styles.userInfo}>
          {!isMobile && (
            <>
              <span style={styles.userName}>{user?.name}</span>
              <span style={styles.divider}>|</span>
              <span style={styles.userRole}>{user?.role}</span>
            </>
          )}
          <NotificationCenter />
          <button 
            onClick={handleLogout} 
            style={{
              ...styles.logoutButton,
              ...(isMobile ? styles.logoutButtonMobile : {})
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: 'var(--gray-900)',
    color: 'white',
    padding: 'var(--spacing-4) 0',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-sticky)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '0 var(--spacing-6)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--spacing-4)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-4)',
  },
  menuButton: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: 'var(--spacing-2)',
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition-base)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    minHeight: '40px',
  },
  menuButtonVisible: {
    display: 'flex',
  },
  logo: {
    margin: 0,
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.025em',
    color: 'white',
  },
  logoMobile: {
    fontSize: 'var(--text-lg)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    flexWrap: 'wrap',
  },
  userName: {
    fontWeight: 'var(--font-medium)',
    fontSize: 'var(--text-sm)',
    color: 'white',
  },
  divider: {
    opacity: 0.4,
    fontSize: 'var(--text-sm)',
    color: 'white',
  },
  userRole: {
    fontSize: 'var(--text-xs)',
    opacity: 0.8,
    textTransform: 'capitalize',
    color: 'white',
  },
  logoutButton: {
    padding: 'var(--spacing-2) var(--spacing-4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    whiteSpace: 'nowrap',
    transition: 'all var(--transition-base)',
    fontWeight: 'var(--font-medium)',
    minHeight: '40px',
  },
  logoutButtonMobile: {
    padding: 'var(--spacing-2) var(--spacing-3)',
    fontSize: 'var(--text-xs)',
  }
};

export default Header;
