import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"
import api from "../services/api"
const ProtectedRoute = ({children}) => {
  // Declare local state
  const {accessToken, isLoading} = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [isValidating, setIsValidating]= useState(true)
  const [error, setError] = useState(null)
  console.log('ProtectedRoute:', 'isLoading:', isLoading, 'accessToken:', accessToken);

  //check if user are logged in
  useEffect (() => {
    const validate_token = async () => {
    try {
      // State when start API call loading
      setIsValidating(true)
      setError(null) //Clear previous error
      // Call API to BE
      console.log(`Start call API with accessToken: ${accessToken} and loading status: ${isLoading}`)
      const response = await api.get('/auth/validate')
      // Case when API response not ok
      if (!response.ok) {
        setIsValidating(false)
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const responseData = await response.json()
      console.log(`Token is valid ${responseData}`)
      setIsValidating(false)
      const is_active = responseData?.is_active
      setIsActive(is_active)
    }
    catch (err) {
      // localStorage.removeItem('accessToken')
      setError(err.message)
      console.error(`Face error`, err)
    }
    finally {
      // End validating after all
      setIsValidating(false)
      console.info('API call is completed')
    }
  }
    validate_token()
  } ,[accessToken, isLoading])
  // Handle when a page is loading
  if (isLoading || isValidating) {
    return <div>
      Page is loading
    </div>
  }
  if (accessToken) {
    return children
  }
  // if not return them back to sign-in page
  return <Navigate to ="/sign-in" replace/>
}
export default ProtectedRoute