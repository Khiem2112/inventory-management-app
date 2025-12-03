import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import api from "../services/api"; // Your API service
import { Box, CircularProgress, Typography } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const { accessToken, isLoading: isAuthLoading, logout } = useAuth();
  
  // Start as TRUE to block UI by default
  const [isServerValidating, setIsServerValidating] = useState(true);
  
  // Track if we have completed validation for the CURRENT token
  const validatedTokenRef = useRef(null);

  useEffect(() => {
    // 1. Wait for AuthContext to initialize
    if (isAuthLoading) return;

    // 2. If no token, stop validation logic (The Render logic handles redirect)
    if (!accessToken) {
      setIsServerValidating(false);
      return;
    }

    // 3. CHECK: Have we already validated THIS specific token?
    if (validatedTokenRef.current === accessToken) {
      // FIX: If we already validated, ensure we turn off loading!
      setIsServerValidating(false);
      return;
    }

    // 4. Perform the validation
    const validateToken = async () => {
      try {
        // Ensure state is loading before starting
        setIsServerValidating(true);
        console.log("🔒 ProtectedRoute: Validating token...");
        
        const response = await api.get('/auth/validate');
        
        if (!response.ok) {
           throw new Error(`Validation HTTP ${response.status}`);
        }
        
        console.log("🔓 ProtectedRoute: Validation Passed.");
        // Mark this token as safe so we don't check it again
        validatedTokenRef.current = accessToken; 
        
      } catch (err) {
        console.error("⛔ ProtectedRoute: Validation Failed", err);
        // If validation fails, kill the session
        // logout(); 
      } finally {
        // ALWAYS turn off loading, whether success or fail
        setIsServerValidating(false);
      }
    };

    validateToken();
  }, [accessToken, isAuthLoading, logout]);

  // --- RENDER LOGIC ---

  // 1. Show Spinner while AuthContext loads OR while Server validates
  if (isAuthLoading || isServerValidating) {
    return (
      <Box sx={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
           Verifying Security...
        </Typography>
      </Box>
    );
  }

  // 2. If finished loading and NO token, redirect
  if (!accessToken) {
    return <Navigate to="/sign-in" replace />;
  }

  // 3. If finished loading and HAS token, render Dashboard
  return children;
};

export default ProtectedRoute;