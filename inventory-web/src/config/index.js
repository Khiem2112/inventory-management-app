// inventory-management-app/inventory-web/src/config/index.js

// This file is the single source of truth for environment-specific variables.
const isDevelopment = import.meta.env.DEV; // Vite's built-in flag

const API_CONFIG = {
  // Use VITE_API_URL (http/https) and apply a safe fallback
  BASE_URL: import.meta.env.VITE_API_URL,
  // Use VITE_WS_URL (ws/wss) and apply a safe fallback
  WS_BASE_URL: import.meta.env.VITE_WS_URL,
  
  // Expose methods for consumers to safely get the URL
  getEffectiveBaseUrl: () => API_CONFIG.BASE_URL || 'http://127.0.0.1:8000',
  getEffectiveWsUrl: () => API_CONFIG.WS_BASE_URL || 'ws://127.0.0.1:8000'
};

export default API_CONFIG;