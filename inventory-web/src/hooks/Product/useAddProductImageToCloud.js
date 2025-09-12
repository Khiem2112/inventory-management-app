// src/hooks/useAddImageToCloudinary.js

import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import axios from 'axios';
const useAddImageToCloudinary = () => {
  

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dxtd2ycxu/image/upload";
  const CLOUDINARY_UPLOAD_PRESET = "upload_prod_image";
  const CLOUDINARY_API_KEY = "772462755432471"

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('api_key', CLOUDINARY_API_KEY)
      // Removed 'api_key' because upload presets should handle authentication on the client-side
      
      console.log(`Start to upload image to cloudinary`);
      
      try {
      // ✅ Use your imported 'api' instance
        const response = await axios.post(CLOUDINARY_URL, formData);
        const data = response.data;
        console.log('Cloudinary response:', data);
        return data.public_id;
      } catch (error) {
        console.error('Image upload failed:', error);
        throw new Error('Image upload failed');
      }
    },
  });
};

export default useAddImageToCloudinary