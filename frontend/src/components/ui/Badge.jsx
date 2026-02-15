import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-medium)',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
  };

  const variants = {
    default: {
      backgroundColor: 'var(--gray-100)',
      color: 'var(--gray-900)',
    },
    primary: {
      backgroundColor: 'var(--primary-100)',
      color: 'var(--primary-700)',
    },
    success: {
      backgroundColor: 'var(--success-100)',
      color: 'var(--success-700)',
    },
    warning: {
      backgroundColor: 'var(--warning-100)',
      color: 'var(--warning-700)',
    },
    error: {
      backgroundColor: 'var(--error-100)',
      color: 'var(--error-700)',
    },
    info: {
      backgroundColor: 'var(--info-100)',
      color: 'var(--info-700)',
    },
    solid: {
      backgroundColor: 'var(--primary-500)',
      color: 'white',
    },
  };

  const sizes = {
    sm: {
      padding: '0.125rem 0.5rem',
      fontSize: 'var(--text-xs)',
      minHeight: '20px',
    },
    md: {
      padding: '0.25rem 0.75rem',
      fontSize: 'var(--text-xs)',
      minHeight: '24px',
    },
    lg: {
      padding: '0.375rem 1rem',
      fontSize: 'var(--text-sm)',
      minHeight: '28px',
    },
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.md;

  const combinedStyle = {
    ...baseStyles,
    ...variantStyle,
    ...sizeStyle,
    ...props.style,
  };

  return (
    <span className={className} style={combinedStyle} {...props}>
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            marginRight: 'var(--spacing-1)',
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
