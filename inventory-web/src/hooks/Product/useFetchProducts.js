import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"

const useFetchProduct = () => {
  // state for loading product
  const BE_Location = "http://127.0.0.1:8000"
  const [productItems, setProductItems] = useState(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [loadingProductsError, setLoadingProductsError] = useState(null)
  const {accessToken} = useAuth()
  
  // function to call product data
  useEffect(() => {
    const FetchProduct = async () => {
      try {
        // Check if accessToken is available
        if (!accessToken) {
          throw new Error('No access token')
        }
        // fetch product from API
        const response = await fetch (`${BE_Location}/products/all/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        // check if response is ok
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData?.detail || 'Error when fetching user data')
        }
        // If ok, we continue
        const productsData = await response.json()
        setProductItems(productsData)
        console.log(`Fetched product data: ${productsData}`)
      }
      catch (err) {
        setLoadingProductsError(err.message)
        console.error(`Error fetching data`, err)
      }
      finally {
        // Close the loading phase
        setIsLoadingProducts(false)
      }
    }
    FetchProduct()
  },[accessToken])// The product can be refetch if user delete or modified a product which we will cover after develop those function)
  return {productItems, isLoadingProducts, loadingProductsError} 
}

export default useFetchProduct