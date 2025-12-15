import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // <--- 1. Use Router Params
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Alert, CircularProgress, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import DockReceivingSearch from '../components/DockReceivingSearch';
import ReceivingGrid from '../components/ReceivingGrid';
import { fetchManifestDetails, finalizeManifest } from '../services/grServices';

const DockReceivingPage = () => {
    // --- 1. State via URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    const activeManifestId = searchParams.get('manifest_id');
    const queryClient = useQueryClient();

    const [toast, setToast] = React.useState({ open: false, message: '', severity: 'success' });

    // --- 2. Data Fetching (Only if ID exists) ---
    const { 
        data: manifestData, 
        isLoading, 
        isError,
        error 
    } = useQuery({
        queryKey: ['manifestDetails', activeManifestId],
        queryFn: () => fetchManifestDetails(activeManifestId),
        enabled: !!activeManifestId,
        retry: 1
    });

    // --- 3. Mutation (Finalize) ---
    const finalizeMutation = useMutation({
        mutationFn: finalizeManifest, // <--- Use new service function
        onSuccess: (data) => {
            setToast({ 
                open: true, 
                message: data.message || `Receipt ${data.receipt_number} finalized successfully!`, 
                severity: 'success' 
            });
            handleBackToSearch(); 
        },
        onError: (err) => {
            setToast({ 
                open: true, 
                message: err.message || "Failed to finalize receipt.", 
                severity: 'error' 
            });
        }
    });

    // --- Handlers ---
    const handleManifestSelect = (manifest) => {
        setSearchParams({ manifest_id: manifest.manifest_id });
    };

    const handleBackToSearch = () => {
        setSearchParams({});
    };

    const handleSubmitReceipt = (formData) => {
        // Construct the payload required by the API
        const payload = {
            dock_location: "ReceivingZone", // Hardcoded for now, or add a selector in UI if needed
            counts: formData.lines.map(line => ({
                line_id: line.id, // Maps to 'id' from the fetchManifestDetails response (e.g., 26, 31)
                qty_actual: Number(line.current_receive_input)
            }))
        };

        // Trigger mutation
        finalizeMutation.mutate({ 
            manifestId: activeManifestId, 
            payload 
        });
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            
            {/* Header / Nav */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                {activeManifestId && (
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={handleBackToSearch}
                        sx={{ mr: 2 }}
                    >
                        Search
                    </Button>
                )}
                <Box>
                    <Typography variant="h4" fontWeight="bold">Dock Receiving</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {activeManifestId 
                            ? `Verifying Manifest #${activeManifestId}`
                            : "Scan or search for inbound manifests to begin."}
                    </Typography>
                </Box>
            </Box>

            {/* --- VIEW SWITCHER --- */}
            {!activeManifestId ? (
                // VIEW 1: SEARCH
                <DockReceivingSearch onManifestSelect={handleManifestSelect} />
            ) : (
                // VIEW 2: RECEIVING GRID
                <Box>
                    {isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error?.message || "Failed to load manifest details."}
                        </Alert>
                    )}

                    {manifestData && (
                        <ReceivingGrid 
                            manifestData={manifestData} 
                            onSubmit={handleSubmitReceipt}
                            isSubmitting={finalizeMutation.isPending}
                        />
                    )}
                </Box>
            )}

            {/* Toast Notification */}
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
        </Box>
    );
};

export default DockReceivingPage;