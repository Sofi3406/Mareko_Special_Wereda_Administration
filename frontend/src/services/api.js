import axios from 'axios';

// Normalize API base URL so callers can set REACT_APP_API_URL with or without trailing '/api'
const rawApi = process.env.REACT_APP_API_URL || 'https://mareko-special-wereda-administration.onrender.com/api';
let API_URL = rawApi.replace(/\/+$/, ''); // strip trailing slashes
if (!API_URL.toLowerCase().endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}

export const API_BASE = API_URL;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

const isFormData = (data) =>
  typeof FormData !== 'undefined' && data instanceof FormData;

const withFormData = (data) =>
  isFormData(data)
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Reports API
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getOne: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data, withFormData(data)),
  update: (id, data) => api.put(`/reports/${id}`, data, withFormData(data)),
  delete: (id) => api.delete(`/reports/${id}`),
  getMyReports: () => api.get('/reports/my-reports'),
  getPublicUpdates: () => api.get('/reports/public-updates'),
  getByDepartment: (department) => api.get(`/reports/department/${department}`),
  postUpdate: (id, data) => api.post(`/reports/${id}/updates`, data)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getByWoreda: (woreda) => api.get(`/users/woreda/${woreda}`),
  getByRole: (role) => api.get(`/users/role/${role}`)
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics', { params }),
  getRealtime: () => api.get('/analytics/realtime'),
  exportData: (params) => api.get('/analytics/export', { params }),
  getSystemStats: () => api.get('/analytics/system-stats'),
  getWoredaStats: () => api.get('/analytics/woreda-stats'),
  getWoredaDashboard: () => api.get('/analytics/woreda-dashboard')
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  getMyOrganized: () => api.get('/events/organizer/me'),
  getRegisterable: (params) => api.get('/events/registerable', { params }),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  create: (data) => api.post('/events', data, withFormData(data)),
  update: (id, data) => api.put(`/events/${id}`, data, withFormData(data)),
  delete: (id) => api.delete(`/events/${id}`),
  getByWoreda: (woreda) => api.get(`/events/woreda/${encodeURIComponent(woreda)}`),
  register: (id, data) => api.post(`/events/${id}/register`, data),
  getMyTicket: (id) => api.get(`/events/${id}/my-ticket`)
};

// Resources API
export const resourcesAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getOne: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data, withFormData(data)),
  update: (id, data) => api.put(`/resources/${id}`, data, withFormData(data)),
  delete: (id) => api.delete(`/resources/${id}`),
  download: (id) => api.get(`/resources/${id}/download`, { responseType: 'blob' })
};

// Meetings API
export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`)
};

// Announcements API
export const announcementsAPI = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data, withFormData(data)),
  delete: (id) => api.delete(`/announcements/${id}`)
};

// Notifications API
export const notificationsAPI = {
  getMine: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.put('/notifications/read-all')
};

// Chatbot API
export const chatbotAPI = {
  ask: (question) => api.post('/chatbot/ask', { question }),
  askPublic: (question) => api.post('/public/chatbot/ask', { question })
};

// Services API
export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getOne: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data)
};

// Service Requests API
export const serviceRequestsAPI = {
  getAll: (params) => api.get('/services/requests/list', { params }),
  getOne: (id) => api.get(`/services/requests/${id}`),
  create: (data) => api.post('/services/requests', data, withFormData(data)),
  update: (id, data) => api.put(`/services/requests/${id}`, data)
};

// Departments API
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getOne: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data)
};

// Kebeles API
export const kelebesAPI = {
  getAll: (params) => api.get('/kebeles', { params }),
  getOne: (id) => api.get(`/kebeles/${id}`),
  create: (data) => api.post('/kebeles', data),
  update: (id, data) => api.put(`/kebeles/${id}`, data),
  getStats: (id) => api.get(`/kebeles/${id}/stats`)
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getEntities: () => api.get('/audit-logs/entities')
};

// Public API
export const publicAPI = {
  getLandingStats: () => api.get('/public/landing-stats'),
  getServices: (params) => api.get('/services', { params }),
  getEvents: (params) => api.get('/events/public', { params }),
  getEvent: (id) => api.get(`/events/public/${id}`),
  getAnnouncements: (params) => api.get('/announcements/public', { params }),
  getResource: (id) => api.get(`/resources/public/${id}`)
};

export default api;