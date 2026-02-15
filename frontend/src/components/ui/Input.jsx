import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'md',
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
  style,
  ...props
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: size === 'sm' ? 'var(--spacing-2) var(--spacing-3)' : 'var(--spacing-3) var(--spacing-4)',
    fontSize: 'var(--text-sm)',
    border: `1px solid ${error ? 'var(--error-500)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    backgroundColor: disabled ? 'var(--gray-50)' : 'var(--bg-primary)',
    color: 'var(--text-primary)',
    transition: 'all var(--transition-base)',
    ...style,
  };

  const labelStyles = {
    display: 'block',
    marginBottom: 'var(--spacing-2)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
  };

  const errorStyles = {
    marginTop: 'var(--spacing-1)',
    fontSize: 'var(--text-xs)',
    color: 'var(--error-600)',
  };

  const helperTextStyles = {
    marginTop: 'var(--spacing-1)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', marginBottom: 'var(--spacing-4)' }}>
      {label && (
        <label htmlFor={inputId} style={labelStyles}>
          {label}
          {required && <span style={{ color: 'var(--error-500)', marginLeft: 'var(--spacing-1)' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={className}
        style={inputStyles}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || helperText ? `${inputId}-help` : undefined}
        {...props}
      />
      {(error || helperText) && (
        <div id={`${inputId}-help`} style={error ? errorStyles : helperTextStyles}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default Input;
