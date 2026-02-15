import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  as,
  to,
  href,
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-medium)',
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-base)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    textDecoration: 'none',
    position: 'relative',
    ...(fullWidth && { width: '100%' }),
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary-500)',
      color: 'white',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--primary-600)',
      },
      '&:active:not(:disabled)': {
        backgroundColor: 'var(--primary-700)',
      },
    },
    secondary: {
      backgroundColor: 'var(--gray-100)',
      color: 'var(--gray-900)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--gray-200)',
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary-500)',
      border: '1px solid var(--primary-500)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--primary-50)',
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--gray-700)',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--gray-100)',
      },
    },
    danger: {
      backgroundColor: 'var(--error-500)',
      color: 'white',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--error-600)',
      },
    },
    success: {
      backgroundColor: 'var(--success-500)',
      color: 'white',
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--success-600)',
      },
    },
  };

  const sizes = {
    sm: {
      padding: 'var(--spacing-2) var(--spacing-3)',
      fontSize: 'var(--text-sm)',
      minHeight: '32px',
    },
    md: {
      padding: 'var(--spacing-3) var(--spacing-4)',
      fontSize: 'var(--text-sm)',
      minHeight: '40px',
    },
    lg: {
      padding: 'var(--spacing-4) var(--spacing-6)',
      fontSize: 'var(--text-base)',
      minHeight: '48px',
    },
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  const combinedStyle = {
    ...baseStyles,
    ...variantStyle,
    ...sizeStyle,
    opacity: disabled || loading ? 0.6 : 1,
    ...props.style,
  };

  const buttonContent = (
    <>
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            marginRight: children ? 'var(--spacing-2)' : 0,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  // Support rendering as Link or anchor
  if (as === 'a' || href) {
    return (
      <a
        href={href || to}
        className={className}
        style={combinedStyle}
        aria-busy={loading}
        {...props}
      >
        {buttonContent}
      </a>
    );
  }

  if (as === Link || (as && to)) {
    const LinkComponent = as || Link;
    return (
      <LinkComponent
        to={to}
        className={className}
        style={combinedStyle}
        aria-busy={loading}
        {...props}
      >
        {buttonContent}
      </LinkComponent>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={combinedStyle}
      aria-busy={loading}
      {...props}
    >
      {buttonContent}
    </button>
  );
};

export default Button;
