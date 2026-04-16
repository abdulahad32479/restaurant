import apiClient from '../lib/axios';

/**
 * Staff-specific API wrapper
 * This ensures all staff requests go through /api/v1/staff and 
 * benefit from the central auth/refresh logic in apiClient.
 */
export const staffApi = {
  get: <T>(url: string, config?: any) => {
    return apiClient.get<T>(formatStaffUrl(url), config);
  },
  post: <T>(url: string, data?: any, config?: any) => {
    return apiClient.post<T>(formatStaffUrl(url), data, config);
  },
  patch: <T>(url: string, data?: any, config?: any) => {
    return apiClient.patch<T>(formatStaffUrl(url), data, config);
  },
  put: <T>(url: string, data?: any, config?: any) => {
    return apiClient.put<T>(formatStaffUrl(url), data, config);
  },
  delete: <T>(url: string, config?: any) => {
    return apiClient.delete<T>(formatStaffUrl(url), config);
  },
};

function formatStaffUrl(url: string): string {
  // Ensure we are hitting the correct v1 staff path
  const prefix = 'v1/staff/';
  let path = url.startsWith('/') ? url.substring(1) : url;
  if (!path.endsWith('/')) {
    path = `${path}/`;
  }
  return `${prefix}${path}`;
}

export default staffApi;
