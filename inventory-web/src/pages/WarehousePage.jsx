// WarehousePage.jsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ZoneCard from '../components/ZoneCards';
import { Box, Typography, Grid, Container } from '@mui/material';
import api from '../services/api';
// Ensure the global styles (including .warehouse-zones and .warehouse-zones__list) 
// are available in your application's main stylesheet.



const WarehousePage = () => {

  const fetchWarehouseZones = async () => {
  try {
    const endpoint = "/warehouse_zones/all/"
    console.log('Before call the API')
    const response =await api.get(endpoint)
    if (response.status !== 200) {
      console.log('Erroorororoooooooooooooooooooooooo')
      throw new Error (`Error when calling to endpoint: ${endpoint} with message: `,
      )
    }
    const zonesList = await response.data
    return zonesList
  }
  catch (err) {
    console.error(`Fetching warehouse zones data error`, err)
  }
  
}

  const { 
    data: zones, // Renamed 'data' to 'zones' for clarity
    isLoading, 
    isError, 
    error 
  } = useQuery({
    // A unique key used for caching, refetching, and sharing data across components
    queryKey: ['warehouseZones'], 
    
    // The function that performs the data fetching
    queryFn: fetchWarehouseZones, 
    
    // Optional configuration
    staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevents refetching when window regains focus
  });

  const PRIMARY_BLUE = '#42a5f5';


  // --- 1. CRITICAL: Handle Loading State ---
  if (isLoading) {
    // You could use MUI Skeleton or CircularProgress here
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography align="center">Loading warehouse zones...</Typography>
      </Container>
    );
  }

  if (isError) {
    // Check if error is defined and has a message property
    const errorMessage = error?.message || "An unknown error occurred while fetching zones.";

    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography color="error" align="center" variant="h6">
          Error: {errorMessage}
        </Typography>
        <Typography color="text.secondary" align="center" variant="body1">
          Please check the network connection or API service.
        </Typography>
      </Container>
    );
  }

  const zonesList = zones || []; // Ensure it's an array if it somehow makes it here undefined
  console.log(`The zones list before pass into the page: ${JSON.stringify(zonesList)}`)
  // The rest of your rendering logic
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography 
        variant="h3" 
        component="h1" 
        align="center" 
        gutterBottom
        sx={{ mb: 5, color: PRIMARY_BLUE }}
      >
        Warehouse Zones Overview
      </Typography>

      <Grid container spacing={5} alignItems="stretch" xs = {25}>
        {/* Iterate over the safely defined zonesList */}
        {zonesList.map((zone) => (
          <Grid 
            item 
            key={zone?.ZoneId} // Ensure zone.id exists and is unique!
            xs={12} 
            sm={6}  
            md={4}  
            lg={3}  
          >
            <ZoneCard
              // Ensure your zone object has these properties: title, description, etc.
              title={zone?.Zone_name}
              description={zone?.description}
              imageUrl={zone?.zone_image_url}
              imageAlt={zone.imageAlt || zone.zone_name}
            />
          </Grid>
        ))}
        
        {/* Handle case where data is loaded but the list is empty */}
        {zonesList.length === 0 && (
            <Grid item xs={12}>
                <Typography align="center" color="text.secondary">No warehouse zones found.</Typography>
            </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default WarehousePage;