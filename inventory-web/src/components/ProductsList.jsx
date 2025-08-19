// src/ProductFetch.jsx
import React, { useEffect } from 'react';
import { useState } from 'react';

// Import Material-UI components for styling. If not installed, use basic HTML tags.
import { Box, Typography, Paper, Grid, CircularProgress, TextField, Alert } from '@mui/material';

function ProductsList({productsAPI}) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const controller = new AbortController
        const signal = controller.signal
        const fetchProductsAPI = async (productsAPI) => {
            // Set the data for initial load, this part is synchrounous
            setLoading(true)
            setError(null)
            setProducts([])
            try {
                console.log('Start: Data is now fetching')
                const response = await fetch(productsAPI, {signal})
                if (!response.ok) {
                    throw new Error (`API call doesn't succeed due to ${response.status}`)
                }
                
                const productsData = await response.json()
                
                console.log('Data is fetched successfully')
                setProducts(productsData)
            }
            catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message)
                }
                console.error(`Error ${err} happen`)
            }
            finally {
                setLoading(false)
                console.log('The operation run successfully')
            }	
        }
        fetchProductsAPI(productsAPI)
        return () => {
                controller.abort()
            }
    }, [productsAPI])
    
    if (loading) {
        return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress /> {/* Shows a loading spinner */}
        <Typography sx={{ ml: 2 }}>Loading products (Phase 1)...</Typography>
      </Box>
    );	
    }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Error: {error}
      </Alert>
    );
  }  
  // Return the main components
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

export default ProductsList;