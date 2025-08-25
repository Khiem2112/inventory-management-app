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
    return response;
  },
  (error) => {
    // For example, if a 401 Unauthorized error occurs, you can redirect the user to the login page
    if (error.response.status === 401) {
      console.log('Unauthorized request. Redirecting to login.');
      // You would dispatch a Redux action to log out the user here
    }
    return Promise.reject(error);
  }
);

export default api;