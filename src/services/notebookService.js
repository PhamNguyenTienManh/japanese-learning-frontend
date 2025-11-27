import axios from 'axios';

const API_URL = 'http://localhost:9090/api';

// Tạo axios instance với interceptor để tự động thêm token
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào mọi request
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

const notebookService = {
  // Tạo notebook mới
  createNotebook: async (name) => {
    try {
      const response = await axiosInstance.post('/notebook', { name });
      return response.data;
    } catch (error) {
      console.error('Error creating notebook:', error);
      throw error;
    }
  },

  getNotebooks: async () => {
    try {
      const response = await axiosInstance.get('/notebook/my_notebook');
      return response.data.data;
      
    } catch (error) {
      console.error('Error fetching notebooks:', error);
      throw error;
    }
  },
  updateNotebook: async (id, name) => {
    try {
      const response = await axiosInstance.put(`/notebook/${id}`, { name });
      return response.data;
    } catch (error) {
      console.error('Error updating notebook:', error);
      throw error;
    }
  },
  // Xóa notebook
  deleteNotebook: async (id) => {
    try {
      const response = await axiosInstance.delete(`/notebook/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notebook:', error);
      throw error;
    }
  },

  

  // Xóa từ khỏi notebook
  deleteWord: async (notebookId, wordId) => {
    try {
      const response = await axiosInstance.delete(
        `/notebook-item/${wordId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting word:', error);
      throw error;
    }
  },

  getWord: async (notebookId) => {
    try{
      const response = await axiosInstance.get(
        `/notebook-item/${notebookId}`
      );
      return  response.data;
    }catch(err){
      console.log('err getting word', err);
      throw err;
      
    }
  },
  addWord: async (notebookId, data) => {
    console.log("ditmemay", data);
    
    try{
      const response = await axiosInstance.post(
        `/notebook-item/${notebookId}`,data
      );
      return  response.data;
    }catch(err){
      console.log('err create word', err);
      throw err;
      
    }
  },
};

export default notebookService;