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
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

import { addNewProductAsync, updateProductAsync, fetchAllProductsAsync, fetchSomeProductsAsync } from "../myRedux/slices/ProductsSlice";
import { useDispatch, useSelector } from "react-redux";
import useImagePreview from "../hooks/Product/useImagePreview";
import useAddImageToCloudinary from "../hooks/Product/useAddProductImageToCloud"
import axios from "axios";
import api from "../services/api";
const ProductActionDialog = ({ open, onClose, tag}) => {
  // Local states for the form
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentMeasurement, setCurrentMeasurement] = useState('kg');
  const [currentSellingPrice, setCurrentSellingPrice] = useState(0);
  const [currentInternalPrice, setCurrentInternalPrice] = useState(0);

  // Use hooks for the two actions
    // Hooks for Add one new product
  const dispatch = useDispatch()
  const product = useSelector((state)=> state.products.selectedProduct)
  const addingProductError = useSelector((state)=> state.products.error.addOne)
  const updatingProductError = useSelector((state)=> state.products.error.updateOne)
  const isAddingProduct = useSelector((state)=> state.products.status.addOne === 'pending')
  const isUpdatingProduct = useSelector((state)=> state.products.status.updateOne === 'pending')

  //For uploading image to cloudinary
  const {
    mutateAsync : uploadImage,
    isPending: isUploadingImage,
    isSuccess: isUploadingSuccess,
    error: uploadError
  } = useAddImageToCloudinary()
  // The Above code is for testing

  const [congratulationResponse, setCongratulationResponse] = useState(null);
  const [updateSuccessMessage, setUpdateSuccessMessage ] = useState(null);
  const [message, setMessage] = useState(null)
  // For image preview
  const [productImageFile, setProductImageFile] = useState(null)
  const imagePreviewUrl = useImagePreview(productImageFile)
  const fileInputRef = useRef(null); // <-- Create a ref for the hidden input

  // Function to clear all data fields
  console.log(`Product adding status is: ${isAddingProduct}`)
  // Clear All any time the dialog is opened
  const clearProductInfo = () => {
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
    setProductImageFile(null)
  }
  const clearAll = () => {
    clearProductInfo()
    clearMessageBar()
    clearImage()
  }
  // Use an effect to load data and clear the form
  useEffect(() => {
    if (tag === 'modify') {
      console.log(`Loaded the Dialog with product data: ${JSON.stringify(product)}`)
      setCurrentProductName(product?.ProductName);
      setCurrentMeasurement(product?.Measurement);
      setCurrentSellingPrice(product?.SellingPrice);
      setCurrentInternalPrice(product?.InternalPrice);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (tag === 'add') {
      let productImageId = null
      if (productImageFile) {
        productImageId = await uploadImage(productImageFile);
      }
      console.log('Successfully Uploaded imaeg to cloudinary')
      const productData = {
      ProductName: currentProductName,
      Measurement: currentMeasurement,
      SellingPrice: parseFloat(currentSellingPrice),
      InternalPrice: parseFloat(currentInternalPrice),
      ProductImageId: productImageId
    };
      const result = await dispatch(addNewProductAsync(productData)).unwrap();
      setCongratulationResponse(result.message || 'Successfully added a new product');
      
      // Set the dispatch result to the success message
      setCongratulationResponse(response)

    } else if (tag === 'modify') {
      console.log(`Full product data is: ${JSON.stringify(product)}`)
      console.log(`Product id is: ${product.ProductId}`)
      console.log(`Product data is: ${JSON.stringify(productData)}`)
      console.log(`Thunk to update product data is: ${updateProductAsync(product.ProductId, productData)}`)
      const promise = dispatch(updateProductAsync({
        productId: product.ProductId,
        updatedProductData: productData
      }
      ));
      console.log(`Current status of the promise is: ${JSON.stringify(promise)}`)
      console.log(`Updating error: ${updatingProductError}`)
      console.log(`Updating status: ${isUpdatingProduct}`)
      console.log(`Adding status: ${isAddingProduct}`)

      promise.then(result => {
        console.log(`update error is: ${updatingProductError}`)
        setUpdateSuccessMessage(result.payload|| `Successfully update product ${product.ProductId}`)
      })
      setUpdateSuccessMessage('hehehee')
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log(`A file is selected: ${JSON.stringify(URL.createObjectURL(file))}`)
    if (file) {
     setProductImageFile(file)
    }
    else {
      clearImage()
      }
    };
  const handleImageButtonClick= () => {
    fileInputRef.current.click()
  }
  
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {tag === 'add' ? 'Add New Product' : `Modify ${product?.ProductName}`}
          </Typography>
          <IconButton onClick={onClose} sx={{ bgcolor: (theme) => theme.palette.primary.main, color: 'white', borderRadius: '8px', '&:hover': { bgcolor: (theme) => theme.palette.primary.dark } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
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
              <MenuItem value="kg">kg</MenuItem>
              <MenuItem value="L">L</MenuItem>
              <MenuItem value="pcs">pcs</MenuItem>
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
            {imagePreviewUrl ? (
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
                src={imagePreviewUrl}
                alt="Product"
              />
            ) : (
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
              Add Image
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