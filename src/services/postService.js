import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true;
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

const postService = {

  getPosts: async (page = 1, limit = 10, sort = 'popular') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts`, {
        params: { page, limit, sort }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  getPostById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/post/${id}`);

      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  getAdminPosts: async ({ page = 1, limit = 10, q = '', category = 'all', status = 'active' } = {}) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/posts/admin`, {
        params: { page, limit, q, category, status }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin posts:', error);
      throw error;
    }
  },

  getAccessiblePostById: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/posts/post/${id}/accessible`);

      return response.data;
    } catch (error) {
      console.error('Error fetching accessible post:', error);
      throw error;
    }
  },

  getAdminPostById: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/posts/admin/post/${id}`);

      return response.data;
    } catch (error) {
      console.error('Error fetching admin post:', error);
      throw error;
    }
  },

  searchPosts: async (query, page = 1, limit = 5) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/search`, {
        params: { q: query, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  getPostsByCategory: async (category, page = 1, limit = 5) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/category`, {
        params: { category, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      throw error;
    }
  },

  getActiveMembers: async (limit = 5) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profiles/active-members`, {
        params: { limit }
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching active members:', error);
      throw error;
    }
  },

  getCategories: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/post-categories`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getComments: async (postId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/comments/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  getAdminComments: async (input) => {
    try {
      if (input && typeof input === 'object') {
        const response = await axiosInstance.get(`${API_BASE_URL}/comments/admin`, {
          params: input
        });
        return response.data;
      }

      const response = await axiosInstance.get(`${API_BASE_URL}/comments/admin/${input}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin comments:', error);
      throw error;
    }
  },

  addComment: async (postId, content) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/comments/posts/${postId}`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  toggleLike: async (postId) => {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/posts/liked/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  toggleCommentLike: async (commentId) => {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/comments/liked/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  },

  // replyToComment: async (commentId, content) => {
  //   try {
  //     const response = await axios.post(`${API_BASE_URL}/comments/${commentId}/replies`, {
  //       content
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error replying to comment:', error);
  //     throw error;
  //   }
  // },

  createPost: async (postData) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/posts`,
        postData
      );

      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  async updatePost(id, postData) {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/posts/${id}`, postData);
      return response.data;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  },

  async deletePost(id) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
  async restorePost(id) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/posts/admin/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error("Error restoring post:", error);
      throw error;
    }
  },
  async restoreComment(id) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/comments/admin/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error("Error restoring comment:", error);
      throw error;
    }
  },
  async updateComment(id, postData) {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/comments/${id}`, postData);
      return response.data;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  },
  async deleteComment(id) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/comments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },

};

export default postService;
