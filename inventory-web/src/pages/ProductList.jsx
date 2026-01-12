// src/pages/ProductsList.jsx
import React, { useState, useEffect } from 'react';
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
  Stack,
  useTheme,
  TablePagination,
  InputAdornment
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

// Components & Redux
import ProductActionDialog from '../components/ProductActionDialog';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSomeProductsAsync,
  assignSelectedProduct 
} from '../myRedux/slices/ProductsSlice';

// CONSTANTS
const ROW_HEIGHT = 70; // Centralize this value for consistency

function ProductsList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  // --- Redux State ---
  const productItems = useSelector(state => state.products.items);
  const isFetchingProducts = useSelector(state => state.products.status.getAll === 'pending');
  const fetchProductsError = useSelector(state => state.products.error.getAll);
  
  // Pagination State
  const totalCount = useSelector(state => state.products.pagination.totalCount) || 0;
  const currentPage = useSelector(state => state.products.pagination.currentPage);
  const limit = useSelector(state => state.products.pagination.limit);

  console.log(`Check pagination current page: `, currentPage)
  console.log(`Check pagination totalcount: `, totalCount)
  console.log(`Check pagination limit: `, limit)
  // Local State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);

  // --- Initial Fetch ---
  useEffect(() => {
    dispatch(fetchSomeProductsAsync({ page: 1, limit: limit }));
  }, [dispatch, limit]);

  // --- Handlers ---
  const handleOpenAddDialog = () => {
    setDialogType('add');
    setIsDialogOpen(true);
  };

  const handleModifyProduct = (productData) => {
    dispatch(assignSelectedProduct(productData));
    setDialogType('modify');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setDialogType(null);
  };

  const handleChangePage = (event, newPage) => {
    dispatch(fetchSomeProductsAsync({ page: newPage + 1, limit: limit }));
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    dispatch(fetchSomeProductsAsync({ page: 1, limit: newLimit }));
  };

  // --- Empty Rows Calculation ---
  const emptyRows = limit - (productItems?.length || 0);

  // --- Loading / Error States ---
  if (isFetchingProducts && !productItems?.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Loading products...</Typography>
      </Box>
    );
  }

  if (fetchProductsError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Failed to load products</Typography>
          <Typography>{String(fetchProductsError)}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
    }}>
      
      {/* HEADER */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Inventory Products
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search..."
            size="small"
            sx={{ width: 280, bgcolor: 'background.paper' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenAddDialog}
          >
            New Product
          </Button>
        </Stack>
      </Stack>

      {/* CONTENT SURFACE */}
      <Paper 
        elevation={2}
        sx={{ 
          flexGrow: 1, 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto', 
          bgcolor: 'background.paper',
          }}
      >
        <TableContainer sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          scrollbarWidth: 'none', 
    
          // Hide Scrollbar for Chrome, Safari, Edge
          '&::-webkit-scrollbar': {
            display: 'none',
          }
 }}>
          <Table 
            stickyHeader 
            size="medium" // 'medium' usually adds more padding than 'small'
            sx={{
              tableLayout: 'fixed', // Strict column sizing
              minWidth: 650,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', width: '25%' }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', textAlign: 'center', width: '15%' }}>Measurement</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', textAlign: 'right', width: '20%' }}>Selling Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', textAlign: 'right', width: '20%' }}>Internal Price</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 100, bgcolor: 'primary.main', color: 'white', width: '20%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productItems?.length === 0 ? (
                <TableRow sx={{ height: ROW_HEIGHT }}>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No products found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                productItems?.map((product) => (
                  <TableRow 
                    key={product.product_id} 
                    hover
                    sx={{ 
                      height: ROW_HEIGHT, // Force Height
                      '& td': { 
                         whiteSpace: 'nowrap', // Prevent wrapping
                         overflow: 'hidden', 
                         textOverflow: 'ellipsis' 
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                        {product.product_name}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                        {product.measurement}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                        ${product.selling_price}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                        ${product.internal_price}
                    </TableCell>
                    <TableCell align="center">
                       <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleModifyProduct(product)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {/* Handle Delete */}}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                       </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              {/* EMPTY ROW FILLER - Updated Math */}
              {emptyRows > 0 && (
                <TableRow sx={{ 
                    height: ROW_HEIGHT * emptyRows, // Multiply to fill space
                    border: 'none'
                }}>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* FOOTER */}
        <TablePagination
          component="div"
          count={totalCount || 0} 
          page={(currentPage - 1) || 0} 
          onPageChange={handleChangePage}
          rowsPerPage={limit || 10}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
            '& .MuiTablePagination-displayedRows': {
            // 1. Force all numbers to be equal width (like code font)
            fontVariantNumeric: 'tabular-nums', 
            
            // 2. Reserve specific space so it doesn't shrink/grow
            minWidth: '100px', 
            textAlign: 'right' 
        }
           }}
        />
      </Paper>

      {/* DIALOG */}
      {isDialogOpen && (
         <ProductActionDialog
           open={isDialogOpen} 
           onClose={handleCloseDialog}
           tag={dialogType} 
         />
      )}
    </Box>
  );
}

export default ProductsList;