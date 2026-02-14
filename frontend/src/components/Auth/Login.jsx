import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'signingportal_previous_logins';
const MAX_SAVED_LOGINS = 10;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [previousLogins, setPreviousLogins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load previous logins and last used email on mount
  useEffect(() => {
    const savedLogins = localStorage.getItem(STORAGE_KEY);
    if (savedLogins) {
      try {
        const logins = JSON.parse(savedLogins);
        setPreviousLogins(logins);
        // Set the most recent email if available
        if (logins.length > 0) {
          setEmail(logins[0]);
        }
      } catch (e) {
        console.error('Error loading previous logins:', e);
      }
    }
  }, []);

  // Save email to previous logins
  const saveEmailToHistory = (emailToSave) => {
    if (!emailToSave || !emailToSave.trim()) return;
    
    const trimmedEmail = emailToSave.trim().toLowerCase();
    let updatedLogins = [...previousLogins];
    
    // Remove if already exists
    updatedLogins = updatedLogins.filter(e => e.toLowerCase() !== trimmedEmail);
    
    // Add to beginning
    updatedLogins.unshift(trimmedEmail);
    
    // Keep only the most recent ones
    updatedLogins = updatedLogins.slice(0, MAX_SAVED_LOGINS);
    
    setPreviousLogins(updatedLogins);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogins));
  };

  // Handle email selection from suggestions
  const handleEmailSelect = (selectedEmail) => {
    setEmail(selectedEmail);
    setShowEmailSuggestions(false);
    emailInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(event.target)
      ) {
        setShowEmailSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Save email to history on successful login
      saveEmailToHistory(email);
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Filter suggestions based on current input
  const filteredSuggestions = previousLogins.filter(loginEmail =>
    loginEmail.toLowerCase().includes(email.toLowerCase()) &&
    loginEmail.toLowerCase() !== email.toLowerCase()
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>SigningPortal</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShowEmailSuggestions(true);
                }}
                onFocus={() => {
                  if (previousLogins.length > 0) {
                    setShowEmailSuggestions(true);
                  }
                }}
                required
                style={styles.input}
                placeholder="name@example.com"
                autoComplete="email"
                list="email-suggestions"
              />
              {showEmailSuggestions && filteredSuggestions.length > 0 && (
                <div ref={suggestionsRef} style={styles.suggestions}>
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={styles.suggestionItem}
                      onClick={() => handleEmailSelect(suggestion)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={styles.suggestionIcon}>📧</span>
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {previousLogins.length > 0 && (
              <div style={styles.previousLoginsHint}>
                {previousLogins.length} previous login{previousLogins.length !== 1 ? 's' : ''} saved
              </div>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.passwordInput}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Remember me</span>
            </label>
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.linkText}>
          Don't have an account? <Link to="/register" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '1rem'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid #e2e8f0'
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center'
  },
  title: {
    marginBottom: '0.5rem',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.875rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  inputWrapper: {
    position: 'relative',
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%'
  },
  passwordInput: {
    width: '100%',
    padding: '0.75rem 2.75rem 0.75rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  },
  passwordToggle: {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'color 0.2s ease',
    outline: 'none',
    borderRadius: '4px'
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    marginTop: '0.25rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto'
  },
  suggestionItem: {
    padding: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#374151',
    transition: 'background-color 0.15s ease'
  },
  suggestionIcon: {
    fontSize: '0.875rem'
  },
  previousLoginsHint: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic'
  },
  checkboxGroup: {
    marginBottom: '1rem'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    userSelect: 'none'
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
    accentColor: '#2563eb'
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s ease'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1.25rem',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  },
  linkText: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#64748b',
    fontSize: '0.875rem'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

export default Login;
