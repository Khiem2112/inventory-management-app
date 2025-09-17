import React, { useState, useEffect, createContext, useContext } from 'react';
import { Helmet } from 'react-helmet';

// Create a context to share the script's loaded status
const CloudinaryScriptContext = createContext(false);

export const CloudinaryProvider = ({ children }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // This is the ideal place to load the script once for the entire app
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => console.error('Cloudinary script failed to load.');
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  return (
    <CloudinaryScriptContext.Provider value={scriptLoaded}>
      {children}
    </CloudinaryScriptContext.Provider>
  );
};

// Custom Hook to access the Context
export const useCloudinary = () => {
  return useContext(CloudinaryScriptContext);
};