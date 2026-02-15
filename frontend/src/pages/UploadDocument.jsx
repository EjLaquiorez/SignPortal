import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const PURPOSE_OPTIONS = [
  'Investigation Report',
  'Incident Report',
  'Intelligence Report',
  'Administrative Request',
  'Financial Request',
  'Procurement Documents',
  'Legal Documents',
  'Personnel Records',
  'Case Follow-up'
];

const UNIT_OPTIONS = [
  'Regional Office',
  'Provincial Office',
  'City Police Station',
  'Municipal Police Station',
  'Investigation and Detective Management',
  'Intelligence Division',
  'Human Resource and Doctrine',
  'Logistics',
  'Finance',
  'Operations',
  'Legal Division'
];

const CLASSIFICATION_OPTIONS = [
  'For Official Use Only',
  'Restricted',
  'Confidential',
  'Secret'
];

const PRIORITY_OPTIONS = [
  'Routine',
  'Urgent',
  'Priority',
  'Emergency'
];

const UploadDocument = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  
  // Form data
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [officeUnit, setOfficeUnit] = useState('');
  const [caseReferenceNumber, setCaseReferenceNumber] = useState('');
  const [classificationLevel, setClassificationLevel] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);

  const totalSteps = 4;
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    } else {
      // No file selected, reset state
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openPreview = () => {
    if (file && filePreview) {
      setPreviewModalOpen(true);
    }
  };

  const closePreview = () => {
    setPreviewModalOpen(false);
  };

  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    console.log('Processing file:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size
    });
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      showError('File size must be less than 50MB');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setFilePreview(null);
      return;
    }
    
    // Validate file type - be more lenient, check extension first
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.xlsm', '.jpg', '.jpeg', '.png', '.gif'];
    const fileNameParts = selectedFile.name.split('.');
    const fileExtension = fileNameParts.length > 1 ? '.' + fileNameParts.pop()?.toLowerCase() : '';
    
    // Also check MIME types (but don't require both)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    // Accept if extension OR MIME type matches (more lenient)
    const hasValidExtension = allowedExtensions.includes(fileExtension);
    const hasValidMimeType = selectedFile.type && (
      allowedMimeTypes.includes(selectedFile.type) || 
      selectedFile.type.startsWith('image/')
    );
    
    console.log('File validation:', {
      extension: fileExtension,
      hasValidExtension,
      mimeType: selectedFile.type,
      hasValidMimeType
    });
    
    // If no extension and no valid MIME type, reject
    if (!hasValidExtension && !hasValidMimeType) {
      showError(`File type "${fileExtension || selectedFile.type || 'unknown'}" not supported. Please upload PDF, Word (.doc, .docx), Excel (.xls, .xlsx), or Image files.`);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setFilePreview(null);
      return;
    }
    
    // File is valid, proceed
    console.log('File accepted, setting state');
    setFile(selectedFile);
    
    // Create preview for images and PDFs
    if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf' || fileExtension === '.pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        // Don't show error for preview failures, just continue without preview
        setFilePreview(null);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📎';
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      'pdf': '📄', 
      'doc': '📝', 
      'docx': '📝', 
      'xls': '📊', 
      'xlsx': '📊',
      'xlsm': '📊',
      'jpg': '🖼️', 
      'jpeg': '🖼️', 
      'png': '🖼️', 
      'gif': '🖼️',
      'webp': '🖼️'
    };
    return iconMap[extension] || '📎';
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        return file && documentTitle.trim();
      case 2:
        return purpose && officeUnit;
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      // Show specific validation error
      if (currentStep === 1) {
        if (!file) {
          showError('Please select a file to upload');
        } else if (!documentTitle.trim()) {
          showError('Please enter a document title');
        }
      } else if (currentStep === 2) {
        if (!purpose) {
          showError('Please select a purpose');
        } else if (!officeUnit) {
          showError('Please select an office/unit');
        }
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      showError('Please complete all required fields');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_title', documentTitle.trim());
      formData.append('purpose', purpose);
      formData.append('office_unit', officeUnit);
      if (caseReferenceNumber) formData.append('case_reference_number', caseReferenceNumber.trim());
      if (classificationLevel) formData.append('classification_level', classificationLevel);
      formData.append('priority', priority);
      if (deadline) formData.append('deadline', deadline);
      if (notes) formData.append('notes', notes.trim());

      const response = await documentsAPI.upload(formData);
      
      // Upload attachments
      if (attachments.length > 0 && response.data?.document?.id) {
        for (const attachment of attachments) {
          const attachmentFormData = new FormData();
          attachmentFormData.append('file', attachment);
          await documentsAPI.uploadAttachment(response.data.document.id, attachmentFormData);
        }
      }

      success('Document uploaded successfully!');
      navigate('/documents');
    } catch (err) {
      showError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Upload Document</h1>
          <p style={styles.subtitle}>Follow the steps below to upload and submit your document for approval</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div style={styles.progressStep}>
              <div
                style={{
                  ...styles.stepCircle,
                  backgroundColor: currentStep >= step ? '#2563eb' : '#e5e7eb',
                  color: currentStep >= step ? 'white' : '#6b7280'
                }}
              >
                {currentStep > step ? '✓' : step}
              </div>
              <div style={styles.stepLabel}>
                {step === 1 && 'Select File'}
                {step === 2 && 'Document Details'}
                {step === 3 && 'Additional Info'}
                {step === 4 && 'Review & Submit'}
              </div>
            </div>
            {step < 4 && (
              <div
                style={{
                  ...styles.stepConnector,
                  backgroundColor: currentStep > step ? '#2563eb' : '#e5e7eb'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card padding="lg" style={styles.formCard}>
        {/* Step 1: File Selection */}
        {currentStep === 1 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Select Document File</h2>
            <p style={styles.stepDescription}>Choose the main document file you want to upload</p>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Document Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter a descriptive title for this document"
                style={styles.input}
                required
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Main Document File <span style={styles.required}>*</span>
              </label>
              <div 
                style={{
                  ...styles.fileUploadArea,
                  ...(isDragging ? styles.fileUploadAreaDragging : {}),
                }}
                onClick={(e) => {
                  // Don't trigger if clicking on remove button or file input
                  if (e.target.closest('button') || e.target.type === 'file') {
                    return;
                  }
                  handleUploadAreaClick();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.jpg,.jpeg,.png,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                />
                <div style={styles.fileUploadText}>
                  <div>
                    <div style={styles.uploadText}>
                      {file ? 'Click to change file or drag and drop' : 'Click to select or drag and drop'}
                    </div>
                    <div style={styles.uploadHint}>
                      PDF, Word (.doc, .docx), Excel (.xls, .xlsx), or Images (Max 50MB)
                    </div>
                  </div>
                </div>
              </div>
              
              {file && (
                <div style={styles.filePreviewCard}>
                  <div style={styles.filePreviewHeader}>
                    <div style={styles.fileInfo}>
                      <div>
                        <div style={styles.fileName}>{file.name}</div>
                        <div style={styles.fileMeta}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                        </div>
                      </div>
                    </div>
                    <div style={styles.fileActions}>
                      {filePreview && (
                        <button
                          type="button"
                          onClick={openPreview}
                          style={styles.previewButton}
                          title="Preview file"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1d4ed8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                        >
                          Preview
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={removeFile}
                        style={styles.removeButton}
                        title="Remove file"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {filePreview && file.type.startsWith('image/') && (
                    <div style={styles.previewContainer}>
                      <img src={filePreview} alt="Preview" style={styles.previewImage} />
                    </div>
                  )}
                  {filePreview && file.type === 'application/pdf' && (
                    <div style={styles.previewContainer}>
                      <iframe
                        src={filePreview}
                        style={styles.previewIframe}
                        title="PDF Preview"
                      />
                    </div>
                  )}
                  {!filePreview && (
                    <div style={styles.noPreviewContainer}>
                      <div style={styles.noPreviewText}>
                        Preview not available for this file type
                      </div>
                      <div style={styles.noPreviewSubtext}>
                        File will be uploaded as-is
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Document Details */}
        {currentStep === 2 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Document Details</h2>
            <p style={styles.stepDescription}>Provide essential information about your document</p>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Purpose <span style={styles.required}>*</span>
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  style={styles.select}
                  required
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select purpose</option>
                  {PURPOSE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Office/Unit/Division <span style={styles.required}>*</span>
                </label>
                <select
                  value={officeUnit}
                  onChange={(e) => setOfficeUnit(e.target.value)}
                  style={styles.select}
                  required
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select office/unit</option>
                  {UNIT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Case/Reference Number</label>
                <input
                  type="text"
                  value={caseReferenceNumber}
                  onChange={(e) => setCaseReferenceNumber(e.target.value)}
                  placeholder="e.g., PNP-2026-INV-0001"
                  style={styles.input}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={styles.select}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Additional Information */}
        {currentStep === 3 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Additional Information</h2>
            <p style={styles.stepDescription}>Add classification, deadline, and any supporting attachments</p>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Classification Level</label>
                <select
                  value={classificationLevel}
                  onChange={(e) => setClassificationLevel(e.target.value)}
                  style={styles.select}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select classification (optional)</option>
                  {CLASSIFICATION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={styles.input}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes/Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or remarks..."
                style={styles.textarea}
                rows={4}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Supporting Attachments (Optional)</label>
              <div style={styles.attachmentUploadArea}>
                <input
                  type="file"
                  onChange={handleAttachmentsChange}
                  style={styles.attachmentFileInput}
                  multiple
                  id="attachment-input"
                />
                <label 
                  htmlFor="attachment-input" 
                  style={styles.attachmentUploadLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <div>
                    <div style={styles.attachmentUploadText}>Click to add attachments</div>
                    <div style={styles.attachmentUploadHint}>You can select multiple files</div>
                  </div>
                </label>
              </div>
              {attachments.length > 0 && (
                <div style={styles.attachmentsList}>
                  {attachments.map((att, index) => (
                    <div key={index} style={styles.attachmentItem}>
                      <div style={styles.attachmentInfo}>
                        <span style={styles.attachmentName}>{att.name}</span>
                        <span style={styles.fileSize}>
                          {(att.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        style={styles.attachmentRemoveButton}
                        title="Remove attachment"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Review & Submit</h2>
            <p style={styles.stepDescription}>Review your information before submitting</p>
            
            <div style={styles.reviewSection}>
              <div style={styles.reviewGroup}>
                <div style={styles.reviewLabel}>Document Title</div>
                <div style={styles.reviewValue}>{documentTitle || 'N/A'}</div>
              </div>
              
              <div style={styles.reviewGroup}>
                <div style={styles.reviewLabel}>File</div>
                <div style={styles.reviewValue}>
                  {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'N/A'}
                </div>
              </div>
              
              <div style={styles.reviewGroup}>
                <div style={styles.reviewLabel}>Purpose</div>
                <div style={styles.reviewValue}>{purpose || 'N/A'}</div>
              </div>
              
              <div style={styles.reviewGroup}>
                <div style={styles.reviewLabel}>Office/Unit</div>
                <div style={styles.reviewValue}>{officeUnit || 'N/A'}</div>
              </div>
              
              {caseReferenceNumber && (
                <div style={styles.reviewGroup}>
                  <div style={styles.reviewLabel}>Case/Reference Number</div>
                  <div style={styles.reviewValue}>{caseReferenceNumber}</div>
                </div>
              )}
              
              <div style={styles.reviewGroup}>
                <div style={styles.reviewLabel}>Priority</div>
                <div style={styles.reviewValue}>{priority}</div>
              </div>
              
              {classificationLevel && (
                <div style={styles.reviewGroup}>
                  <div style={styles.reviewLabel}>Classification</div>
                  <div style={styles.reviewValue}>{classificationLevel}</div>
                </div>
              )}
              
              {deadline && (
                <div style={styles.reviewGroup}>
                  <div style={styles.reviewLabel}>Deadline</div>
                  <div style={styles.reviewValue}>
                    {new Date(deadline).toLocaleString()}
                  </div>
                </div>
              )}
              
              {notes && (
                <div style={styles.reviewGroup}>
                  <div style={styles.reviewLabel}>Notes</div>
                  <div style={styles.reviewValue}>{notes}</div>
                </div>
              )}
              
              {attachments.length > 0 && (
                <div style={styles.reviewGroup}>
                  <div style={styles.reviewLabel}>Attachments</div>
                  <div style={styles.reviewValue}>
                    {attachments.length} file(s)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.navigation}>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={uploading}
            >
              Back
            </Button>
          )}
          <div style={styles.navSpacer} />
          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next Step →
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={uploading || !validateStep(1) || !validateStep(2)}
              loading={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit Document'}
            </Button>
          )}
        </div>
      </Card>

      {/* Preview Modal */}
      {previewModalOpen && filePreview && (
        <div style={styles.modalOverlay} onClick={closePreview}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>File Preview</h3>
              <button
                type="button"
                onClick={closePreview}
                style={styles.modalCloseButton}
                title="Close preview"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                Close
              </button>
            </div>
            <div style={styles.modalBody}>
              {file.type.startsWith('image/') && (
                <img src={filePreview} alt="Preview" style={styles.modalPreviewImage} />
              )}
              {file.type === 'application/pdf' && (
                <iframe
                  src={filePreview}
                  style={styles.modalPreviewIframe}
                  title="PDF Preview"
                />
              )}
            </div>
            <div style={styles.modalFooter}>
              <Button variant="outline" onClick={closePreview}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: 'var(--spacing-6) var(--spacing-4)',
  },
  header: {
    marginBottom: 'var(--spacing-8)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-2)',
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--spacing-8)',
    gap: 0,
    position: 'relative',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    maxWidth: '200px',
    position: 'relative',
  },
  stepCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-semibold)',
    fontSize: 'var(--text-base)',
    transition: 'all 0.2s ease',
  },
  stepLabel: {
    marginTop: 'var(--spacing-2)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontWeight: 'var(--font-medium)',
  },
  stepConnector: {
    width: '60px',
    height: '2px',
    marginTop: '-20px',
    marginBottom: '20px',
    flexShrink: 0,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  stepContent: {
    minHeight: '400px',
  },
  stepTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-2)',
  },
  stepDescription: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--spacing-6)',
  },
  formGroup: {
    marginBottom: 'var(--spacing-5)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 'var(--spacing-5)',
    marginBottom: 'var(--spacing-5)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-2)',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    width: '100%',
    padding: 'var(--spacing-3)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: 'var(--text-sm)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
    backgroundColor: 'white',
  },
  select: {
    width: '100%',
    padding: 'var(--spacing-3)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: 'var(--text-sm)',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right var(--spacing-3) center',
    paddingRight: 'var(--spacing-10)',
  },
  textarea: {
    width: '100%',
    padding: 'var(--spacing-3)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: 'var(--text-sm)',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '100px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: 'white',
  },
  fileUploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: 'var(--spacing-8)',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  fileUploadAreaDragging: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    borderStyle: 'solid',
  },
  fileInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    top: 0,
    left: 0,
  },
  fileUploadText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
  },
  uploadText: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
  },
  uploadHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  },
  filePreviewCard: {
    marginTop: 'var(--spacing-4)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: 'var(--spacing-4)',
    backgroundColor: '#f9fafb',
  },
  filePreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--spacing-2)',
    gap: 'var(--spacing-2)',
  },
  fileActions: {
    display: 'flex',
    gap: 'var(--spacing-2)',
    alignItems: 'center',
  },
  previewButton: {
    padding: 'var(--spacing-2) var(--spacing-3)',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-1)',
  },
  fileInfo: {
    display: 'flex',
    gap: 'var(--spacing-3)',
    alignItems: 'flex-start',
    flex: 1,
  },
  fileName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
    wordBreak: 'break-word',
  },
  fileMeta: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    marginTop: 'var(--spacing-1)',
  },
  removeButton: {
    background: 'none',
    border: '1px solid #dc2626',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    padding: 'var(--spacing-2) var(--spacing-3)',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  previewContainer: {
    marginTop: 'var(--spacing-4)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  previewImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    display: 'block',
  },
  previewIframe: {
    width: '100%',
    height: '500px',
    border: 'none',
    borderRadius: '8px',
  },
  noPreviewContainer: {
    marginTop: 'var(--spacing-4)',
    padding: 'var(--spacing-6)',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px dashed #d1d5db',
  },
  noPreviewText: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--spacing-1)',
  },
  noPreviewSubtext: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--spacing-4)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-4) var(--spacing-6)',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--text-primary)',
    margin: 0,
  },
  modalCloseButton: {
    background: 'none',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    padding: 'var(--spacing-2) var(--spacing-4)',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--spacing-4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  modalPreviewImage: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  modalPreviewIframe: {
    width: '100%',
    height: '70vh',
    border: 'none',
    borderRadius: '8px',
  },
  modalFooter: {
    padding: 'var(--spacing-4) var(--spacing-6)',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  attachmentsList: {
    marginTop: 'var(--spacing-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-2)',
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    padding: 'var(--spacing-2) var(--spacing-3)',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: 'var(--text-sm)',
  },
  attachmentUploadArea: {
    position: 'relative',
    marginTop: 'var(--spacing-2)',
  },
  attachmentFileInput: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    opacity: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
  attachmentUploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-4)',
    border: '1px dashed #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  attachmentUploadText: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
  },
  attachmentUploadHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    marginTop: 'var(--spacing-1)',
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-3)',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginTop: 'var(--spacing-2)',
  },
  attachmentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-1)',
    minWidth: 0,
  },
  attachmentName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-primary)',
    wordBreak: 'break-word',
  },
  fileSize: {
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-xs)',
  },
  attachmentRemoveButton: {
    background: 'none',
    border: '1px solid #dc2626',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    padding: 'var(--spacing-2) var(--spacing-3)',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  reviewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
  },
  reviewGroup: {
    padding: 'var(--spacing-4)',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  reviewLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--spacing-1)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  reviewValue: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    fontWeight: 'var(--font-medium)',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'var(--spacing-8)',
    paddingTop: 'var(--spacing-6)',
    borderTop: '1px solid #e5e7eb',
    gap: 'var(--spacing-3)',
  },
  navSpacer: {
    flex: 1,
  },
};

export default UploadDocument;
