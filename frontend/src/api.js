import axios from 'axios';

// ✅ Force production fallback if env not loaded
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://payguard-devtrails-1.onrender.com/api";

// 🔍 Debug (remove later if you want)
console.log("API URL:", BASE_URL);

// 🔐 Create axios instance
const API = axios.create({
  baseURL: BASE_URL,
});

// 🔑 Attach token automatically
API.interceptors.request.use(cfg => {
  const isAdminRoute = (cfg.url || '').includes('/admin');

  const token = isAdminRoute
    ? localStorage.getItem('pg_admin_token')
    : localStorage.getItem('pg_token');

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});

// 🚨 Handle unauthorized (401)
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pg_admin_token');
      localStorage.removeItem('pg_token');

      if (window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/admin/login');
      } else {
        window.history.pushState({}, '', '/');
      }

      window.location.reload();
    }

    return Promise.reject(err);
  }
);

// ================= AUTH =================
export const authAPI = {
  sendOTP: (phone, purpose) =>
    API.post('/auth/send-otp', { phone, purpose }),

  verifyOTP: (phone, otp, purpose, name) =>
    API.post('/auth/verify-otp', { phone, otp, purpose, name }),

  me: () =>
    API.get('/auth/me'),

  preferences: (data) =>
    API.patch('/auth/preferences', data),
};

// ================= KYC =================
export const kycAPI = {
  sendAadhaarOTP: (aadhaar) =>
    API.post('/kyc/aadhaar-otp', { aadhaar }),

  verifyAadhaar: (txnId, otp, aadhaarLast4) =>
    API.post('/kyc/aadhaar-verify', { txnId, otp, aadhaarLast4 }),

  linkPlatform: (platform) =>
    API.post('/kyc/link-platform', { platform }),

  zoneScan: (lat, lng) =>
    API.post('/kyc/zone-scan', { lat, lng }),

  locationUpdate: (payload) =>
    API.post('/kyc/location-update', payload),

  location: () =>
    API.get('/kyc/location'),
};

// ================= POLICY =================
export const policyAPI = {
  activate: (plan) =>
    API.post('/policy/activate', { plan }),

  toggle: () =>
    API.patch('/policy/toggle'),

  premiumCalc: (params = {}) =>
    API.get('/policy/premium-calc', { params }),

  dashboard: () =>
    API.get('/policy/dashboard'),

  claim: (triggerType) =>
    API.post('/policy/claim', { triggerType }),
};

// ================= PREMIUM =================
export const premiumAPI = {
  calculate: (params = {}) =>
    API.get('/premium/calculate', { params }),
};

// ================= ADMIN =================
export const adminAPI = {
  login: (username, password) =>
    API.post('/admin/login', { username, password }),

  controlCenter: () =>
    API.get('/admin/control-center'),

  config: (payload) =>
    API.post('/admin/config', payload),

  analytics: () =>
    API.get('/admin/analytics'),
};

// ================= SIMULATION =================
export const simulateAPI = {
  weather: (payload) =>
    API.post('/simulate/weather', payload),

  downtime: (payload) =>
    API.post('/simulate/downtime', payload),

  strike: (payload) =>
    API.post('/simulate/strike', payload),

  accident: (payload) =>
    API.post('/simulate/accident', payload),

  accountBlock: (payload) =>
    API.post('/simulate/account-block', payload),

  timeline: (userId) =>
    API.get(`/simulate/claims/${userId}`),

  detailedTimeline: (userId) =>
    API.get(`/simulate/timeline?userId=${encodeURIComponent(userId)}`),
};

// ================= MONITOR =================
export const monitorAPI = {
  start: (payload) =>
    API.post('/monitor/start', payload),

  stop: (payload) =>
    API.post('/monitor/stop', payload),

  status: () =>
    API.get('/monitor/status'),
};