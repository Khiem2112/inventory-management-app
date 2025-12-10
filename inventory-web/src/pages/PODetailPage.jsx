import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PODetailView from '../components/PurchaseOrderDetail'; // Your existing component
import { Box, Typography, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchPurchaseOrderDetail, approvePO, rejectPO } from '../services/poService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <--- 1. Import Client

const PODetailPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); // Used to refresh data after approval

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
    // Handle when user close detail view
    const handleClose = () => {
        navigate("/purchase-orders")
    }

    const approveMutation = useMutation({
        mutationFn: () => approvePO(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['poDetail', id]); // Refresh UI to show "Issued"
            setToast({ open: true, message: "Purchase Order Approved!", severity: 'success' });
        },
        onError: (err) => setToast({ open: true, message: err.message || "Approval Failed", severity: 'error' })
    });

    const rejectMutation = useMutation({
        mutationFn: (reason) => rejectPO({ poId: id, reason }),
        onSuccess: () => {
            queryClient.invalidateQueries(['poDetail', id]);
            setToast({ open: true, message: "Purchase Order Rejected", severity: 'info' });
        },
        onError: (err) => setToast({ open: true, message: err.message || "Rejection Failed", severity: 'error' })
    });

    const pdfMutation = useMutation({
        mutationFn: () => downloadPurchaseOrderPDF(id),
        onError: (err) => setToast({ open: true, message: "PDF Generation Failed", severity: 'error' })
    });

    // --- UI State ---
    const [toast, setToast] = React.useState({ open: false, message: '', severity: 'info' });

    const isProcessing = approveMutation.isPending || rejectMutation.isPending || pdfMutation.isPending;

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
        console.error(`Error fetching PO: 90 | ${JSON.stringify(error)}`)
        return (
            <Box sx={{ p: 4, color: 'error.main' }}>
                <Typography variant="h6">Error loading Purchase Order || {error?.message || "Unexpected Error code"}</Typography>
                <Typography variant="body2">{  error?.response?.data?.detail || `Unexpected error fetching PO: ${id}`}</Typography>
            </Box>
        );
    }
    console.log(`Show the api response when fetching purchase orders list: ${JSON.stringify(fullDetail)}`)



    // Scenario D: Success / Optimistic View
    return (
        <>
            <PODetailView
                header={activeHeader} 
                items={activeItems} 
                itemsLoading={isLoading} 
                onClose={handleClose}
                // Pass Actions Down
                onApprove={() => approveMutation.mutate()}
                onReject={(reason) => rejectMutation.mutate(reason)}
                onGeneratePDF={() => pdfMutation.mutate()}
                isProcessing={isProcessing}
            />

            <Snackbar 
                open={toast.open} 
                autoHideDuration={6000} 
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </>
        

        
    );
};

export default PODetailPage;