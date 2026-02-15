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
      <a href="#main-content" className="skip-link">Skip to main content</a>
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
        <main 
          id="main-content"
          style={{
            ...styles.main,
            ...(isMobile ? styles.mainMobile : {})
          }}
          role="main"
        >
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
    backgroundColor: 'var(--bg-secondary)',
  },
  content: {
    display: 'flex',
    flex: 1,
    position: 'relative',
  },
  sidebarWrapper: {
    width: '260px',
    backgroundColor: 'var(--bg-primary)',
    borderRight: '1px solid var(--border-color)',
    transition: 'transform var(--transition-slow)',
    zIndex: 'var(--z-dropdown)',
    flexShrink: 0,
  },
  sidebarWrapperMobile: {
    position: 'fixed',
    top: '64px',
    left: 0,
    height: 'calc(100vh - 64px)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 'var(--z-dropdown)',
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  sidebarClosed: {
    transform: 'translateX(-100%)',
  },
  sidebarContent: {
    height: '100%',
  },
  overlay: {
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 'calc(var(--z-dropdown) - 1)',
    transition: 'opacity var(--transition-base)',
  },
  main: {
    flex: 1,
    padding: 'var(--spacing-8)',
    backgroundColor: 'var(--bg-primary)',
    width: '100%',
    minHeight: 'calc(100vh - 64px)',
    overflowX: 'auto',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  mainMobile: {
    padding: 'var(--spacing-4)',
  }
};

export default Layout;
