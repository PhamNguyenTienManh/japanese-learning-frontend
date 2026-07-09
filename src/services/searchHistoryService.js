// src/services/searchHistoryService.js

import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/search-history`;
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
const searchHistoryService = {
  getSearchHistory: async (userId) => {
    try {
      const result = await axiosInstance.get(`${API_BASE_URL}/user/${userId}`);


      if (result) {
        return {
          success: true,
          history: result.data.data.history || [],
          count: result.data.count || 0,
          message: result.data.message
        };
      }

      return {
        success: false,
        history: [],
        count: 0,
        message: "Không thể tải lịch sử tìm kiếm"
      };
    } catch (error) {
      console.error("Error fetching search history:", error);
      return {
        success: false,
        history: [],
        count: 0,
        message: error.message
      };
    }
  },

  addSearchHistory: async (userId, query) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/user/${userId}`, {
        query

      });

      return response.data;
    } catch (error) {
      console.error("Error adding search history:", error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  removeSearchHistory: async (userId, term) => {
    try {
      const response = await axiosInstance.delete(
        `${API_BASE_URL}/user/${userId}`,
        { params: { term } }
      );
      return response;
    } catch (error) {
      console.error("Error removing search history:", error);
      return {
        success: false,
        message: error.message
      };
    }
  },

};

export default searchHistoryService;
