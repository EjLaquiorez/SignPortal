import React from 'react';

const PNPLogo = ({ size = 28, ...props }) => {
  // Calculate height to maintain aspect ratio (SVG is 224.15 x 312.702)
  const aspectRatio = 312.702 / 224.15;
  const height = size * aspectRatio;
  
  return (
    <img
      src="/pnp-logo.svg"
      alt="Philippine National Police Logo"
      style={{
        width: `${size}px`,
        height: `${height}px`,
        display: 'block',
        objectFit: 'contain',
        flexShrink: 0
      }}
      {...props}
    />
  );
};

export default PNPLogo;
