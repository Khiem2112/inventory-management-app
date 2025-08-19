import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
const useFetchUserData = () => {
  //Declare its state
  const [isFetchingUserData, setIsFetchingUserData] = useState(true)
  const {accessToken} = useAuth()
  const [userDetailData, setUserDetailData] = useState(null)
  const [fetchUserDataError, setFetchUserDataError] = useState(null)
  
  useEffect(() => {
    if (!accessToken) {
        setIsFetchingUserData(false)
        console.warn('No access token found')
        return
    }
      // Function to fetch user data
    const FetchUserData = async () => {
    // initial state
    setIsFetchingUserData(true)
    setFetchUserDataError(null) 
    // call get API
    try {
      const BE_Location = 'http://127.0.0.1:8000'
    const response = await fetch(`${BE_Location}/users/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }

    })
    // Handle error
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Fetch user data error')
    }
    // Handle response
    const responseUserData = await response.json()
    setUserDetailData(responseUserData)
    console.log(`Successfully fetched data for user:`, responseUserData)
    }
    // catch error and log it
    catch (err) {
      setFetchUserDataError(err.message)
      console.error(`Error fetching user data`, err)
    }
    // End the fetching data process
    finally {
      setIsFetchingUserData(false)
    }
  }
  FetchUserData()
  },[accessToken])

  return {isFetchingUserData, userDetailData, fetchUserDataError}
}
export default useFetchUserData