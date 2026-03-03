import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://pos-backend-production-b659.up.railway.app/api/';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (refreshToken) {
        try {
          const response = await axios.post(`${baseURL}auth/refresh/`, {
            refresh: refreshToken,
          });

          if (response.status === 200) {
            const { access } = response.data;
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', access);
            }
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token available
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
