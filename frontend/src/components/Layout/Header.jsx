import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '../Notifications/NotificationCenter';

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
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h14M3 10h14M3 15h14"/>
            </svg>
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
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '0.875rem 0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  menuButton: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuButtonVisible: {
    display: 'flex'
  },
  logo: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.025em'
  },
  logoMobile: {
    fontSize: '1.125rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  userName: {
    fontWeight: '500',
    fontSize: '0.875rem'
  },
  divider: {
    opacity: 0.4,
    fontSize: '0.875rem'
  },
  userRole: {
    fontSize: '0.8125rem',
    opacity: 0.8,
    textTransform: 'capitalize'
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  },
  logoutButtonMobile: {
    padding: '0.5rem 0.875rem',
    fontSize: '0.8125rem'
  }
};

export default Header;
