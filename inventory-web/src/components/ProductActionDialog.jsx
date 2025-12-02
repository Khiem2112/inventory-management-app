import {
  Dialog, TextField, Button, Typography, CircularProgress, Alert,
  DialogTitle, DialogActions, DialogContent, Select, MenuItem,
  FormControl, InputLabel, IconButton, Box,
  Stack
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import useAddNewProduct from "../hooks/Product/useAddNewProduct";
import useUpdateProduct from "../hooks/Product/useUpdateProduct";
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import useProductImageUpload from "../hooks/Product/useProductImageUpload";
import useProductImageModify from "../hooks/Product/useProductImageModify";
import { 
  addNewProductAsync, 
  updateProductAsync, 
  fetchAllProductsAsync, 
  fetchSomeProductsAsync, 
  setSelectedProduct,
  setSelectedProductWithIndex,
  resetSelectedProductWithIndex } from "../myRedux/slices/ProductsSlice";
import { useDispatch, useSelector } from "react-redux";
import useImagePreview from "../hooks/Product/useImagePreview";
import useGetImageCloudinary from "../hooks/Product/useGetImageCloudinary";
import axios from "axios";
import api from "../services/api";
import { Cloudinary } from "@cloudinary/url-gen/index";
import { AdvancedImage } from "@cloudinary/react";

const ProductActionDialog = ({ open, onClose, tag}) => {
  // Local states for the form
  const [currentProductId, setCurrentProductId] = useState(null)
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentMeasurement, setCurrentMeasurement] = useState('kg');
  const [currentSellingPrice, setCurrentSellingPrice] = useState(0);
  const [currentInternalPrice, setCurrentInternalPrice] = useState(0);
  const [productImage, setProductImage] = useState({
    file: null,      // The file object for a new upload
    url: null,       // The URL to display (either local or Cloudinary)
    id: null,        // The Cloudinary public ID
});
  const fileInputRef = useRef(null); // <-- Create a ref for the hidden input
  const dialogContentRef = useRef(null)


  // Use hooks for the two actions
    // Hooks for Add one new product
  const dispatch = useDispatch()
  const product = useSelector((state)=> state.products.selectedProduct)
  const selectedIndex = useSelector((state)=> state.products.selectedIndex)
  const products = useSelector((state)=> state.products.items)
  const addingProductError = useSelector((state)=> state.products.error.addOne)
  const updatingProductError = useSelector((state)=> state.products.error.updateOne)
  const isAddingProduct = useSelector((state)=> state.products.status.addOne === 'pending')
  const isUpdatingProduct = useSelector((state)=> state.products.status.updateOne === 'pending')
  const currentPage = useSelector((state) => state.products.pagination.currentPage)
  const pageLimit = useSelector((state) => state.products.pagination.limit)
  const totalPage = useSelector((state) => state.products.pagination.totalPage)
    // Hooks about cloudinary image

  const [congratulationResponse, setCongratulationResponse] = useState(null);
  const [updateSuccessMessage, setUpdateSuccessMessage ] = useState(null);
  const [message, setMessage] = useState(null)
  // For image preview

  // Fpr image upload
  const { mutateAsync: uploadImage, isLoading: isImageUploading, error: imageUploadError } = useProductImageUpload();
  const {mutateAsync: updateImage, isLoading: isImageUpdating, error: imageUpdateError} = useProductImageModify()

  // Function to clear all data fields
  console.log(`Product adding status is: ${isAddingProduct}`)
  // Clear All any time the dialog is opened
  const clearProductInfo = () => {
    setCurrentProductId(null)
    setCurrentProductName('');
    setCurrentMeasurement('kg');
    setCurrentSellingPrice(0);
    setCurrentInternalPrice(0);
  }
  const clearMessageBar = () => {
    setCongratulationResponse(null)
    setUpdateSuccessMessage(null)
    console.log('Clear the message bar completed')
  }
  const clearImage = () => {
    setProductImage({ file: null, url: null, id: null });
  }
  const clearAll = () => {
    clearProductInfo()
    clearMessageBar()
    clearImage()
    dispatch(resetSelectedProductWithIndex())
  }

  // Use an effect to load data and clear the form
  useEffect(() => {
    if (tag === 'modify') {
      console.log(`Loaded the Dialog with product data: ${JSON.stringify(product)}`)
      setCurrentProductId(product?.product_id)
      setCurrentProductName(product?.product_name);
      setCurrentMeasurement(product?.measurement || 'PCS');
      setCurrentSellingPrice(product?.selling_price);
      setCurrentInternalPrice(product?.internal_price);
      setProductImage({
        file:null,
        url: product?.product_image_url,
        id: product?.product_image_id
      })
      setMessage(null)
      clearMessageBar()
    } else if (tag === 'add') {
      clearAll()
    }
  }, [tag, product, open]);

  // Use an effect to handle post-action cleanup and parent refresh
  useEffect(() => {
    if (congratulationResponse || updateSuccessMessage) {
      console.log(`Update Success Message is: ${updateSuccessMessage}`)
      dispatch(fetchSomeProductsAsync()); // Tell the parent to re-fetch
      clearProductInfo()
      clearImage()
    }
  }, [congratulationResponse, updateSuccessMessage]);

  useEffect(() => {
  const handleWheel = (event) => {
    const minDelta = 20; // Set a minimum delta to avoid accidental triggers
    if (Math.abs(event.deltaX) > minDelta) {
      event.preventDefault(); // Prevent default horizontal scrolling

      if (event.deltaX > 0) {
        // Swipe left (next product)
        // Call your handleNext function here
        // handleNext();
        console.log("Next product");
      } else if (event.deltaX < 0) {
        // Swipe right (previous product)
        // Call your handlePrevious function here
        // handlePrevious();
        console.log("Previous product");
      }
    }
  }

  const dialogElement = dialogContentRef.current;
  if (dialogElement) {
    dialogElement.addEventListener('wheel', handleWheel, { passive: false });
  }

  return () => {
    if (dialogElement) {
      dialogElement.removeEventListener('wheel', handleWheel);
    }
  };
}, [open]); // Add 'open' to the dependency array

  const handleSubmit = async (event) => {
    event.preventDefault();
    let productData;
    if (tag === 'add') {
      let imageData = null
      if (productImage.file) {
        imageData = await uploadImage(productImage.file);
      }
      console.log('Successfully Uploaded imaeg to cloudinary')
      productData = {
      ProductName: currentProductName,
      Measurement: currentMeasurement,
      SellingPrice: parseFloat(currentSellingPrice),
      InternalPrice: parseFloat(currentInternalPrice),
      ProductImageId: imageData?.public_id,
      ProductImageUrl: imageData?.image_url

    };
    try {
      const result = await dispatch(addNewProductAsync(productData)).unwrap();
      setCongratulationResponse('Successfully added a new product');
    }
    catch (err) {
      console.error('Face problem when adding a new product',err)
    }
      
    } else if (tag === 'modify') {

      try {
        // Check if there is a product id
        if (!currentProductId) {
          throw new Error("Cannot access product id")
        }
        let imageData = null
        // Check imageFile exist to upload
        if (productImage.file) {
          console.log('Start update new image')
          imageData = await updateImage({  // Fix: Pass object with named parameters
            productId: currentProductId,
            imageFile: productImage.file
          })
          console.log('Successfully update new image')
    }
        // Call API to update product record
        productData = {
          ProductName: currentProductName,
          Measurement: currentMeasurement,
          SellingPrice: parseFloat(currentSellingPrice),
          InternalPrice: parseFloat(currentInternalPrice),
          ProductImageId: imageData?.public_id,
          ProductImageUrl: imageData?.image_url
        } 
      }
      catch (error) {
        console.log("Error when updating product image: ", error)
      }
      console.log(`Full product data is: ${JSON.stringify(product)}`)
      console.log(`Product id is: ${product.product_id}`)
      console.log(`Product data is: ${JSON.stringify(productData)}`)
      console.log(`Thunk to update product data is: ${updateProductAsync(product.product_id, productData)}`)
      const promise = await dispatch(updateProductAsync({
        productId: product.product_id,
        updatedProductData: productData
      }
      ));
      console.log(`Current status of the promise is: ${JSON.stringify(promise)}`)
      console.log(`Updating error: ${updatingProductError}`)
      console.log(`Updating status: ${isUpdatingProduct}`)
      console.log(`Adding status: ${isAddingProduct}`)

      promise.then(result => {
        console.log(`update error is: ${updatingProductError}`)
        setUpdateSuccessMessage(result.payload|| `Successfully update product ${product.product_id}`)
      })
      setUpdateSuccessMessage('hehehee')
    }
  };

  const handleFileChange = (event) => {
    
    const file = event.target.files[0];
    console.log(`A file is selected: ${JSON.stringify(URL.createObjectURL(file))}`)
    if (file) {
     setProductImage({
            file: file,
            url: URL.createObjectURL(file), // The new "display" URL
            id: null, // No permanent ID yet
        });
    }
    else {
      clearImage()
      }
    };

    const handleImageButtonClick= () => {
      fileInputRef.current.click()
  }

  const handleNavigation = async (direction) => { // 1. Make it async
    if (!products || products.length === 0) return;
    
    // --- Logic for navigating to the NEXT Page ---
    if (direction === 'next') {
        if (selectedIndex === products.length - 1 && currentPage < totalPage) {
            
            let newPage = currentPage + 1;
            
            // 2. Await the dispatch and get the result (which contains the new products)
            const result = await dispatch(fetchSomeProductsAsync({ page: newPage, limit: pageLimit }));

            // Check if the API call was successful and contains the new items
            if (result.meta.requestStatus === 'fulfilled' && result.payload?.items) {
                const newProducts = result.payload.items;
                // 3. Select the first product of the newly loaded page
                const targetIndex = 0;
                const newProduct = newProducts[targetIndex];
                
                // 4. Update the selected product state based on the new data
                dispatch(setSelectedProductWithIndex({ product: newProduct, index: targetIndex }));
            }
            return; // Exit after page fetch
        } 
        // Logic for navigating on Current Page
        else if (selectedIndex < products.length - 1) {
            const newIndex = selectedIndex + 1;
            const newProduct = products[newIndex];
            dispatch(setSelectedProductWithIndex({ product: newProduct, index: newIndex }));
        }
    } 
    
    // --- Logic for navigating to the PREVIOUS Page ---
    else if (direction === 'previous') {
        if (selectedIndex === 0 && currentPage > 1) {
            
            let newPage = currentPage - 1;

            // 2. Await the dispatch and get the result (which contains the new products)
            const result = await dispatch(fetchSomeProductsAsync({ page: newPage, limit: pageLimit }));
            
            // Check if the API call was successful and contains the new items
            if (result.meta.requestStatus === 'fulfilled' && result.payload?.items) {
                const newProducts = result.payload.items;
                // 3. Select the last product of the newly loaded page
                const targetIndex = newProducts.length - 1;                
                // 4. Update the selected product state based on the new data
                dispatch(setSelectedProductWithIndex({ index: targetIndex }));
            }
            return; // Exit after page fetch
        }
        // Logic for navigating on Current Page
        else if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1;
            dispatch(setSelectedProductWithIndex({ index: newIndex }));
        }
    }
};
  
  // Render status messages for both actions
  const renderStatus = () => {
    console.log(`Start new message bar rendering with: congratulation: ${JSON.stringify(congratulationResponse)}`)
    if (isAddingProduct|| isUpdatingProduct) {
      console.log('rendering loading')
      console.log(`Updating status: ${isUpdatingProduct}`)
      console.log(`Adding status: ${isAddingProduct}`)
      console.log(`Updating error: ${updatingProductError}`)
      return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} /><Typography sx={{ ml: 2 }}>Processing...</Typography>
      </Box>;
    }
    if (addingProductError || updatingProductError) {
      const errorMsg = addingProductError || updatingProductError;
      return <Alert severity="error" sx={{ mt: 2 }}>{JSON.stringify(errorMsg)}</Alert>;
    }
    if (congratulationResponse || updateSuccessMessage) {
    let successMsg = congratulationResponse || updateSuccessMessage;
    // Check if successMsg is not a string, and if so, set it to 'Success'
    if (typeof successMsg !== 'string') {
      console.log(`Type of successMsg is not string, we use a simple word instead ${JSON.stringify(successMsg)}`)
      successMsg = 'Success';
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
        <Typography variant="body1" color="success.main">
          {successMsg}
        </Typography>
      </Box>
    );
  }
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '100%',
            gap: 1  // Add spacing between items
          }}
        >
          <Box sx={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={() => handleNavigation('previous')}
              disabled={selectedIndex === 0 && currentPage ===1}
            >
              <NavigateBeforeIcon />
            </IconButton>
          </Box>

          <Typography 
            variant="h6" 
            sx={{
              width: '65%',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {tag === 'add' ? 'Add New Product' : `Modify ${product?.product_name}`}
          </Typography>

          <Box sx={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={() => handleNavigation('next')}
              disabled={selectedIndex === products.length - 1 && currentPage === totalPage}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>

          <Box sx={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
            <IconButton 
              onClick={onClose} 
              sx={{ 
                bgcolor: (theme) => theme.palette.primary.main, 
                color: 'white', 
                borderRadius: '8px', 
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.primary.dark 
                } 
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent ref ={dialogContentRef}>
      <Box component="form" sx = {{
        display:'flex', 
        gap:2,
        flexDirection: "column"}}>
        <Box sx ={{
          display: 'flex',
          flexDirection: "row"
        }}>
          {/* Left Column for form fields (60% width) */}
          <Box sx ={{flex: '0 0 45%'}}>
          <TextField label="Product Name" fullWidth margin="normal" value={currentProductName} onChange={(e) => setCurrentProductName(e.target.value)} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Measurement Unit</InputLabel>
            <Select value={currentMeasurement} label="Measurement Unit" onChange={(e) => setCurrentMeasurement(e.target.value)}>
              <MenuItem value="KG">kg</MenuItem>
              <MenuItem value="L">L</MenuItem>
              <MenuItem value="PCS">pcs</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Selling Price" fullWidth margin="normal" type="number" value={currentSellingPrice} onChange={(e) => setCurrentSellingPrice(e.target.value)} />
          <TextField label="Internal Price" fullWidth margin="normal" type="number" value={currentInternalPrice} onChange={(e) => setCurrentInternalPrice(e.target.value)} />
        </Box>
            {/* Right Column for the image field (40% width) */}
            <input
            type="file"
            ref = {fileInputRef}
            onChange={handleFileChange}
            style={{display:'none'}}
            />
          <Box sx ={{flex: '0 0 55%',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     padding: '15px',
                     gap: '12px'
          }}>
            {productImage.url ? (
              <Box
                component="img"
                sx={{
                  width: '100%',
                  height: '85%',
                  objectFit: 'contain',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
                src={productImage.url}
                alt="Product"
              />
            ) :  
            (
              <Box
                sx={{
                  width: '100%',
                  height: '85%',
                  bgcolor: '#f5f5f5',
                  border: '1px dashed #ccc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontStyle: 'italic',
                }}
              >
                No Image
              </Box>
            )}
            <Button
              variant="outlined"
              startIcon={<AddPhotoAlternateIcon />}
              onClick={handleImageButtonClick}
              sx = {{
                width: '100%'
              }}
            >
              {productImage.url ? "Modify Image" : "Add Image"}
            </Button>
          </Box>
        </Box>
          {renderStatus()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isAddingProduct || isUpdatingProduct}>
          {tag === 'add' ? 'Save' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductActionDialog;