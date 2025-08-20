import { useState } from "react"
import { useAuth } from "../../context/AuthContext"


const useAddNewProduct = () => {
  // Context variable
  const {accessToken} = useAuth()
  // Local state
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [addingProductError, setAddingProductError] = useState(null)
  const [congratulationResponse, setCongratulationResponse] = useState(null)
  const BE_Location = 'http://127.0.0.1:8000'
  const addNewProduct = async (productsData) => {
    /**
   * Calculates the sum of two numbers.
   * @param {productsData} productsData - an Objects/dictionary containing
    * ProductName
    * Measurement
    * SellingPrice
    * InternalPrice
   */
    try {
      console.log('Start fetching product')
      setIsAddingProduct(true)
      const response = await fetch (`${BE_Location}/products/`, {
        method : 'POST',
        headers : {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productsData)
      })
      // Check main status of response
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData?.detail ||'An unexpected error occurred on the server.')
      }
      // Continue
      const congratulationData = await response.json()
      setCongratulationResponse(congratulationData)
      console.log('Added new product to db')
    }
    catch (error) {
      if (error.message.includes('Failed to fetch')) {
        setAddingProductError('Network Error: Please check your internet connection or if the server is running.');
      } else {
          // 💡 Use the specific error message from the backend
        setAddingProductError(error.message);
      }
      console.error('Error adding product', error)
    }
    finally {
      setIsAddingProduct(false)
    }
  }
  return {isAddingProduct, addingProductError, congratulationResponse, addNewProduct}
}
export default useAddNewProduct