import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Alert, CircularProgress, Snackbar, Paper, Stack } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import DockReceivingSearch from '../components/DockReceivingSearch';
import ReceivingGrid from '../components/ReceivingGrid';
import { fetchManifestDetails, finalizeManifest } from '../services/grServices';

const DockReceivingPage = () => {
    // --- 1. State via URL ---
    const [searchParams, setSearchParams] = useSearchParams();
    const activeManifestId = searchParams.get('manifest_id');
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // --- 2. Data Fetching ---
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

    // --- 3. Mutation ---
    const finalizeMutation = useMutation({
        mutationFn: finalizeManifest,
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
        const payload = {
            type: 'sm',
            sm_id: activeManifestId,
            lines: formData.lines.map(line => ({
                sm_line_id: line.id,
                received_quantity: line?.asset_items.length || 0,
                asset_items: line.asset_items.map(asset_item => ({
                    serial_number: asset_item?.serial_number,
                    isAccepted: true
                }))
            }))
        };
        finalizeMutation.mutate(payload);
    };

    return (
        // Root Container: Sets outer margins
        <Stack 
            direction='column'
            sx={{height: '100%'}}>
            
            {/* Header: Uses Stack for vertical rhythm */}
            <Stack spacing={0.5} sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Dock Receiving</Typography>
                <Typography variant="body2" color="text.secondary">
                    Process inbound shipments and verify inventory counts.
                </Typography>
            </Stack>

            {/* Layout: Grid is still best for Sidebar + Fluid Content, but we use Theme spacing */}
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: '350px 1fr', 
                gap: 3,
                height: '100%', 
                overflow: 'hidden' 
            }}>
                
                {/* LEFT COLUMN: SEARCH */}
                <Box sx={{ overflowY: 'auto'}}>
                    <DockReceivingSearch onManifestSelect={handleManifestSelect} />
                </Box>

                {/* RIGHT COLUMN: CONTENT */}
                <Box sx={{ overflowY: 'auto', height: '100%' }}>
                    {!activeManifestId ? (
                        // EMPTY STATE: Visuals managed by Paper, Layout by Stack
                        <Paper 
                            variant="outlined"
                            sx={{ 
                                height: '100%', 
                                bgcolor: 'background.default', // THEME COLOR
                                borderColor: 'divider',       // THEME COLOR
                                borderStyle: 'dashed',
                                borderWidth: 2
                            }}
                        >
                            <Stack 
                                alignItems="center" 
                                justifyContent="center" 
                                spacing={2} 
                                sx={{ height: '100%' }}
                            >
                                <InventoryIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="text.secondary">No Manifest Selected</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Use the search panel on the left to find a shipment.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    ) : (
                        // ACTIVE STATE
                        <Box
                        sx ={{
                            height: '100%'
                        }}
                        >
                            {isLoading && (
                                <Stack alignItems="center" sx={{ p: 10 }}>
                                    <CircularProgress />
                                </Stack>
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
        </Stack>
    );
};

export default DockReceivingPage;