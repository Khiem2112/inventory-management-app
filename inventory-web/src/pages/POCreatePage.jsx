import React, { useState, useCallback, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useBlocker, useBeforeUnload, useParams } from 'react-router-dom';
import { 
    Box, Typography, Grid, Paper, Button, Autocomplete, TextField, 
    Divider, CircularProgress, Alert, Snackbar, 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import POLineItemsForm from '../components/form/POLineItemsForm'; 
import { createPurchaseOrder, searchVendors, fetchPurchaseOrderDetail, updatePurchaseOrder } from '../services/poService';

// Mock Plan ID for now (as per user mock request)

const POCreatePage = () => {
    const navigate = useNavigate();
    // Check for ID in case the current page is for Update
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [vendorOptions, setVendorOptions] = useState([]);
    
    // 1. Setup Form
    const methods = useForm({
        defaultValues: {
            supplier_id: null,
            supplier_obj: null, // Helper for Autocomplete UI
            purchase_plan_id: null,
            items: [] 
        }
    });

    // Get formState from methods
    const { formState: { isDirty, isSubmitSuccessful }, reset, setValue, register, watch } = methods;

    // Fetch Data if Edit Mode ---
    const { data: existingData, isLoading: isLoadingData } = useQuery({
        queryKey: ['poDetail', id],
        queryFn: () => fetchPurchaseOrderDetail(id),
        enabled: isEditMode,
        refetchOnWindowFocus: false,
    });

    // Populate Form on Data Load
    useEffect(() => {
        if (existingData) {
            // Guard: Prevent editing if not Draft
            if (existingData.header.status !== 'Draft') {
                alert("Only Draft orders can be edited.");
                navigate(`/purchase-orders/${id}`);
                return;
            }

            // Map API Data -> Form Structure
            const formData = {
                supplier_id: existingData.header.supplier_id, // Ensure this exists in your header API response
                // Reconstruct supplier_obj for the Autocomplete to show the name
                supplier_obj: { 
                    supplier_id: existingData.header.supplier_id, 
                    name: existingData.header.supplier_name,
                    payment_terms: "Net 30" // Mock or fetch if available in header
                },
                purchase_plan_id: existingData.header.purchase_plan_id,
                items: existingData.items.map(item => ({
                    product_id: item.product_id,
                    item_description: item.item_description, // or item.product_name depending on API
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    // If needed, store original ID to handle updates vs new lines
                    purchase_order_item_id: item.purchase_order_item_id 
                }))
            };

            // Reset form with fetched values
            reset(formData);
        }
    }, [existingData, reset, id, navigate]);

    // 2. Setup Mutation (Create API)
    const createMutation = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: (data) => {
            // AC: Redirect to Detail View on success
            // Assuming API returns { purchase_order_id: 123, ... }
            navigate(`/purchase-orders/${data.purchase_order_id}`, { replace: true });
        },
        onError: (error) => {
            // Handle error (show toast/alert)
        }
    });

    const updateMutation = useMutation({
        mutationFn: (payload) => updatePurchaseOrder({ poId: id, payload }),
        onSuccess: (data) => navigate(`/purchase-orders/${id}`, { replace: true }),
        onError: (error) => console.error("Update failed", error)
    });

    // 3. Watchers for Summary Card
    const items = useWatch({ control: methods.control, name: 'items' });
    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            return acc + ((item.quantity || 0) * (item.unit_price || 0));
        }, 0);
    };

    // 4. Handle Submit
    const onSubmit = (data, isDraft) => {
        console.log(`Receive data when trying trying to submit po: ${JSON.stringify(data)}`)
        const payload = {
            supplier_id: data.supplier_obj?.supplier_id,
            is_draft: isDraft,
            items: data.items.map(item => ({
                product_id: Number(item.product_id), //Ensure number type
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                item_description: item.item_description
            }))
        };

        // Only add purchase_plan_id if it is a valid reference (not null/undefined/0)
        if (data.purchase_plan_id) {
            payload.purchase_plan_id = data.purchase_plan_id;
        }

        console.log("Submitting Payload:", JSON.stringify(payload, null, 2));
        const mutation = isEditMode ? updateMutation: createMutation
        mutation.mutate(payload);
    };

    // unsaved guard
    useBeforeUnload(
        useCallback((e) => {
            if (isDirty && !isSubmitSuccessful) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser's native "Leave site?" dialog
            }
        }, [isDirty, isSubmitSuccessful])
    );

    // 2. In-App Navigation Guard (Handles Back Button / Cancel Click)
    // useBlocker comes from react-router-dom v6.19+
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && 
            !isSubmitSuccessful && 
            currentLocation.pathname !== nextLocation.pathname
    );

    // Dialog State derived from blocker
    const showExitDialog = blocker.state === "blocked";

    const handleDiscardAndLeave = () => {
        if (blocker.state === "blocked") {
            blocker.proceed(); // Allow the navigation to continue
        } else {
            navigate('/purchase-orders'); // Fallback for manual Cancel click if blocker didn't catch
        }
    };

    const handleSaveDraftAndLeave = () => {
        methods.handleSubmit((data) => {
            const payload = { /* ... construct payload ... */ 
                supplier_id: data.supplier_obj?.supplier_id, 
                is_draft: true,
                items: data.items.map(item => ({
                    product_id: Number(item.product_id), 
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    item_description: item.item_description
                }))
            };
            if (data.purchase_plan_id) payload.purchase_plan_id = data.purchase_plan_id;

            const mutation = isEditMode ? updateMutation : createMutation; // Select mutation
            
            mutation.mutate(payload, {
                onSuccess: (res) => {
                    if (blocker.state === "blocked") blocker.proceed();
                    else navigate(`/purchase-orders/${res?.purchase_order_id || id}`);
                }
            });
        })();
    };

    const handleStayOnPage = () => {
        if (blocker.state === "blocked") {
            blocker.reset(); // Return to normal state
        }
    };

    return (
        <FormProvider {...methods}>
            <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                {/* Header Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchase-orders')} sx={{ mr: 2 }}>
                        Cancel
                    </Button>
                    <Typography variant="h4" fontWeight="bold">New Purchase Order</Typography>
                </Box>

                {createMutation.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Failed to create PO. Please check your inputs.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* LEFT COL: Form */}
                    <Grid item xs={12} md={8}>
                        {/* AC1: Vendor Selection */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Vendor Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        options={vendorOptions}
                                        value={watch('supplier_obj')}
                                        isOptionEqualToValue={(option, value) => 
                                            option.supplier_id === value.supplier_id
                                        }
                                        getOptionLabel={(option) => option.name}
                                        onOpen={async () => {
                                            const results = await searchVendors(""); // Load initial
                                            setVendorOptions(results);
                                        }}
                                        onChange={(_, newValue) => {
                                            methods.setValue('supplier_id', newValue?.id);
                                            methods.setValue('supplier_obj', newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField 
                                                {...params} 
                                                label="Select Vendor" 
                                                required 
                                                error={!!methods.formState.errors.supplier_id}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField 
                                        label="Payment Terms" 
                                        fullWidth 
                                        disabled 
                                        value={methods.watch('supplier_obj')?.payment_terms || ''} 
                                        helperText="Auto-populated from Vendor"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* AC2 & AC3: Line Items */}
                        <POLineItemsForm />
                    </Grid>

                    {/* RIGHT COL: Summary & Actions */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                            <Typography variant="h6" gutterBottom>Order Summary</Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Subtotal</Typography>
                                <Typography fontWeight="bold">${calculateTotal().toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Tax (0%)</Typography>
                                <Typography fontWeight="bold">$0.00</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6">Total</Typography>
                                <Typography variant="h6" color="primary">${calculateTotal().toFixed(2)}</Typography>
                            </Box>

                            {calculateTotal() > 5000 && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    High Value PO: Approval will be required for ${calculateTotal()}
                                </Alert>
                            )}

                            {/* AC5: Actions */}
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Button 
                                        fullWidth 
                                        variant="outlined" 
                                        startIcon={<SaveIcon />}
                                        onClick={methods.handleSubmit(d => onSubmit(d, true))}
                                        disabled={createMutation.isPending}
                                    >
                                        Draft
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit"/> : <SendIcon />}
                                        onClick={methods.handleSubmit(d => onSubmit(d, false))}
                                        disabled={createMutation.isPending}
                                    >
                                        Confirm
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                {/* --- EXIT GUARD DIALOG --- */}
                    <Dialog
                        open={showExitDialog}
                        onClose={handleStayOnPage}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Unsaved Changes"}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                You have unsaved changes in this Purchase Order. <br/>
                                Would you like to save it as a <strong>Draft</strong> before leaving?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleStayOnPage} color="inherit">
                                Cancel
                            </Button>
                            <Button onClick={handleDiscardAndLeave} color="error">
                                Discard & Leave
                            </Button>
                            <Button 
                                onClick={handleSaveDraftAndLeave} 
                                variant="contained" 
                                color="primary" 
                                autoFocus
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? "Saving..." : "Save Draft"}
                            </Button>
                        </DialogActions>
                    </Dialog>
            </Box>
        </FormProvider>
    );
};

export default POCreatePage;