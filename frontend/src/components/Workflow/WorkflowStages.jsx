import { useState, useEffect } from 'react';
import { workflowAPI } from '../../services/api';
import StageCard from './StageCard';

const WorkflowStages = ({ documentId }) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkflow();
  }, [documentId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getByDocument(documentId);
      setStages(response.data.workflow || []);
      setError('');
    } catch (err) {
      setError('Failed to load workflow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading workflow...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (stages.length === 0) {
    return <p>No workflow stages found</p>;
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Workflow Stages</h3>
      <div style={styles.timeline}>
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed';
          const isRejected = stage.status === 'rejected';
          const isPending = stage.status === 'pending';
          const isOverdueStage = isOverdue(stage.deadline);
          
          return (
            <div key={stage.id} style={styles.timelineItem}>
              <div style={styles.timelineConnector}>
                {index < stages.length - 1 && (
                  <div 
                    style={{
                      ...styles.connectorLine,
                      backgroundColor: isCompleted ? '#10b981' : '#e2e8f0'
                    }}
                  />
                )}
              </div>
              <div style={styles.stageCard}>
                <div style={styles.stageHeader}>
                  <div style={styles.stageInfo}>
                    <h4 style={styles.stageName}>{stage.stage_name}</h4>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: isCompleted ? '#10b981' : 
                                       isRejected ? '#ef4444' : 
                                       isPending ? '#f59e0b' : '#3b82f6'
                    }}>
                      {stage.status.replace('_', ' ')}
                    </span>
                  </div>
                  {stage.deadline && (
                    <div style={styles.deadlineInfo}>
                      <span style={styles.deadlineLabel}>Deadline:</span>
                      <span style={{
                        ...styles.deadlineValue,
                        color: isOverdueStage ? '#dc2626' : '#64748b'
                      }}>
                        {formatDateTime(stage.deadline)}
                        {isOverdueStage && ' ⚠'}
                      </span>
                    </div>
                  )}
                </div>
                
                {stage.assigned_to_name && (
                  <div style={styles.assignedTo}>
                    Assigned to: {stage.assigned_to_name}
                    {stage.assigned_to_rank && ` (${stage.assigned_to_rank})`}
                  </div>
                )}

                {stage.requires_signed_upload === 1 && (
                  <div style={styles.versionRequirement}>
                    {stage.signed_version_uploaded === 1 ? (
                      <span style={styles.uploadedIndicator}>
                        ✓ Signed version uploaded
                      </span>
                    ) : (
                      <span style={styles.requiredIndicator}>
                        ⚠ Physical signature required - Upload signed version
                      </span>
                    )}
                  </div>
                )}

                {stage.rejection_reason && (
                  <div style={styles.rejectionReason}>
                    <strong>Rejection Reason:</strong> {stage.rejection_reason}
                  </div>
                )}

                {stage.comments && stage.comments.length > 0 && (
                  <div style={styles.commentsSection}>
                    <strong>Comments:</strong>
                    {stage.comments.map((comment, idx) => (
                      <div key={idx} style={styles.comment}>
                        <div style={styles.commentHeader}>
                          <span>{comment.user_name}</span>
                          {comment.user_rank && <span style={styles.commentRank}>({comment.user_rank})</span>}
                          <span style={styles.commentDate}>
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <div style={styles.commentText}>{comment.comment}</div>
                      </div>
                    ))}
                  </div>
                )}

                <StageCard stage={stage} onUpdate={fetchWorkflow} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1f2937'
  },
  timeline: {
    position: 'relative',
    paddingLeft: '2rem'
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '2rem'
  },
  timelineConnector: {
    position: 'absolute',
    left: '-2rem',
    top: '0',
    bottom: '0',
    width: '2px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  connectorLine: {
    width: '2px',
    flex: 1,
    minHeight: '2rem'
  },
  stageCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  stageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  stageInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  stageName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  statusBadge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  deadlineInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.875rem'
  },
  deadlineLabel: {
    color: '#64748b',
    fontSize: '0.75rem'
  },
  deadlineValue: {
    fontWeight: '500'
  },
  assignedTo: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '0.75rem'
  },
  rejectionReason: {
    padding: '0.75rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#991b1b',
    fontSize: '0.875rem',
    marginBottom: '0.75rem'
  },
  commentsSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0'
  },
  comment: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },
  commentHeader: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    fontSize: '0.8125rem',
    color: '#64748b',
    marginBottom: '0.5rem'
  },
  commentRank: {
    color: '#9ca3af'
  },
  commentDate: {
    marginLeft: 'auto',
    fontSize: '0.75rem'
  },
  commentText: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.5'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    border: '1px solid #fecaca'
  },
  versionRequirement: {
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  uploadedIndicator: {
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    display: 'inline-block',
    border: '1px solid #bbf7d0'
  },
  requiredIndicator: {
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    display: 'inline-block',
    border: '1px solid #fed7aa'
  }
};

export default WorkflowStages;
