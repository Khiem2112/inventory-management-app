import { createContext, useEffect, useState, useContext } from "react";
import { jwtDecode } from "jwt-decode";

// Step 1: Create a context object
const AuthContext = createContext(null);

// Step 2: Set up global variables
export const AuthProvider = ({ children }) => {
  // Common state
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [beLocation, setBELocation] = useState('http://127.0.0.1:8000')

  // re-update access_token
  useEffect(() => {
    const access_token = localStorage.getItem('accessToken');
    if (access_token) {
      try {
        setAccessToken(access_token);
        const decodedToken = jwtDecode(access_token);
        setUserData(decodedToken);
        console.log(`User data is decoded from token:`);
        console.log(decodedToken);
      } catch (err) {
        console.log(`Failed to load or decode token: ${err.message}`);
        // Clear bad token if decoding fails
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setUserData(null);
      }
    }
    // Always set loading to false after initial check
    setIsLoading(false);
  }, []);

  // re-update refresh token
  useEffect(() => {
    const refresh_token = localStorage.getItem('refreshToken');
    if (refresh_token) {
      try {
        setRefreshToken(refresh_token);
        console.log(`we receive new decoded refresh token: ${decodedToken}`);
      } catch (err) {
        console.log(`Failed to load or decode token: ${err.message}`);
        // Clear bad token if decoding fails
        // localStorage.removeItem('refreshToken');
        setRefreshToken(null);
      }
    }
    // Always set loading to false after initial check
    setIsLoading(false);
  }, []);

	//Logout function
	const logout = () => {
		setAccessToken(null)
		setUserData(null)
		localStorage.removeItem('accessToken')
	}
  // 💡 Only expose the data and the token setter, not the data setter
  const value = {
    accessToken, 
    setAccessToken,
    refreshToken,
    setRefreshToken, 
    isLoading, 
    userData, 
    logout,
    beLocation};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to access the Context
export const useAuth = () => {
  return useContext(AuthContext);
};