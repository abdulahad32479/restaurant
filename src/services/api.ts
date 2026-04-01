import axios from 'axios';

// Get base URL from environment or use proxy
const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "https://pos-backend-production-b659.up.railway.app/api/";
const API_BASE = rawBaseURL.replace(/\/api\/?$/, '');
const STAFF_ROOT = "/api/staff";

export const staffApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to add JWT and fix URL strictly
staffApi.interceptors.request.use(
  (config) => {
    // 1. Auth: Check both common storage keys
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('access') || localStorage.getItem('access_token')) 
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. URL Construction: Construct /api/staff/{endpoint}/
    // We force the path to be relative to STAFF_ROOT and ensure trailing slashes
    if (config.url) {
      let path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      if (!path.endsWith('/')) {
        path = `${path}/`;
      }
      config.url = `${STAFF_ROOT}${path}`;
    }

    console.log(`[StaffAPI Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  (error) => Promise.reject(error)
);

staffApi.interceptors.response.use(
  (res) => {
    console.log(`[StaffAPI Response] ${res.status}`, res.data);
    return res;
  },
  (error) => {
    // Flatten Django validation errors for display
    let errMsg = error.message;
    if (error.response?.data) {
      if (typeof error.response.data === 'object') {
        errMsg = Object.entries(error.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
          .join(' | ');
      } else {
        errMsg = error.response.data;
      }
    }
    console.error(`[StaffAPI Error] Status ${error.response?.status}:`, errMsg);
    return Promise.reject(error);
  }
);

export default staffApi;
