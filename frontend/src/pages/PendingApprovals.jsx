import { useState, useEffect } from 'react';
import { workflowAPI, documentsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadSignedVersion from '../components/Workflow/UploadSignedVersion';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [showUploadSignedVersion, setShowUploadSignedVersion] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    if (selectedApproval) {
      fetchAttachments(selectedApproval.document_id);
    }
  }, [selectedApproval]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getPending();
      setPendingApprovals(response.data.pendingApprovals || []);
      setError('');
    } catch (err) {
      setError('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (documentId) => {
    try {
      setLoadingAttachments(true);
      const response = await documentsAPI.listAttachments(documentId);
      setAttachments(response.data.attachments || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleApprove = async (stageId) => {
    try {
      await workflowAPI.updateStageStatus(stageId, {
        status: 'completed',
        comment: comment.trim() || undefined
      });
      setComment('');
      setSelectedApproval(null);
      fetchPendingApprovals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve stage');
    }
  };

  const handleReject = async (stageId) => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    try {
      await workflowAPI.updateStageStatus(stageId, {
        status: 'rejected',
        rejection_reason: rejectionReason.trim(),
        comment: comment.trim() || undefined
      });
      setRejectionReason('');
      setComment('');
      setSelectedApproval(null);
      fetchPendingApprovals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject stage');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
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

  const getPriorityColor = (priority) => {
    const colors = {
      'Emergency': '#dc2626',
      'Priority': '#ea580c',
      'Urgent': '#f59e0b',
      'Routine': '#64748b'
    };
    return colors[priority] || '#64748b';
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Pending Approvals</h1>
        <p style={styles.subtitle}>Review and approve pending document stages</p>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      
      {pendingApprovals.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No pending approvals</p>
        </div>
      ) : (
        <div style={styles.container}>
          <div style={styles.list}>
            {pendingApprovals.map((approval) => {
              const overdue = isOverdue(approval.deadline || approval.document_deadline);
              return (
                <div 
                  key={approval.id} 
                  style={{
                    ...styles.card,
                    borderColor: overdue ? '#ea580c' : approval.is_urgent ? '#dc2626' : '#e2e8f0'
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>
                        {approval.document_title || approval.original_filename}
                      </h3>
                      {approval.tracking_number && (
                        <p style={styles.trackingNumber}>📋 {approval.tracking_number}</p>
                      )}
                      <p style={styles.stageName}>{approval.stage_name}</p>
                    </div>
                    <div style={styles.badges}>
                      {approval.priority && (
                        <span style={{
                          ...styles.badge,
                          backgroundColor: getPriorityColor(approval.priority)
                        }}>
                          {approval.priority}
                        </span>
                      )}
                      {approval.is_urgent && (
                        <span style={styles.urgentBadge}>URGENT</span>
                      )}
                      {overdue && (
                        <span style={styles.overdueBadge}>OVERDUE</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={styles.cardBody}>
                    <div style={styles.metadataGrid}>
                      <div style={styles.metadataItem}>
                        <span style={styles.metadataLabel}>Purpose:</span>
                        <span style={styles.metadataValue}>{approval.purpose || 'N/A'}</span>
                      </div>
                      <div style={styles.metadataItem}>
                        <span style={styles.metadataLabel}>Case #:</span>
                        <span style={styles.metadataValue}>{approval.case_reference_number || 'N/A'}</span>
                      </div>
                      <div style={styles.metadataItem}>
                        <span style={styles.metadataLabel}>Office/Unit:</span>
                        <span style={styles.metadataValue}>{approval.office_unit || 'N/A'}</span>
                      </div>
                      <div style={styles.metadataItem}>
                        <span style={styles.metadataLabel}>Classification:</span>
                        <span style={styles.metadataValue}>{approval.classification_level || 'N/A'}</span>
                      </div>
                      <div style={styles.metadataItem}>
                        <span style={styles.metadataLabel}>Deadline:</span>
                        <span style={{
                          ...styles.metadataValue,
                          color: overdue ? '#dc2626' : '#64748b',
                          fontWeight: overdue ? '600' : '400'
                        }}>
                          {formatDateTime(approval.deadline || approval.document_deadline)}
                          {overdue && ' ⚠'}
                        </span>
                      </div>
                      <div style={styles.metadataItem}>
                        <span style={styles.metadataLabel}>Uploaded by:</span>
                        <span style={styles.metadataValue}>
                          {approval.uploaded_by_name || 'N/A'}
                          {approval.uploaded_by_rank && ` (${approval.uploaded_by_rank})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.actions}>
                    {approval.requires_signed_upload === 1 && approval.signed_version_uploaded !== 1 && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const response = await documentsAPI.download(approval.document_id);
                              const blob = new Blob([response.data], { 
                                type: approval.file_type || 'application/octet-stream' 
                              });
                              const url = window.URL.createObjectURL(blob);
                              const a = window.document.createElement('a');
                              a.href = url;
                              a.download = approval.original_filename;
                              window.document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              window.document.body.removeChild(a);
                            } catch (err) {
                              alert('Failed to download document: ' + (err.response?.data?.error || err.message));
                              console.error('Download error:', err);
                            }
                          }}
                          style={styles.downloadButton}
                        >
                          Download Document
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowUploadSignedVersion(true);
                          }}
                          style={styles.uploadButton}
                        >
                          Update Signed Version
                        </button>
                      </>
                    )}
                    {approval.requires_signed_upload === 1 && approval.signed_version_uploaded === 1 && (
                      <span style={styles.uploadedBadge}>✓ Signed Version Uploaded - Stage Completed</span>
                    )}
                    <Link
                      to={`/documents/${approval.document_id}`}
                      style={styles.buttonSecondary}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedApproval && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>
                    {showUploadSignedVersion ? 'Upload Signed Version' : 'Document Review'}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedApproval(null);
                      setComment('');
                      setRejectionReason('');
                      setShowUploadSignedVersion(false);
                    }}
                    style={styles.closeButton}
                  >
                    ×
                  </button>
                </div>

                <div style={styles.modalBody}>
                  <div style={styles.documentInfo}>
                    <h3>{selectedApproval.document_title || selectedApproval.original_filename}</h3>
                    {selectedApproval.tracking_number && (
                      <p style={styles.trackingNumberInfo}>📋 Tracking: <strong>{selectedApproval.tracking_number}</strong></p>
                    )}
                    <p style={styles.stageInfo}>Stage: {selectedApproval.stage_name}</p>
                    {selectedApproval.current_stage_name && (
                      <p style={styles.currentStatusInfo}>Status: <strong>{selectedApproval.current_stage_name}</strong></p>
                    )}
                    {selectedApproval.requires_signed_upload === 1 && (
                      <div style={styles.versionRequirement}>
                        {selectedApproval.signed_version_uploaded === 1 ? (
                          <span style={styles.uploadedIndicator}>✓ Signed version uploaded - Stage completed</span>
                        ) : (
                          <span style={styles.requiredIndicator}>⚠ Download document, get it signed, then update signed version</span>
                        )}
                      </div>
                    )}
                    {!showUploadSignedVersion && selectedApproval.requires_signed_upload === 1 && selectedApproval.signed_version_uploaded !== 1 && (
                      <div style={styles.downloadSection}>
                        <button
                          onClick={async () => {
                            try {
                              const response = await documentsAPI.download(selectedApproval.document_id);
                              const blob = new Blob([response.data], { 
                                type: selectedApproval.file_type || 'application/octet-stream' 
                              });
                              const url = window.URL.createObjectURL(blob);
                              const a = window.document.createElement('a');
                              a.href = url;
                              a.download = selectedApproval.original_filename;
                              window.document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              window.document.body.removeChild(a);
                            } catch (err) {
                              alert('Failed to download document: ' + (err.response?.data?.error || err.message));
                              console.error('Download error:', err);
                            }
                          }}
                          style={styles.modalDownloadButton}
                        >
                          📥 Download Document
                        </button>
                      </div>
                    )}
                  </div>

                  {showUploadSignedVersion && (
                    <div style={styles.uploadSection}>
                      <UploadSignedVersion
                        documentId={selectedApproval.document_id}
                        workflowStageId={selectedApproval.id}
                        stageName={selectedApproval.stage_name}
                        onUploadSuccess={() => {
                          setShowUploadSignedVersion(false);
                          fetchPendingApprovals();
                          setSelectedApproval(null);
                        }}
                        onCancel={() => setShowUploadSignedVersion(false)}
                      />
                    </div>
                  )}

                  {!showUploadSignedVersion && (
                    <>
                      {attachments.length > 0 && (
                    <div style={styles.attachmentsSection}>
                      <h4 style={styles.sectionTitle}>Supporting Attachments</h4>
                      <div style={styles.attachmentsList}>
                        {attachments.map((att) => (
                          <div key={att.id} style={styles.attachmentItem}>
                            <span>{att.original_filename}</span>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await documentsAPI.downloadAttachment(att.id);
                                  const blob = new Blob([response.data], { 
                                    type: att.file_type || 'application/octet-stream' 
                                  });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = window.document.createElement('a');
                                  a.href = url;
                                  a.download = att.original_filename;
                                  window.document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  window.document.body.removeChild(a);
                                } catch (err) {
                                  alert('Failed to download attachment: ' + (err.response?.data?.error || err.message));
                                  console.error('Download error:', err);
                                }
                              }}
                              style={styles.downloadButton}
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={styles.commentSection}>
                    <label style={styles.label}>
                      Comment (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={styles.textarea}
                      placeholder="Add a comment..."
                      rows={4}
                    />
                  </div>

                  <div style={styles.rejectionSection}>
                    <label style={styles.label}>
                      Rejection Reason <span style={styles.required}>*</span> (Required if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      style={styles.textarea}
                      placeholder="Provide a reason for rejection..."
                      rows={3}
                    />
                      </div>
                    </>
                  )}

                  {!showUploadSignedVersion && (
                    <div style={styles.modalActions}>
                      <button
                        onClick={() => handleReject(selectedApproval.id)}
                        style={styles.rejectButton}
                        disabled={!rejectionReason.trim()}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(null);
                          setComment('');
                          setRejectionReason('');
                          setShowUploadSignedVersion(false);
                        }}
                        style={styles.cancelButton}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.875rem'
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    border: '1px solid #fecaca'
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  emptyText: {
    color: '#64748b',
    fontSize: '0.875rem'
  },
  container: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start'
  },
  list: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.25rem'
  },
  card: {
    border: '2px solid',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s ease'
  },
  cardHeader: {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    wordBreak: 'break-word',
    marginBottom: '0.5rem'
  },
  trackingNumberInfo: {
    fontSize: '0.875rem',
    color: '#2563eb',
    fontWeight: '600',
    marginTop: '0.5rem',
    marginBottom: '0.25rem',
    padding: '0.5rem',
    backgroundColor: '#eff6ff',
    borderRadius: '4px'
  },
  currentStatusInfo: {
    fontSize: '0.875rem',
    color: '#ea580c',
    fontWeight: '500',
    marginTop: '0.5rem',
    marginBottom: '0.25rem',
    padding: '0.5rem',
    backgroundColor: '#fff7ed',
    borderRadius: '4px'
  },
  stageName: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  badges: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginTop: '0.75rem'
  },
  badge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  urgentBadge: {
    padding: '0.25rem 0.625rem',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  overdueBadge: {
    padding: '0.25rem 0.625rem',
    backgroundColor: '#ea580c',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cardBody: {
    marginBottom: '1.25rem'
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    fontSize: '0.875rem'
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  metadataLabel: {
    color: '#64748b',
    fontWeight: '500',
    fontSize: '0.8125rem'
  },
  metadataValue: {
    color: '#1e293b',
    wordBreak: 'break-word'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  button: {
    flex: 1,
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    textAlign: 'center'
  },
  uploadButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  uploadedBadge: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: '1px solid #bbf7d0'
  },
  versionRequirement: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  uploadedIndicator: {
    color: '#16a34a',
    fontWeight: '500'
  },
  requiredIndicator: {
    color: '#ea580c',
    fontWeight: '500'
  },
  uploadSection: {
    marginTop: '1.5rem',
    marginBottom: '1.5rem'
  },
  downloadSection: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    border: '1px solid #bfdbfe'
  },
  modalDownloadButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s ease'
  },
  buttonSecondary: {
    flex: 1,
    padding: '0.625rem 1.25rem',
    backgroundColor: '#64748b',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    textAlign: 'center'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  },
  modalBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  documentInfo: {
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0'
  },
  stageInfo: {
    margin: '0.5rem 0 0 0',
    color: '#64748b',
    fontSize: '0.875rem'
  },
  attachmentsSection: {
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },
  sectionTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151'
  },
  attachmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  attachmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '0.875rem'
  },
  downloadButton: {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8125rem'
  },
  commentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  rejectionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  required: {
    color: '#dc2626'
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0'
  },
  approveButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  rejectButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    opacity: 1
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  }
};

export default PendingApprovals;
