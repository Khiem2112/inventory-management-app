// src/components/AddProductDialog.jsx

import {
  Dialog,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  DialogTitle,
  DialogActions,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box // 💡 Import Box for the form wrapper
} from "@mui/material";
import { useEffect, useState } from "react";
import useAddNewProduct from "../hooks/Product/useAddNewProduct"
import CloseIcon from '@mui/icons-material/Close'
// The component now receives open and onClose as props
const AddProductDialog = ({ open, onClose }) => {
  // Local states and variables
  const [currentMeasurement, setCurrentMeasurement] = useState("kg") // Initial state should be an empty string
  const [currentProductName, setCurrentProductName] = useState('')
  const [currentSellingPrice, setCurrentSellingPrice] = useState(0)
  const [currentInternalPrice, setCurrentInternalPrice] = useState(0)
  // hooks
  const {isAddingProduct, addingProductError, congratulationResponse, addNewProduct} = useAddNewProduct()
  // functions
  const handleSubmit = (event) =>{
    console.log('Submit is clicked')
    console.log(`Loading status is: ${isAddingProduct}`)
    console.log('Begin with creaate productsData')
    event.preventDefault()
    const productsData = {
      ProductName : currentProductName,
      Measurement : currentMeasurement,
      SellingPrice : parseFloat(currentSellingPrice),
      InternalPrice : parseFloat(currentInternalPrice)
    };
    console.log('create product Data ok')
    addNewProduct(productsData)
  }
  // Handle Form reset after success
  useEffect (() => {
    if (congratulationResponse) {
      setCurrentProductName('')
      setCurrentMeasurement('kg')
      setCurrentInternalPrice(0)
      setCurrentSellingPrice(0)
    }
  }, [congratulationResponse, onClose])
  // Render status messages (loading, error, success)
  const renderStatus = () => {
    if (isAddingProduct) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Adding product...</Typography>
        </Box>
      );
    }
    if (addingProductError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>{addingProductError}</Alert>
      );
    }
    if (congratulationResponse) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          Product added successfully! ID: {congratulationResponse.ProductId}
        </Alert>
      );
    }
    return null;
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Add new product
        </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            variant ='contained'
            sx={{
              bgcolor: (theme) => theme.palette.primary.main,
              color: 'white',
              // Added border radius for a nearly rectangular shape
              borderRadius: '8px',
              '&:hover': {
                bgcolor: (theme) => theme.palette.primary.dark,
              },
            }}
          >
    <CloseIcon />
  </IconButton>
      </Box>
    </DialogTitle>
      <DialogContent>
        {/* 💡 Use a <Box> component with component="form" as a semantic form wrapper */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Product Name" fullWidth margin="normal" 
          value = {currentProductName}
          onChange = {(event) => {setCurrentProductName(event.target.value)}} />
          {/* Use FormControl and InputLabel to properly label the Select */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="select-measurement-unit-label">Measurement Unit</InputLabel>
            <Select
              labelId="select-measurement-unit-label"
              id="select-measurement"
              value={currentMeasurement}
              label="Measurement Unit"
              onChange={(event) => setCurrentMeasurement(event.target.value)}
            >
              <MenuItem value="kg">kg</MenuItem>
              <MenuItem value="L">L</MenuItem>
              <MenuItem value="pcs">pcs</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Selling Price" fullWidth margin="normal"
          value = {currentSellingPrice}
          onChange={(event) => setCurrentSellingPrice(event.target.value)} />
          <TextField label="Internal Price" fullWidth margin="normal"
          value={currentInternalPrice}
          onChange={ (event) => setCurrentInternalPrice(event.target.value)} />
        {renderStatus()}
        <Button variant="contained" 
                type = "submit"
                disabled ={isAddingProduct}
                sx={{ mt: 2 }}
                >Save</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        {/* The onClose prop handles the close event */}
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductDialog;