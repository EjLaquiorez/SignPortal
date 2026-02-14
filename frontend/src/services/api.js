import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For FormData, let the browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Documents API
export const documentsAPI = {
  upload: (formData) => {
    return api.post('/documents', formData);
  },
  uploadAttachment: (documentId, formData) => {
    return api.post(`/documents/${documentId}/attachments`, formData);
  },
  listAttachments: (documentId) => api.get(`/documents/${documentId}/attachments`),
  downloadAttachment: (attachmentId) => api.get(`/attachments/${attachmentId}/download`, { responseType: 'blob' }),
  deleteAttachment: (attachmentId) => api.delete(`/attachments/${attachmentId}`),
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
  // Document versions API
  uploadSignedVersion: (documentId, formData) => {
    return api.post(`/documents/${documentId}/versions`, formData);
  },
  listVersions: (documentId) => api.get(`/documents/${documentId}/versions`),
  getVersion: (documentId, versionId) => api.get(`/documents/${documentId}/versions/${versionId}`),
  downloadVersion: (documentId, versionId) => api.get(`/documents/${documentId}/versions/${versionId}/download`, { responseType: 'blob' }),
  getCurrentVersion: (documentId) => api.get(`/documents/${documentId}/versions/current`)
};

// Workflow API
export const workflowAPI = {
  getByDocument: (documentId) => api.get(`/workflow/document/${documentId}`),
  getPending: () => api.get('/workflow/pending'),
  assignStage: (stageId, userId) => api.post(`/workflow/stage/${stageId}/assign`, { userId }),
  updateStageStatus: (stageId, data) => api.put(`/workflow/stage/${stageId}/status`, data),
  addComment: (stageId, comment) => api.post(`/workflow/stage/${stageId}/comments`, { comment }),
  getComments: (stageId) => api.get(`/workflow/stage/${stageId}/comments`)
};

// Signatures API
export const signaturesAPI = {
  create: (data) => {
    if (data.file) {
      // File upload - use FormData
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('workflowStageId', data.workflowStageId);
      return api.post('/signatures', formData);
    } else {
      // Canvas signature - send as JSON with base64 data
      return api.post('/signatures', {
        signatureData: data.signatureData,
        workflowStageId: data.workflowStageId
      });
    }
  },
  getByStage: (stageId) => api.get(`/signatures/stage/${stageId}`),
  getImage: (signatureId) => api.get(`/signatures/${signatureId}/image`, { responseType: 'blob' }),
  getByDocument: (docId) => api.get(`/signatures/document/${docId}`)
};

// Notifications API
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export default api;
