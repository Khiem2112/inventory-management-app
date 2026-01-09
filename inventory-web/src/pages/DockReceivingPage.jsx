import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // <--- 1. Use Router Params
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Alert, CircularProgress, Snackbar, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InventoryIcon from '@mui/icons-material/Inventory';
import DockReceivingSearch from '../components/DockReceivingSearch';
import ReceivingGrid from '../components/ReceivingGrid';
import { fetchManifestDetails, finalizeManifest } from '../services/grServices';

const DockReceivingPage = () => {
    // --- 1. State via URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    const activeManifestId = searchParams.get('manifest_id');
    const queryClient = useQueryClient();

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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
            type: 'sm',
            sm_id: activeManifestId,
            lines: formData.lines.map(line => ({
                sm_line_id: line.id, // Maps to 'id' from the fetchManifestDetails response (e.g., 26, 31)
                received_quantity: line?.asset_items.length || 0,
                asset_items: line.asset_items.map(asset_item => ({
                    serial_number: asset_item?.serial_number,
                    isAccepted: true
                }))
            }))
        };

        // Trigger mutation
        finalizeMutation.mutate(
            payload 
        );
    };

    const pageLayoutStyles = {
        display: 'grid',
        gridTemplateColumns: '350px 1fr', // Fixed sidebar, fluid content
        gap: 3,
        height: 'calc(100vh - 100px)', // Adjust based on your header height
        overflow: 'hidden' 
    };

    return (
        <Box sx={{maxWidth: 1600, mx: 'auto', height: '100%' }}>
            
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight="bold">Dock Receiving</Typography>
                <Typography variant="body2" color="text.secondary">
                    Process inbound shipments and verify inventory counts.
                </Typography>
            </Box>

            <Box sx={pageLayoutStyles}>
                
                {/* --- LEFT COLUMN: SEARCH --- */}
                <Box sx={{ overflowY: 'auto', pr: 1 }}>
                    <DockReceivingSearch onManifestSelect={handleManifestSelect} />
                </Box>

                {/* --- RIGHT COLUMN: GRID OR PLACEHOLDER --- */}
                <Box sx={{ overflowY: 'auto', height: '100%' }}>
                    {!activeManifestId ? (
                        // EMPTY STATE
                        <Paper 
                            sx={{ 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: '#f8f9fa',
                                border: '2px dashed #e0e0e0'
                            }}
                            elevation={0}
                        >
                            <InventoryIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No Manifest Selected</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Use the search panel on the left to find a shipment.
                            </Typography>
                        </Paper>
                    ) : (
                        // ACTIVE STATE
                        <Box>
                            {isLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                                    <CircularProgress />
                                </Box>
                            )}

                            {isError && (
                                <Alert severity="error">
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
                </Box>
            </Box>

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