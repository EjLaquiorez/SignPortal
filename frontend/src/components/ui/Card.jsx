import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all var(--transition-base)',
    ...(onClick && { cursor: 'pointer' }),
  };

  const variants = {
    default: {},
    elevated: {
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      boxShadow: 'none',
      borderWidth: '2px',
    },
    flat: {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: 'var(--bg-secondary)',
    },
  };

  const paddings = {
    none: { padding: 0 },
    sm: { padding: 'var(--spacing-3)' },
    md: { padding: 'var(--spacing-4)' },
    lg: { padding: 'var(--spacing-6)' },
    xl: { padding: 'var(--spacing-8)' },
  };

  const hoverStyle = hover
    ? {
        '&:hover': {
          boxShadow: 'var(--shadow-md)',
          transform: 'translateY(-2px)',
        },
      }
    : {};

  const combinedStyle = {
    ...baseStyles,
    ...variants[variant],
    ...paddings[padding],
    ...(hover && {
      ':hover': {
        boxShadow: 'var(--shadow-md)',
        transform: 'translateY(-2px)',
      },
    }),
    ...props.style,
  };

  const handleMouseEnter = (e) => {
    if (hover && !onClick) {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }
  };

  const handleMouseLeave = (e) => {
    if (hover && !onClick) {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  const Component = onClick ? 'div' : 'div';
  const role = onClick ? 'button' : undefined;
  const tabIndex = onClick ? 0 : undefined;

  return (
    <Component
      className={className}
      style={combinedStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
