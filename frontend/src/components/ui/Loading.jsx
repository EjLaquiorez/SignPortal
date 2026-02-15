import React from 'react';

const Loading = ({ size = 'md', fullScreen = false, text, className = '' }) => {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
  };

  const spinnerSize = sizes[size] || sizes.md;

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: `3px solid var(--gray-200)`,
    borderTopColor: 'var(--primary-500)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 'var(--z-modal)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-8)',
        gap: 'var(--spacing-4)',
      };

  return (
    <div className={className} style={containerStyle} role="status" aria-live="polite">
      <div style={spinnerStyle} aria-hidden="true" />
      {text && (
        <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {text}
        </p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
};

// Add spinner animation to global styles if not already present
if (typeof document !== 'undefined') {
  const styleId = 'loading-spinner-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);
  }
}

export default Loading;
