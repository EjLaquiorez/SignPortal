export const ROLES = {
  PERSONNEL: 'personnel',
  AUTHORITY: 'authority',
  ADMIN: 'admin'
};

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

export const STAGE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
