import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, config);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${response?.status || 'ERROR'} ${config?.url}`, error);
    }

    // Handle specific HTTP errors
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          if (!config.url.includes('/auth/login')) {
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
          
        case 404:
          toast.error('Resource not found');
          break;
          
        case 422:
          // Validation errors - handled by components
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(response.data?.message || 'An error occurred');
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!navigator.onLine) {
      toast.error('No internet connection');
    } else {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Helper methods for common requests
export const apiService = {
  // GET request
  get: async (url, params = {}, config = {}) => {
    try {
      const response = await api.get(url, { params, ...config });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload file
  upload: async (url, file, fieldName = 'file', additionalData = {}) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download file
  download: async (url, filename, params = {}) => {
    try {
      const response = await api.get(url, {
        params,
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;