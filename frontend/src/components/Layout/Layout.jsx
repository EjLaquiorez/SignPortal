import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.sidebar-content') && !e.target.closest('.menu-button')) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen, isMobile]);

  return (
    <div style={styles.container}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div style={styles.content}>
        <div 
          className="sidebar-wrapper"
          style={{
            ...styles.sidebarWrapper,
            ...(isMobile ? styles.sidebarWrapperMobile : {}),
            ...(sidebarOpen || !isMobile ? styles.sidebarOpen : styles.sidebarClosed)
          }}
        >
          <div 
            className="sidebar-content"
            style={styles.sidebarContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
        {sidebarOpen && isMobile && (
          <div 
            style={styles.overlay} 
            onClick={() => setSidebarOpen(false)} 
          />
        )}
        <main style={{
          ...styles.main,
          ...(isMobile ? styles.mainMobile : {})
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc'
  },
  content: {
    display: 'flex',
    flex: 1,
    position: 'relative'
  },
  sidebarWrapper: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 999,
    flexShrink: 0
  },
  sidebarWrapperMobile: {
    position: 'fixed',
    top: '60px',
    left: 0,
    height: 'calc(100vh - 60px)',
    boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
    zIndex: 999
  },
  sidebarOpen: {
    transform: 'translateX(0)'
  },
  sidebarClosed: {
    transform: 'translateX(-100%)'
  },
  sidebarContent: {
    height: '100%'
  },
  overlay: {
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 998
  },
  main: {
    flex: 1,
    padding: '2rem',
    backgroundColor: '#ffffff',
    width: '100%',
    minHeight: 'calc(100vh - 60px)',
    overflowX: 'auto'
  },
  mainMobile: {
    padding: '1.25rem'
  }
};

export default Layout;
