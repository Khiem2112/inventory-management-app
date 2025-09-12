// src/hooks/useImagePreview.js
import { useState, useEffect } from 'react';

const useImagePreview = (file) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Cleanup function to revoke the object URL
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]); // The hook reruns whenever the file changes

  return previewUrl;
};

export default useImagePreview;