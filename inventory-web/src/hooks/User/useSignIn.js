import { useState } from "react"
import { useAuth } from "../../context/AuthContext"

const useSignIn = () => {
  // Declare state insidethe useSignIn function
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(null)
  const {setAccessToken} = useAuth()
  const SignIn = async (username, password) => {
    // Reset state before making a new API call
    setIsLoading(true)
    setError(null)
    setIsSuccess(null)
    try {
      // Call API to perform login
      const BE_Location = 'http://127.0.0.1:8000'
      const response = await fetch (`${BE_Location}/auth/login`, 
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          "Username":username,
          "Password":password
        })
      }
    )
    // Handle error
    if (!response.ok) {
      const errorData = await response.json() 
      throw new Error(errorData?.detail || 'Sign-in failed');
    }
    const responseData = await response.json()

    const success =  responseData?.is_accept
    const receivedAccessToken = responseData?.access_token
    if (success && receivedAccessToken) {
      localStorage.setItem('accessToken', receivedAccessToken)
      setIsSuccess(Boolean(success))
      setAccessToken(receivedAccessToken)
    }
    else {
      setIsSuccess(false)
    }
    
    
    } catch (err) {
      setError(err.message)
      setIsSuccess(false)
    } finally {
      // Stop the loading because login is false
      setIsLoading(false)
    }
  };
  return {isLoading, error, isSuccess, SignIn}
}
export default useSignIn