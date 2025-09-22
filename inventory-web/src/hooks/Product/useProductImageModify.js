import { useMutation } from "@tanstack/react-query"
import api from "../../services/api"


const useProductImageModify =() =>{
  const {mutateAsync, isLoading, error} = useMutation({
    mutationFn: async ({productId, imageFile}) => {
      const formData = new FormData()
      formData.append('upload_file',imageFile)
      formData.append('product_id',productId)

      const response = await api.put(`/products/${productId}/image`,
        formData, {
          headers: {"Content-Type": "multipart/form-data"}
        }
      )
      console.log("Have updated new image")
      return response.data
    }
  })
  return {mutateAsync, isLoading, error}

}
export default useProductImageModify