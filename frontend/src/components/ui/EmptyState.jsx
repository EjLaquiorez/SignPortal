import React from 'react';

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
  ...props
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-12) var(--spacing-4)',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  };

  const iconStyle = {
    fontSize: '3rem',
    marginBottom: 'var(--spacing-4)',
    opacity: 0.5,
  };

  const titleStyle = {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-2)',
  };

  const descriptionStyle = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    marginBottom: action ? 'var(--spacing-6)' : 0,
    maxWidth: '400px',
  };

  return (
    <div className={className} style={containerStyle} {...props}>
      {icon && <div style={iconStyle}>{icon}</div>}
      {title && <h3 style={titleStyle}>{title}</h3>}
      {description && <p style={descriptionStyle}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
