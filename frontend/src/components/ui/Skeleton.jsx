import React from 'react';

const Skeleton = ({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  className = '',
  ...props
}) => {
  const baseStyle = {
    backgroundColor: 'var(--gray-200)',
    borderRadius: variant === 'circular' ? '50%' : 'var(--radius-md)',
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'circular' ? width : '1rem'),
    animation: animation === 'pulse' ? 'skeleton-pulse 1.5s ease-in-out infinite' : 'none',
  };

  // Add animation if not already present
  if (typeof document !== 'undefined' && animation === 'pulse') {
    const styleId = 'skeleton-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  return <div className={className} style={baseStyle} aria-hidden="true" {...props} />;
};

// Preset skeleton components
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="0.75rem"
        width={i === lines - 1 ? '75%' : '100%'}
        className={className}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div
    style={{
      padding: 'var(--spacing-4)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--bg-primary)',
    }}
    className={className}
  >
    <Skeleton height="1.5rem" width="60%" style={{ marginBottom: 'var(--spacing-4)' }} />
    <SkeletonText lines={3} />
  </div>
);

export default Skeleton;
