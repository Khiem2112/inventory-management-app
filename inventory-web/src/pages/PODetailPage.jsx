import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PODetailView from '../components/PurchaseOrderDetail'; // Your existing component
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchPurchaseOrderDetail } from '../services/poService';
import { useQuery } from '@tanstack/react-query';

const PODetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Try to get data passed from the List View
    const optimisticHeader = location.state?.initialData;

    // 2. Fallback: If no state (e.g., user refreshed page), we technically need to fetch the Header.
    // Since your current API service only fetches Items for the detail view, 
    // we might not have Header data on refresh. 
    // Ideally, you would add a 'fetchPurchaseOrderHeader(id)' to poService later.
    const { 
        data: fullDetail, 
        isLoading, 
        isError,
        error
    } = useQuery({
        queryKey: ['poDetail', id],
        queryFn: async () => fetchPurchaseOrderDetail(id),
        enabled: !!id, // Only run query if ID exists
        staleTime: 30 * 1000, // Keep data fresh for 30 seconds
    });
    
    if (!id) {
        return (
            <Box sx={{ 
                height: '100%', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', 
                color: 'text.secondary', bgcolor: '#f8f9fa' 
            }}>
                <InventoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
                <Typography variant="h6">No Order Selected</Typography>
            </Box>
        );
    }

    const activeHeader = optimisticHeader || fullDetail?.header || {}
    const showFullLoading = isLoading && !activeHeader
    const activeItems = fullDetail?.items || []
    // Scenario B: Hard Loading (Refresh case - No cache, no state)
    if (showFullLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Scenario C: Error
    if (isError) {
        return (
            <Box sx={{ p: 4, color: 'error.main' }}>
                <Typography variant="h6">Error loading Purchase Order</Typography>
                <Typography variant="body2">{error?.message}</Typography>
            </Box>
        );
    }
    console.log(`Show the api response when fetching purchase orders list: ${JSON.stringify(fullDetail)}`)



    // Scenario D: Success / Optimistic View
    return (
        <PODetailView
            header={activeHeader} 
            items={activeItems} 
            itemsLoading={isLoading} 
        />
    );
};

export default PODetailPage;