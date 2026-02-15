import { useEffect } from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'OK', cancelText = 'Cancel', confirmColor = '#10b981' }) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={styles.header}>
            <h3 style={styles.title}>{title}</h3>
          </div>
        )}
        <div style={styles.content}>
          <p style={styles.message}>{message}</p>
        </div>
        <div style={styles.footer}>
          <button
            onClick={onClose}
            style={styles.cancelButton}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              ...styles.confirmButton,
              backgroundColor: confirmColor
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.2s ease-out',
    overflow: 'hidden'
  },
  header: {
    padding: '1.5rem 1.5rem 1rem 1.5rem',
    borderBottom: '1px solid #e2e8f0'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  content: {
    padding: '1.5rem',
    flex: 1
  },
  message: {
    margin: 0,
    fontSize: '0.9375rem',
    color: '#4b5563',
    lineHeight: '1.5'
  },
  footer: {
    padding: '1rem 1.5rem 1.5rem 1.5rem',
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    borderTop: '1px solid #e2e8f0'
  },
  cancelButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    minWidth: '80px'
  },
  confirmButton: {
    padding: '0.625rem 1.25rem',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    minWidth: '80px'
  }
};

// Add animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
        }
    }
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    button:hover {
      opacity: 0.9;
    }
  `;
  if (!document.head.querySelector('#confirmation-modal-styles')) {
    style.id = 'confirmation-modal-styles';
    document.head.appendChild(style);
  }
}

export default ConfirmationModal;
