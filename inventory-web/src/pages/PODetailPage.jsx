import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PODetailView from '../components/PurchaseOrderDetail'; // Your existing component
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PODetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Try to get data passed from the List View
    const optimisticData = location.state?.initialData;

    // 2. Fallback: If no state (e.g., user refreshed page), we technically need to fetch the Header.
    // Since your current API service only fetches Items for the detail view, 
    // we might not have Header data on refresh. 
    // Ideally, you would add a 'fetchPurchaseOrderHeader(id)' to poService later.
    
    // For now, we handle the missing data gracefully:
    if (!optimisticData) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Header Information Missing
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Because this page was reloaded, we lost the Purchase Order header details 
                    (Supplier, Status, etc). Please go back to the list and select the order again.
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/purchase-orders')}
                >
                    Back to List
                </Button>
                
                {/* Future Improvement: 
                   Load <PODetailView> anyway with just the ID, 
                   and have PODetailView fetch the header itself if props are missing.
                */}
            </Box>
        );
    }

    // 3. Render the View with the data
    return <PODetailView purchaseOrder={optimisticData} />;
};

export default PODetailPage;