// src/pages/ProductsList.jsx
import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  Button,
  TextField,
  IconButton,
  requirePropFactory,
  Stack,
  useTheme,
  Pagination
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProductActionDialog from '../components/ProductActionDialog';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect   } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProductsAsync,
         setSelectedProduct,
         assignSelectedProduct,
         fetchSomeProductsAsync} from '../myRedux/slices/ProductsSlice';
import API_CONFIG from '../config';

function ProductsList() {
  const dispatch = useDispatch();
  const productItems = useSelector(state => state.products.items);
  console.log(`Products data loading in ProductsList: ${JSON.stringify(productItems)}`)
  const isFetchingProducts = useSelector(state => state.products.status.getAll === 'pending');
  const fetchProductsError = useSelector(state => state.products.error.getAll)
  const Error = useSelector(state => state.products.error.getAll);
  const { userData } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState(false)
  const selectedProduct = useSelector((state)=> state.products.selectedProduct)
  const currentProductsState = useSelector((state)=> state.products) // Just or seeing or products store object
  // Pagination
  const pageCount = useSelector(state => state.products.pagination.totalPage)
  const currentPage = useSelector (state => state.products.pagination.currentPage)
  console.log(`Current page is ${currentPage}`)
  const limit = useSelector(state => state.products.pagination.limit)
  const wsStatus = useSelector(state => state.products.wsStatus)
  const WS_URL = `${API_CONFIG.getEffectiveBaseUrl()}`
  // The useWebSocket hook provides everything you need

    // Display connection status
    const statusStyles = {
        'uninstantiated': { text: 'Initializing...', color: 'text.secondary' },
        'connecting': { text: 'Connecting...', color: 'warning.main' },
        'open': { text: 'Connected and listening for updates.', color: 'success.main' },
        'closed': { text: 'Connection failed. Reconnecting...', color: 'error.main' },
    };
    console.log(`Current status is: ${wsStatus}`)
    const currentStatus = statusStyles[wsStatus]

  // console.log(`Full products object stored is: ${JSON.stringify(currentProductsState, null, 2)}`) // Just or seeing or products store object
  const handleOpenAddDialog = () => {
    setIsDialogOpen(true);
    setDialogType('add')
  };
  // fetch data using a Redux thunk on mount
  useEffect(() => {
    dispatch(fetchSomeProductsAsync());
    }, [dispatch]);

  // Function to handle actions with product: add or modify
  const handleChangeProductData = useCallback(() => {
    console.log('Trigger handle add product | refresh table')
    dispatch(fetchSomeProductsAsync())
  },[])
  const handleDeleteProduct = () => {
    
  }
  const handleModifyProduct = (ProductData) => {
    /**
     * @param {ProductData}:
      * ProductName
      * Measurement
      * SellingPrice
      * InternalPrice
     */
    console.log(`Is opening modify product table ${ProductData?.ProductName}`)
    dispatch(assignSelectedProduct(ProductData))
    console.log(`Selected product is: ${JSON.stringify(selectedProduct)}`)
    setIsDialogOpen(true)
    setDialogType('modify')
  }
  const handlePageChange = (event, value) => {
    const params = {
      page : value,
      limit: limit
    }
    dispatch(fetchSomeProductsAsync(params))
  }
  // Function to close the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const theme = useTheme()
  // --- Conditional Rendering for Loading and Errors ---
  if (isFetchingProducts) {
    return (
      <Box 
        // The 'sx' prop is a shortcut for defining custom CSS styles.
        sx={{ 
          display: 'flex', // Uses flexbox for layout
          justifyContent: 'center', // Centers children horizontally
          alignItems: 'center', // Centers children vertically
          height: '80vh' // Sets height to 80% of the viewport
        }}
      >
        <CircularProgress /> {/* Renders a circular loading spinner */}
        <Typography 
          variant="h6" // Sets the text style to a heading 6 (h6) font
          sx={{ ml: 2 }} // Adds a left margin of 2 units (default unit is 8px)
        >
          Loading products...
        </Typography>
      </Box>
    );
  }

  if (fetchProductsError) {
    console.log(`fetch Products Error is ${fetchProductsError}`)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Alert 
          severity="error" // Changes the alert's color and icon to match an error state
        >
          <Typography variant="h6">Failed to load products:</Typography>
          <Typography>{String(fetchProductsError)} </Typography>
        </Alert>
      </Box>
    );
  }
  // --- End of Conditional Rendering ---
  return (
    <Box>
      <Stack 
      direction="row" 
      justifyContent="space-between" 
      alignItems="center" sx={{ mb: 4 }}
      gap='10px'
      >
        <Typography variant="h4" fontWeight="700" color="text.primary">
          Inventory Products
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search products..."
            sx={{ width: 280, bgcolor: 'background.paper' }}
          />
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => { setDialogType('add'); setIsDialogOpen(true); }}
          >
            New Product
          </Button>
        </Stack>
      </Stack>

          {/* The Add Product Dialog */}
      {dialogType === 'add' ? 
      <ProductActionDialog
      open = {isDialogOpen} 
      onClose={handleCloseDialog}
      tag = 'add' /> : 
      dialogType === 'modify' ?
      <ProductActionDialog
      open = {isDialogOpen} 
      onClose={handleCloseDialog}
      tag = 'modify' /> : null}

      <Paper 
        elevation={3} // Adds a shadow effect to the component, with a value of 3 (higher is more prominent)
        sx={{ 
          border: `1px solid ${theme.palette.divider}`, 
          borderRadius: 2, 
          overflow: 'hidden' }}
      >
        <TableContainer> {/* A wrapper component that enables a horizontal scrollbar for large tables */}
          <Table
          sx={{
            overflow: 'hidden'
          }}
          >
            <TableHead> {/* Defines the header section of the table */}
              <TableRow 
                sx={{ 
                  bgcolor: 'primary.main'// Sets the background color of the row using a specific hex code
                }}
              >
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', // Makes the font bold
                    color: 'white' // Sets the text color to white
                  }}
                >
                  Product Name
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Measurement</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Selling Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Internal Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Edit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Delete</TableCell>

              </TableRow>
            </TableHead>
            <TableBody> {/* Defines the main body section of the table */}
              {productItems?.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={4} // Makes the cell span across 4 columns to match the number of headers
                    align="center" // Aligns the text content in the cell to the center
                  >
                    <Typography sx={{ py: 3 }}>No products found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                productItems?.map((product) => ( // The 'map' function iterates over each item in the 'productItems' array
                  <TableRow 
                    key={product.product_id} // 'key' is a unique identifier for each row, required by React for performance
                  >
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.measurement}</TableCell>
                    <TableCell>${product.selling_price}</TableCell>
                    <TableCell>${product.internal_price}</TableCell>
                    <TableCell>
                      <IconButton aria-label ='modify' onClick={() => {handleModifyProduct(product)}}>
                        <EditIcon/>
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton aria-label ='delete'>
                        <DeleteIcon/>
                      </IconButton>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination count = {pageCount}
                  page = {currentPage}
                  onChange = {handlePageChange}
                  color = 'primary'
      />
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default ProductsList;

// -----------------------------------------------------------
// 📁 Component Structure of ProductsList.jsx
// -----------------------------------------------------------
// <ProductsList> (The main page component)
//   ├── <Box> (Main container, for padding)
//   │   ├── <Box> (Header container, for aligning title and buttons)
//   │   │   ├── <Typography> (Page title)
//   │   │   ├── <Box> (Right-side container, for search and button)
//   │   │   │   ├── <TextField> (Search input)
//   │   │   │   └── <Button> (New Product button)
//   │   │
//   │   └── <Paper> (Container with a shadow, for the table)
//   │       └── <TableContainer> (Wrapper for scrolling)
//   │           └── <Table>
//   │               ├── <TableHead> (Table header section)
//   │               │   └── <TableRow>
//   │               │       └── <TableCell> (Header cells, e.g., "Product Name")
//   │               │
//   │               └── <TableBody> (Table body section)
//   │                   └── <TableRow> (One for each product)
//   │                       └── <TableCell> (Data cells, e.g., product name)
// -----------------------------------------------------------