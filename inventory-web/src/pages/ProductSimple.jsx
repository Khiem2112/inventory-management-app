// src/ProductDisplaySimple.jsx
import React from 'react';
import products from '/public/products.js'; // <-- Import our hardcoded JS products array

// Import Material-UI components for styling. If not installed, use basic HTML tags.
import { Box, Typography, Paper, Grid } from '@mui/material';

function ProductDisplaySimple() {
  // (1) We don't need useState for products here, because the data is *immediately* available
  //     and doesn't change after the component renders.

  console.log("ProductDisplaySimple rendered. Data available immediately:", products);

  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4">Our Simple Products List (Synchronous)</Typography>
      {products.length === 0 ? (
        <Typography>No products found in the JS file.</Typography>
      ) : (
        <Grid container spacing = {2} direction='column'>
            {products.map(
                (product)=>
                {   return (
                    <Grid item sm ={12} key = {product.id}>
                        <Paper align ='left'>
                            <Typography variant = 'h5'sx={{mt: 4}} align ='center'>
                                {product.name} </Typography>
                            <Typography variant='body1'> {product.price}</Typography>
                            <Typography variant ='body2'>{product.description}</Typography>
                            <Typography variant ='body2'>  Click here</Typography>
                        </Paper>
                    </Grid>
            )  
                }
            )}
        </Grid>
      )}
    </Box>
  );
}

export default ProductDisplaySimple;