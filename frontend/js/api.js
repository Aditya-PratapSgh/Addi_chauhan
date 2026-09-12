// Thin fetch wrapper around the Addi_chauhan backend API.
const API_BASE = window.ADDI_API_BASE || window.location.origin;

async function apiRequest(path, { method = 'GET', body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = localStorage.getItem('addi_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const api = {
  // auth
  register: (payload) => apiRequest('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/api/auth/me'),
  updateProfile: (payload) => apiRequest('/api/auth/profile', { method: 'PUT', body: payload }),
  forgotPassword: (payload) => apiRequest('/api/auth/forgot-password', { method: 'POST', body: payload, auth: false }),
  resetPassword: (payload) => apiRequest('/api/auth/reset-password', { method: 'POST', body: payload, auth: false }),

  // projects
  listProjects: (query = '') => apiRequest(`/api/projects${query}`, { auth: !!localStorage.getItem('addi_token') }),
  getProject: (id) => apiRequest(`/api/projects/${id}`, { auth: !!localStorage.getItem('addi_token') }),
  markViewed: (id) => apiRequest(`/api/projects/${id}/view`, { method: 'POST' }),
  toggleBookmark: (id) => apiRequest(`/api/projects/${id}/bookmark`, { method: 'POST' }),
  categories: () => apiRequest('/api/projects/categories', { auth: false }),
  createProject: (formData) => apiRequest('/api/projects', { method: 'POST', body: formData, isForm: true }),
  updateProject: (id, formData) => apiRequest(`/api/projects/${id}`, { method: 'PUT', body: formData, isForm: true }),
  deleteProject: (id) => apiRequest(`/api/projects/${id}`, { method: 'DELETE' }),

  // bookmarks
  myBookmarks: () => apiRequest('/api/bookmarks'),

  // admin
  students: () => apiRequest('/api/admin/students'),
  setStudentStatus: (id, active) => apiRequest(`/api/admin/students/${id}/status`, { method: 'PUT', body: { active } }),
  adminStats: () => apiRequest('/api/admin/stats'),

  // downloads (return absolute URLs; the browser handles the auth header via a token query fallback isn't used —
  // so these open through an authenticated fetch + blob instead)
  downloadFile: async (url, filename) => {
    const token = localStorage.getItem('addi_token');
    const res = await fetch(`${API_BASE}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Download failed.');
    }
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
