import { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.list({ limit: 10 });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    if (notification.document_id) {
      return `/documents/${notification.document_id}`;
    }
    return '#';
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        style={styles.bellButton}
        aria-label="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <h3 style={styles.dropdownTitle}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={styles.markAllButton}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={styles.notificationsList}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={styles.empty}>No notifications</div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                    setIsOpen(false);
                  }}
                  style={{
                    ...styles.notificationItem,
                    backgroundColor: notification.is_read ? 'white' : '#eff6ff'
                  }}
                >
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    <div style={styles.notificationMeta}>
                      <span style={styles.notificationTime}>
                        {formatDateTime(notification.created_at)}
                      </span>
                      {!notification.is_read && (
                        <span style={styles.unreadDot}></span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={styles.dropdownFooter}>
              <Link to="/notifications" style={styles.viewAllLink}>
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative'
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease'
  },
  badge: {
    position: 'absolute',
    top: '0',
    right: '0',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '10px',
    padding: '0.125rem 0.375rem',
    fontSize: '0.625rem',
    fontWeight: '700',
    minWidth: '1.25rem',
    textAlign: 'center',
    lineHeight: '1.25rem'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    width: '360px',
    maxWidth: '90vw',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
    zIndex: 1000,
    maxHeight: '500px',
    display: 'flex',
    flexDirection: 'column'
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0'
  },
  dropdownTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  markAllButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: '500',
    padding: 0
  },
  notificationsList: {
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  notificationItem: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background-color 0.2s ease',
    display: 'block'
  },
  notificationContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  notificationMessage: {
    fontSize: '0.875rem',
    color: '#1f2937',
    lineHeight: '1.5'
  },
  notificationMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#64748b'
  },
  notificationTime: {
    fontSize: '0.75rem'
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#2563eb'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem'
  },
  empty: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem'
  },
  dropdownFooter: {
    padding: '0.75rem 1rem',
    borderTop: '1px solid #e2e8f0',
    textAlign: 'center'
  },
  viewAllLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500'
  }
};

export default NotificationCenter;
