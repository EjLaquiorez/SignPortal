import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Card from '../ui/Card';

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
  const { success, error: showError } = useToast();
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
      success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(result.error);
      showError(result.error || 'Login failed');
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
      <Card padding="xl" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={styles.header}>
          <h1 style={styles.title}>SigningPortal</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>
        {error && (
          <div style={styles.error} role="alert">{error}</div>
        )}
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
                        e.currentTarget.style.backgroundColor = 'var(--gray-100)';
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
                  e.currentTarget.style.color = 'var(--primary-500)';
                  e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--gray-500)';
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
          <Button 
            type="submit" 
            disabled={loading}
            loading={loading}
            fullWidth
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p style={styles.linkText}>
          Don't have an account? <Link to="/register" style={styles.link}>Create one</Link>
        </p>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-secondary)',
    padding: 'var(--spacing-4)',
  },
  header: {
    marginBottom: 'var(--spacing-8)',
    textAlign: 'center',
  },
  title: {
    marginBottom: 'var(--spacing-2)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--text-primary)',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: 'var(--spacing-5)',
  },
  label: {
    display: 'block',
    marginBottom: 'var(--spacing-2)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 'var(--spacing-3)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    padding: 'var(--spacing-3) var(--spacing-10) var(--spacing-3) var(--spacing-3)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
  },
  passwordToggle: {
    position: 'absolute',
    right: 'var(--spacing-2)',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 'var(--spacing-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray-500)',
    transition: 'color var(--transition-base)',
    outline: 'none',
    borderRadius: 'var(--radius-sm)',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    marginTop: 'var(--spacing-1)',
    boxShadow: 'var(--shadow-md)',
    zIndex: 'var(--z-dropdown)',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  suggestionItem: {
    padding: 'var(--spacing-3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    transition: 'background-color var(--transition-fast)',
  },
  suggestionIcon: {
    fontSize: 'var(--text-sm)',
  },
  previousLoginsHint: {
    marginTop: 'var(--spacing-2)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  checkboxGroup: {
    marginBottom: 'var(--spacing-4)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    userSelect: 'none',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
    accentColor: 'var(--primary-500)',
  },
  error: {
    backgroundColor: 'var(--error-50)',
    color: 'var(--error-700)',
    padding: 'var(--spacing-3)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--spacing-5)',
    fontSize: 'var(--text-sm)',
    border: '1px solid var(--error-200)',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 'var(--spacing-6)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
  },
  link: {
    color: 'var(--primary-500)',
    textDecoration: 'none',
    fontWeight: 'var(--font-medium)',
  },
};

export default Login;
