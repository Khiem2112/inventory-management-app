// src/ProductDisplayPromise.jsx
import React, { useState } from 'react'; // <-- We need useState now!

// Import Material-UI components for styling.
import { Box, Typography, CircularProgress, Alert, Paper, Grid } from '@mui/material';

function ProductDisplayPromise() {
  // (1) State variables to manage products, loading, and errors dynamically
  const [products, setProducts] = useState([]);      // Initially empty array
  const [loading, setLoading] = useState(false);     // Initially not loading
  const [error, setError] = useState(null);        // Initially no error

  // (2) This function will perform the actual data fetching using Promises
  const loadProducts = () => {
    setLoading(true); // Start loading when fetch begins
    setError(null);   // Clear previous errors
    setProducts([]);  // Clear previous products

    // (3) Use fetch() to request the JSON file. fetch() returns a Promise.
    console.log("Phase 2: Starting fetch with Promises...");
    fetch('../../public/products.js') // This Promise represents the network request
      .then(response => {
        // (4) FIRST .then() callback: Runs when the network request completes.
        // 'response' is an HTTP Response object. We check if it was successful.
        if (!response.ok) {
          // If not OK, we create an Error object and throw it.
          // This immediately skips to the .catch() block.
          throw new Error(`HTTP error! Status: ${response.status} from /data/products.json`);
        }
        // (5) Return response.json(). This *also* returns a Promise!
        // This Promise represents the asynchronous parsing of the JSON data.
        return response.json();
      })
      .then(data => {
        // (6) SECOND .then() callback: Runs when response.json() Promise resolves.
        // 'data' is the actual parsed JavaScript object (our array of products).
        console.log("Phase 2: Data fetched successfully:", data);
        setProducts(data); // Update the products state
      })
      .catch(err => {
        // (7) .catch() callback: Runs if ANY Promise in the chain above (fetch or response.json) rejects.
        // 'err' will be the Error object we threw or a network error.
        console.error("Phase 2: Error fetching data:", err);
        setError(err.message || 'An unknown error occurred.'); // Update the error state
      })
      .finally(() => {
        // (8) .finally() callback: Always runs after the Promise settles (either resolves or rejects).
        // This is perfect for hiding loaders or doing other cleanup.
        setLoading(false); // Stop loading indicator
        console.log("Phase 2: Fetch operation completed.");
      });
  };

  // (9) Call loadProducts() directly.
  // !!! WARNING: In a real React app, calling this here without useEffect
  //     will cause an infinite loop if `setProducts`, `setLoading`, or `setError`
  //     cause a re-render. We'll fix this in Phase 3.
  //     But for learning Promises, this shows the direct invocation.
  if (products.length === 0 && !loading && !error) { // Simple guard to prevent immediate re-fetch
      loadProducts();
  }


  // (10) Conditional Rendering (same as Phase 1, but now uses state)
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading products (Phase 2)...</Typography>
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

  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>Our Products List (Promises - Phase 2)</Typography>
      {products.length === 0 ? (
        <Typography>No products found after fetching.</Typography>
      ) : (
        <Grid container spacing={3}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={product.imageUrl} alt={product.name} style={{ width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px' }} />
                <Typography variant="h6" sx={{ textAlign: 'center' }}>{product.name}</Typography>
                <Typography variant="body1" color="primary" sx={{ mt: 1 }}>${product.price.toFixed(2)}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, textAlign: 'center' }}>{product.description}</Typography>
                <Typography variant="body2" color={product.inStock ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default ProductDisplayPromise;