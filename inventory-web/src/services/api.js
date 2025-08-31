// src/services/api.js

import axios from 'axios';

// 💡 1. Create an Axios instance with a base URL
// This automatically prepends the URL to all requests
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 2. Add a request interceptor
// This allows you to modify requests before they are sent
api.interceptors.request.use(
  (config) => {
    // You can get the user's token from local storage or Redux here
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Add the authorization header to every request
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 💡 3. Add a response interceptor
// This allows you to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    // Check if the error is 401 and it's not a refresh token request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to avoid infinite loops

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post('http://127.0.0.1:8000/auth/refresh-token', {
            Token: refreshToken,
          });
          
          const newAccessToken = response.data.access_token
          const newRefreshToken = response.data.refresh_token

          // Update tokens in localStorage and the default headers
          localStorage.setItem('accessToken', newAccessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

          // Retry the original request
          return api(originalRequest)
        } catch (refreshError) {
          // If the refresh token also fails, log the user out
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          // You would also redirect to the login page here
          return Promise.reject(refreshError)
        }
      }
    }
    return Promise.reject(error)
  }
);

export default api