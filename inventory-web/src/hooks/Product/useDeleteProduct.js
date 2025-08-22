// src/hooks/Product/useDeleteProduct.js

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const useDeleteProduct = () => {
  // state for deletion
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deletingError, setDeletingError] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(null); // 💡 Initialized with null

  // context
  const { accessToken, beLocation } = useAuth();
  
  //function to perform deletion
  const DeleteProduct = async (productId) => {
    try {
      // set deleting status
      setIsDeletingProduct(true);
      setDeletingError(null); // 💡 Reset any previous errors
      setDeleteSuccessMessage(null); // 💡 Reset any previous success messages
      
      const response = await fetch(`${beLocation}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      // Check if we have error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || 'Unexpected error when deleting product');
      }
      // if ok, we continue
      const response_json = await response.json();
      const message = response_json?.message;
      setDeleteSuccessMessage(message);
      console.log(`${message}`);
    } catch(error) {
      // 💡 All errors should set the deletingError state
      if (error.message.includes('Failed to fetch')) {
        setDeletingError('Network Error: Please check your internet connection or if the server is running.');
      }
      // Normal issue
      else {
        setDeletingError(error.message);
        console.error('Error deleting product', error);
      }
    } finally {
      setIsDeletingProduct(false);
    }
  };
  return { isDeletingProduct, deletingError, deleteSuccessMessage, DeleteProduct };
};

export default useDeleteProduct