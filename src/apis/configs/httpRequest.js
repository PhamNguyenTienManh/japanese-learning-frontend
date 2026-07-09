import axios from "axios";

const request = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

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
