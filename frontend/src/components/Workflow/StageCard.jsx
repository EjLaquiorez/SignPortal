import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workflowAPI } from '../../services/api';
import SignaturePad from '../Signature/SignaturePad';
import SignatureDisplay from '../Signature/SignatureDisplay';

const StageCard = ({ stage, onUpdate }) => {
  const { user } = useAuth();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatures, setSignatures] = useState(stage.signatures || []);

  const canSign = 
    (stage.assigned_to === user?.id || !stage.assigned_to) &&
    stage.required_role === user?.role &&
    stage.status !== 'completed';

  const handleSign = () => {
    setShowSignaturePad(true);
  };

  const handleSignatureSuccess = async () => {
    setShowSignaturePad(false);
    // Refresh signatures
    try {
      const response = await workflowAPI.getByDocument(stage.document_id);
      const updatedStage = response.data.workflow.find(s => s.id === stage.id);
      setSignatures(updatedStage?.signatures || []);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to refresh signatures:', err);
    }
  };

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

      {signatures.length > 0 && (
        <div style={styles.signatures}>
          <div style={styles.signaturesHeader}>Signatures</div>
          <div style={styles.signatureList}>
            {signatures.map((sig) => (
              <div key={sig.id} style={styles.signatureItem}>
                <SignatureDisplay signatureId={sig.id} />
                <div style={styles.signatureInfo}>
                  <div style={styles.signatureName}>{sig.user_name}</div>
                  <div style={styles.signatureDate}>
                    {new Date(sig.signed_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canSign && !showSignaturePad && (
        <button onClick={handleSign} style={styles.signButton}>
          Sign This Stage
        </button>
      )}

      {showSignaturePad && (
        <div style={styles.signaturePadContainer}>
          <SignaturePad
            workflowStageId={stage.id}
            onSuccess={handleSignatureSuccess}
            onCancel={() => setShowSignaturePad(false)}
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
  }
};

export default StageCard;
