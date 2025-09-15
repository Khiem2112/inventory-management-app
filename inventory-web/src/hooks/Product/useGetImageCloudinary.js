import { Cloudinary } from "@cloudinary/url-gen/index";
import { useEffect, useState } from "react";

const useGetImageCloudinary = (initialImageId) => {

  // State
  const [imageId, setImageId] = useState(initialImageId)
  const [imageObj, setImageObj] = useState(null)
  // Effect to manage imageObj
  useEffect(() => {
    // Cloudinary config
  let cloudinaryInstance = new Cloudinary({
    cloud: {
      cloudName: 'dxtd2ycxu'
    } 
  })

  // Set image obj to null if doesn't have imageid
  if (imageId ===null) {
    setImageObj(null)
  }
  else {
     const image = cloudinaryInstance.image(imageId)
     console.log(`Set image object: ${JSON.stringify(image)}`)
     setImageObj(image)
  }
  },[imageId])
  return {setImageId, imageObj}
}

export default useGetImageCloudinary;