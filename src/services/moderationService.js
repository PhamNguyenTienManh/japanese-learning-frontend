import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BASE_URL_API;
export const MODERATION_COUNTS_REFRESH_EVENT = "moderation-counts-refresh";

const moderationClient = axios.create({
  baseURL: `${API_BASE_URL}/moderation`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const moderationService = {
  getCases: async ({ status = "pending", targetType = "", source = "", page = 1, limit = 20 } = {}) => {
    const response = await moderationClient.get("/cases", {
      params: { status, targetType, source, page, limit },
    });
    return response.data;
  },

  reportPost: async (postId, payload) => {
    const response = await moderationClient.post(`/reports/posts/${postId}`, payload);
    return response.data;
  },

  getCaseCounts: async () => {
    const response = await moderationClient.get("/cases/counts");
    return response.data;
  },

  getPostAiMetrics: async (range = "30d") => {
    const response = await moderationClient.get("/metrics/post-ai", {
      params: { range },
    });
    return response.data;
  },

  deleteCase: async (id) => {
    const response = await moderationClient.patch(`/cases/${id}/delete`);
    return response.data;
  },

  dismissCase: async (id) => {
    const response = await moderationClient.patch(`/cases/${id}/dismiss`);
    return response.data;
  },

  restoreCase: async (id) => {
    const response = await moderationClient.patch(`/cases/${id}/restore`);
    return response.data;
  },

  getSettings: async () => {
    const response = await moderationClient.get("/settings");
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await moderationClient.put("/settings", settings);
    return response.data;
  },
};

export default moderationService;
