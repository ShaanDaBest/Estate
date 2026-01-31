import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Add auth header to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("session_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("session_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
