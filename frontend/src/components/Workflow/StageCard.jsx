import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import UploadSignedVersion from './UploadSignedVersion';

const StageCard = ({ stage, onUpdate }) => {
  const { user } = useAuth();
  const [showUploadSignedVersion, setShowUploadSignedVersion] = useState(false);

  const canUpload = 
    (stage.assigned_to === user?.id || !stage.assigned_to) &&
    stage.required_role === user?.role &&
    stage.status !== 'completed' &&
    stage.status !== 'rejected';

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{stage.stage_name}</h3>
        <span
          style={{
            ...styles.status,
            backgroundColor: getStatusColor(stage.status)
          }}
        >
          {stage.status.replace('_', ' ')}
        </span>
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Required Role:</span>
          <span style={styles.detailValue}>{stage.required_role}</span>
        </div>
        {stage.assigned_to_name && (
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Assigned to:</span>
            <span style={styles.detailValue}>{stage.assigned_to_name}</span>
          </div>
        )}
        {stage.completed_at && (
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Completed:</span>
            <span style={styles.detailValue}>{new Date(stage.completed_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {stage.requires_signed_upload === 1 && (
        <div style={styles.versionRequirement}>
          {stage.signed_version_uploaded === 1 ? (
            <div style={styles.uploadedIndicator}>
              ✓ Signed version uploaded - Ready for approval
            </div>
          ) : (
            <div style={styles.requiredIndicator}>
              ⚠ Physical signature required - Download document, get it signed, then upload signed version
            </div>
          )}
        </div>
      )}

      {canUpload && !showUploadSignedVersion && (
        <div style={styles.actions}>
          {stage.signed_version_uploaded !== 1 && (
            <button 
              onClick={() => setShowUploadSignedVersion(true)} 
              style={styles.uploadButton}
            >
              Update Signed Version
            </button>
          )}
        </div>
      )}

      {showUploadSignedVersion && (
        <div style={styles.uploadContainer}>
          <UploadSignedVersion
            documentId={stage.document_id}
            workflowStageId={stage.id}
            stageName={stage.stage_name}
            onUploadSuccess={() => {
              setShowUploadSignedVersion(false);
              if (onUpdate) {
                onUpdate();
              }
            }}
            onCancel={() => setShowUploadSignedVersion(false)}
          />
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  title: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    minWidth: '200px'
  },
  status: {
    padding: '0.375rem 0.75rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  details: {
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  detailItem: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.875rem'
  },
  detailLabel: {
    color: '#64748b',
    fontWeight: '500'
  },
  detailValue: {
    color: '#1e293b',
    textTransform: 'capitalize'
  },
  signatures: {
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #e2e8f0'
  },
  signaturesHeader: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.75rem'
  },
  signatureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  signatureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  signatureInfo: {
    flex: 1
  },
  signatureName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  signatureDate: {
    color: '#64748b',
    fontSize: '0.8125rem'
  },
  signButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '1rem',
    width: '100%',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  signaturePadContainer: {
    marginTop: '1rem',
    padding: '1.25rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  versionRequirement: {
    marginTop: '1rem',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  uploadedIndicator: {
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #bbf7d0'
  },
  requiredIndicator: {
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #fed7aa'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  uploadButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  uploadContainer: {
    marginTop: '1rem'
  }
};

export default StageCard;
