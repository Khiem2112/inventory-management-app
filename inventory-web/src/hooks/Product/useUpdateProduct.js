import { useState } from "react"
import { useAuth } from "../../context/AuthContext"

const useUpdateProduct = () => {
  // Inner state
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [updatingProductError, setUpdatingProductError] = useState(null)
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState(null)
  // Access token
  const {accessToken, beLocation} = useAuth()

  const UpdateProduct = async (productId, productsData) => {
    /**
     * Updates a product on the backend.
     * @param {string} productId - The ID of the product to update.
     * @param {Object} productsData - An object containing the product data.
     */
    try {
      // the starting status
      setIsUpdatingProduct(true)
      const response = await fetch(`${beLocation}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productsData)
      })
      // Check error
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error (errorData?.detail || 'Unexpected problem')
      }
      // if success
      const responseJson = await response.json()
      setUpdateSuccessMessage(responseJson?.message || `Successfully updated product ${productsData?.ProductName}`)
      console.log('Successfully update product...')
    }
    catch (error) {
      setUpdatingProductError(error?.message)
      console.log('Problem when updating product', error)
    }
    finally {
      // complete updating
      setIsUpdatingProduct(false)
    }
  }
  return {isUpdatingProduct, updatingProductError, updateSuccessMessage, UpdateProduct}

}
export default useUpdateProduct