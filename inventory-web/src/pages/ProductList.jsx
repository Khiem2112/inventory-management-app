// src/pages/ProductsList.jsx

import React from 'react';
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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddProductDialog from '../components/AddProductDiaLog';
import useFetchProducts from '../hooks/Product/useFetchProducts';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

function ProductsList() {
  const { productItems, isFetchingProducts, fetchProductsError, FetchProducts} = useFetchProducts()
  const { userData } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleAddedProduct =() => {
    console.log('Trigger handle add product|refresh table')
    FetchProducts()
  }
  // Function to close the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Alert 
          severity="error" // Changes the alert's color and icon to match an error state
        >
          <Typography variant="h6">Failed to load products:</Typography>
          <Typography>{fetchProductsError}</Typography>
        </Alert>
      </Box>
    );
  }
  // --- End of Conditional Rendering ---


  return (
    <Box
      sx={{ 
        p: 3 // Adds a padding of 3 units on all sides
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between', // Pushes children to opposite ends of the container
          alignItems: 'center',
          mb: 3 // Adds a bottom margin of 3 units
        }}
      >
        <Typography 
          variant="h4" // Sets the font style to a heading 4 (h4)
          component="h1" // Renders the HTML element as an h1 for accessibility and SEO
        >
          Inventory Products
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 // Adds space of 2 units between children elements
          }}
        >
          <TextField
            variant="outlined" // Adds a border around the input field
            size="small" // Sets the height and padding to a smaller size
            placeholder="Search products..." // Text that appears when the input field is empty
            sx={{ width: 250 }} // Sets a fixed width
          />
          <Button
            variant="contained" // Fills the button with the theme's primary color
            startIcon={<AddCircleOutlineIcon />} // Displays an icon to the left of the button text
            onClick = {handleOpenDialog} // A function that is executed when the button is clicked
          >
            New Product
          </Button>
        </Box>
      </Box>

          {/* The Add Product Dialog */}
      <AddProductDialog open = {isDialogOpen} onClose={handleCloseDialog} onProductAdded={handleAddedProduct}/>

      <Paper 
        elevation={3} // Adds a shadow effect to the component, with a value of 3 (higher is more prominent)
        sx={{ 
          borderRadius: '12px', // Rounds the corners of the component
          overflow: 'hidden' // Hides any child content that goes outside the boundary of the component
        }}
      >
        <TableContainer> {/* A wrapper component that enables a horizontal scrollbar for large tables */}
          <Table>
            <TableHead> {/* Defines the header section of the table */}
              <TableRow 
                sx={{ 
                  bgcolor: '#42a5f5' // Sets the background color of the row using a specific hex code
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
                    key={product.ProductId} // 'key' is a unique identifier for each row, required by React for performance
                  >
                    <TableCell>{product.ProductName}</TableCell>
                    <TableCell>{product.Measurement}</TableCell>
                    <TableCell>${product.SellingPrice}</TableCell>
                    <TableCell>${product.InternalPrice}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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