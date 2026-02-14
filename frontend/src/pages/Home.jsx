import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>SigningPortal</h1>
          <div style={styles.headerActions}>
            {isAuthenticated ? (
              <>
                <span style={styles.welcomeText}>Welcome, {user?.name}</span>
                <Link to="/dashboard" style={styles.headerButton}>
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.headerButton}>
                  Sign In
                </Link>
                <Link to="/register" style={styles.headerButtonSecondary}>
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <h2 style={styles.heroTitle}>Secure Document Signing & Approval</h2>
          <p style={styles.heroSubtitle}>
            Streamline your document workflow with multi-stage approval processes. 
            Personnel sign first, then authority confirms - all in one secure platform.
          </p>
          <div style={styles.heroActions}>
            {isAuthenticated ? (
              <Link to="/dashboard" style={styles.ctaButton}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" style={styles.ctaButton}>
                  Get Started
                </Link>
                <Link to="/register" style={styles.ctaButtonSecondary}>
                  Create Account
                </Link>
              </>
            )}
          </div>
        </section>

        <section style={styles.features}>
          <h2 style={styles.sectionTitle}>Key Features</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>DM</div>
              <h3 style={styles.featureTitle}>Document Management</h3>
              <p style={styles.featureDescription}>
                Upload, organize, and track important documents through their entire lifecycle.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>DS</div>
              <h3 style={styles.featureTitle}>Digital Signatures</h3>
              <p style={styles.featureDescription}>
                Capture signatures digitally with our intuitive signature pad or upload your signature image.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>WS</div>
              <h3 style={styles.featureTitle}>Workflow Stages</h3>
              <p style={styles.featureDescription}>
                Multi-stage approval process ensures proper authorization before final confirmation.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>RB</div>
              <h3 style={styles.featureTitle}>Role-Based Access</h3>
              <p style={styles.featureDescription}>
                Personnel, Authority, and Admin roles with appropriate permissions and access controls.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>TH</div>
              <h3 style={styles.featureTitle}>Tracking & History</h3>
              <p style={styles.featureDescription}>
                Complete audit trail of all document activities, signatures, and status changes.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>SS</div>
              <h3 style={styles.featureTitle}>Secure Storage</h3>
              <p style={styles.featureDescription}>
                All documents and signatures are securely stored with encrypted data protection.
              </p>
            </div>
          </div>
        </section>

        <section style={styles.workflow}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.workflowSteps}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Upload Document</h3>
              <p style={styles.stepDescription}>
                Upload your important document to the portal
              </p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>Personnel Sign</h3>
              <p style={styles.stepDescription}>
                Assigned personnel review and sign the document
              </p>
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>Authority Confirm</h3>
              <p style={styles.stepDescription}>
                Authority reviews and confirms the approval
              </p>
            </div>
          </div>
        </section>

        <section style={styles.cta}>
          <h2 style={styles.ctaTitle}>Ready to Get Started?</h2>
          <p style={styles.ctaSubtitle}>
            Join SigningPortal today and streamline your document approval process.
          </p>
          <div style={styles.ctaActions}>
            {isAuthenticated ? (
              <Link to="/dashboard" style={styles.ctaButton}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" style={styles.ctaButton}>
                  Create Your Account
                </Link>
                <Link to="/login" style={styles.ctaButtonSecondary}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2026 SigningPortal. All rights reserved.</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff'
  },
  header: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    letterSpacing: '-0.025em'
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  headerButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  headerButtonSecondary: {
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'background-color 0.2s ease'
  },
  welcomeText: {
    color: 'white',
    fontSize: '0.875rem',
    marginRight: '1rem',
    display: 'flex',
    alignItems: 'center'
  },
  main: {
    flex: 1
  },
  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 1.5rem',
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem',
    lineHeight: '1.2'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#64748b',
    marginBottom: '2rem',
    maxWidth: '600px',
    margin: '0 auto 2rem',
    lineHeight: '1.6'
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  ctaButton: {
    padding: '0.875rem 2rem',
    backgroundColor: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    display: 'inline-block'
  },
  ctaButtonSecondary: {
    padding: '0.875rem 2rem',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    border: '2px solid #2563eb',
    transition: 'all 0.2s ease',
    display: 'inline-block'
  },
  features: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 1.5rem',
    backgroundColor: '#f8fafc'
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: '3rem'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem'
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  featureIcon: {
    width: '4rem',
    height: '4rem',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 auto 1rem'
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.75rem'
  },
  featureDescription: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: '1.6'
  },
  workflow: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 1.5rem'
  },
  workflowSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap'
  },
  step: {
    flex: 1,
    minWidth: '200px',
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  stepNumber: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: '0 auto 1rem'
  },
  stepTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.5rem'
  },
  stepDescription: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: '1.6'
  },
  stepArrow: {
    fontSize: '2rem',
    color: '#64748b',
    fontWeight: '300'
  },
  cta: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 1.5rem',
    textAlign: 'center',
    backgroundColor: '#f8fafc'
  },
  ctaTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem'
  },
  ctaSubtitle: {
    fontSize: '1.125rem',
    color: '#64748b',
    marginBottom: '2rem'
  },
  ctaActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  footer: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: '2rem 1.5rem',
    textAlign: 'center'
  },
  footerText: {
    margin: 0,
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.7)'
  }
};

// Add responsive styles and hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .heroTitle {
        font-size: 2rem !important;
      }
      .heroSubtitle {
        font-size: 1rem !important;
      }
      .headerActions {
        flex-direction: column;
        width: 100%;
      }
      .headerButton, .headerButtonSecondary {
        width: 100%;
        text-align: center;
      }
      .workflowSteps {
        flex-direction: column;
      }
      .stepArrow {
        transform: rotate(90deg);
      }
      .featuresGrid {
        grid-template-columns: 1fr !important;
      }
    }
    .headerButton:hover {
      background-color: #1d4ed8;
    }
    .headerButtonSecondary:hover {
      background-color: rgba(255,255,255,0.2);
    }
    .ctaButton:hover {
      background-color: #1d4ed8;
    }
    .ctaButtonSecondary:hover {
      background-color: #eff6ff;
    }
    .featureCard:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transform: translateY(-2px);
      transition: all 0.2s ease;
    }
  `;
  document.head.appendChild(style);
}

export default Home;
