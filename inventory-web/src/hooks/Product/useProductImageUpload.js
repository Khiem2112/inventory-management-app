// src/hooks/Product/useProductImageUpload.js
import { useMutation } from "@tanstack/react-query";
import api from "../../services/api";

const useProductImageUpload = () => {
  const { mutateAsync, isLoading, error } = useMutation({
    mutationFn: async (imageFile) => {
      const formData = new FormData();
      formData.append('upload_file', imageFile);

      const response = await api.post(
        'http://127.0.0.1:8000/products/upload-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data'
        } }
      );

      return response.data; // Assuming the response contains imageId and imageUrl
    },
  });

  return { mutateAsync, isLoading, error };
};

export default useProductImageUpload;