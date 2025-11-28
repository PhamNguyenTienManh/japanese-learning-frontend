import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090/api';
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


  getCommunityStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching community stats:', error);
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

  createPost: async (postData) =>  {
    
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

  // Delete post
  async deletePost(id) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

};

export default postService;