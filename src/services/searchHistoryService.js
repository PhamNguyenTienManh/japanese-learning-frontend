// src/services/searchHistoryService.js

import axios from "axios";

const API_BASE_URL = "http://localhost:9090/api/search-history";

const searchHistoryService = {
  getSearchHistory: async (userId) => {
    try {
      const result = await axios.get(`${API_BASE_URL}/user/${userId}`);
      
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
      const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error adding search history:", error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Xóa một từ khóa khỏi lịch sử
  removeSearchHistory: async (userId, query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error removing search history:", error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Xóa toàn bộ lịch sử
  clearAllHistory: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/clear`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error clearing search history:", error);
      return {
        success: false,
        message: error.message
      };
    }
  },
};

export default searchHistoryService;