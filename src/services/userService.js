import axios from 'axios';

const API_URL = 'http://localhost:9090/api';

// Tạo axios instance với config mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - có thể thêm token vào đây
apiClient.interceptors.request.use(
  (config) => {
    // Có thể thêm token từ localStorage
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

// Response interceptor - xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Xử lý unauthorized - có thể redirect về login
      console.error('Unauthorized - Please login again');
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  // Lấy tất cả users
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Lấy chi tiết 1 user
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Cập nhật trạng thái user
  updateUserStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/users/${id}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Cập nhật vai trò user
  updateUserRole: async (id, role) => {
    try {
      const response = await apiClient.patch(`/users/${id}/role`, {
        role
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Xóa user (nếu cần)
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  
};