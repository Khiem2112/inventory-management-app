import {
  Dialog, TextField, Button, Typography, CircularProgress, Alert,
  DialogTitle, DialogActions, DialogContent, Select, MenuItem,
  FormControl, InputLabel, IconButton, Box
} from "@mui/material";
import { useEffect, useState } from "react";
import useAddNewProduct from "../hooks/Product/useAddNewProduct";
import useUpdateProduct from "../hooks/Product/useUpdateProduct";
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const ProductActionDialog = ({ open, onClose, tag, product, onProductChanged }) => {
  // Local states for the form
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentMeasurement, setCurrentMeasurement] = useState('kg');
  const [currentSellingPrice, setCurrentSellingPrice] = useState(0);
  const [currentInternalPrice, setCurrentInternalPrice] = useState(0);

  // Use hooks for the two actions
  const { isAddingProduct, addingProductError, congratulationResponse, addNewProduct } = useAddNewProduct();
  const { isUpdatingProduct, updatingProductError, updateSuccessMessage, UpdateProduct } = useUpdateProduct();
  // Function to clear all data fields
  const clearAll = () => {
    setCurrentProductName('');
    setCurrentMeasurement('kg');
    setCurrentSellingPrice(0);
    setCurrentInternalPrice(0);
  }
  // Use an effect to load data and clear the form
  useEffect(() => {
    if (tag === 'modify' && product) {
      setCurrentProductName(product.ProductName);
      setCurrentMeasurement(product.Measurement);
      setCurrentSellingPrice(product.SellingPrice);
      setCurrentInternalPrice(product.InternalPrice);
    } else if (tag === 'add') {
      clearAll()
    }
  }, [tag, product]);

  // Use an effect to handle post-action cleanup and parent refresh
  useEffect(() => {
    if (congratulationResponse || updateSuccessMessage) {
      onProductChanged(); // Tell the parent to re-fetch
      clearAll()
    }
  }, [congratulationResponse, updateSuccessMessage, onProductChanged]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const productData = {
      ProductName: currentProductName,
      Measurement: currentMeasurement,
      SellingPrice: parseFloat(currentSellingPrice),
      InternalPrice: parseFloat(currentInternalPrice)
    };
    if (tag === 'add') {
      addNewProduct(productData);
    } else if (tag === 'modify') {
      UpdateProduct(product.ProductId, productData);
    }
  };
  
  // Render status messages for both actions
  const renderStatus = () => {
    if (isAddingProduct || isUpdatingProduct) {
      return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} /><Typography sx={{ ml: 2 }}>Processing...</Typography>
      </Box>;
    }
    if (addingProductError || updatingProductError) {
      const errorMsg = addingProductError || updatingProductError;
      return <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>;
    }
    if (congratulationResponse || updateSuccessMessage) {
    let successMsg = congratulationResponse || updateSuccessMessage;
    // Check if successMsg is not a string, and if so, set it to 'Success'
    if (typeof successMsg !== 'string') {
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
        <Box component="form">
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