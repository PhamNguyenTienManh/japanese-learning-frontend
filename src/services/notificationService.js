import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BASE_URL_API;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const notificationService = {
  getNotifications: async (userId) => {
    const response = await axiosInstance.get(`/notifications/${userId}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    return axiosInstance.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (userId) => {
    return axiosInstance.put(`/notifications/${userId}/read-all`);
  },

  deleteNotification: async (notificationId) => {
    return axiosInstance.delete(`/notifications/${notificationId}`);
  },

  getUnreadCount: async (userId) => {
    const response = await axiosInstance.get(`/notifications/${userId}/unread-count`);
    return response.data;
  },
  pushNotification: (data) => {
    return axiosInstance.post("/notifications/push", data);
  },
};

export default notificationService;
