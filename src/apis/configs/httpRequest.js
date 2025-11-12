import axios from "axios";

// Tạo instance axios
const request = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Log baseURL để kiểm tra
console.log("Axios baseURL:", request.defaults.baseURL);

// Wrapper GET
export const get = async (url, options = {}) => {
  const res = await request.get(url, options);
  return res.data;
};

// Wrapper POST
export const post = async (url, data = {}, options = {}) => {
  const res = await request.post(url, data, options);
  return res.data;
};

// Wrapper PUT
export const put = async (url, data = {}, options = {}) => {
  const res = await request.put(url, data, options);
  return res.data;
};

// Wrapper DELETE
export const del = async (url, options = {}) => {
  const res = await request.delete(url, options);
  return res.data;
};

export const patch = async (url, data = {}, options = {}) => {
  const res = await request.patch(url, data, options);
  return res.data;
};

export default request;
