import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-4)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    minWidth: '300px',
    maxWidth: '400px',
    pointerEvents: 'auto',
    transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
    opacity: isVisible && !isExiting ? 1 : 0,
    transition: 'all var(--transition-slow)',
  };

  const typeStyles = {
    success: {
      borderLeft: '4px solid var(--success-500)',
    },
    error: {
      borderLeft: '4px solid var(--error-500)',
    },
    warning: {
      borderLeft: '4px solid var(--warning-500)',
    },
    info: {
      borderLeft: '4px solid var(--info-500)',
    },
  };

  const iconColors = {
    success: 'var(--success-500)',
    error: 'var(--error-500)',
    warning: 'var(--warning-500)',
    info: 'var(--info-500)',
  };

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 10l4-4m0 4l-4 4m4-4H6" />
        <circle cx="10" cy="10" r="9" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="9" />
        <path d="M10 6v4M10 14h.01" />
      </svg>
    ),
  };

  const combinedStyle = {
    ...baseStyle,
    ...typeStyles[type],
  };

  return (
    <div style={combinedStyle} role="alert">
      <div style={{ color: iconColors[type], flexShrink: 0 }}>{icons[type]}</div>
      <div style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{message}</div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--spacing-1)',
          color: 'var(--gray-400)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4L4 12M4 4l8 8" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
