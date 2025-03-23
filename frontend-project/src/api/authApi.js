import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

// ✅ Register a new user
export const registerUser = async (userData) => {
  return await axios.post(`${API_URL}/register`, userData);
};

// ✅ Login user and get JWT token
export const loginUser = async (loginData) => {
  return await axios.post(`${API_URL}/login`, loginData);
};
