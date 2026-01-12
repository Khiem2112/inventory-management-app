import React, { useState, useCallback, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useBlocker, useBeforeUnload, useParams } from 'react-router-dom';
import { 
    Box, Typography, Grid, Paper, Button, Autocomplete, TextField, 
    Divider, CircularProgress, Alert, Snackbar, 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Stack
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
    const queryClient = useQueryClient()
    const isEditMode = Boolean(id);
    const [vendorOptions, setVendorOptions] = useState([]);     
    const { data: existingData, isLoading } = useQuery({
        queryKey: ['poDetail', id],
        queryFn: () => fetchPurchaseOrderDetail(id),
        enabled: isEditMode, // Only run query in edit mode
    });

    // 2. Prepare "Default" Values (Synchronous fallback)
    const emptyValues = {
        supplier_id: null,
        supplier_obj: null,
        purchase_plan_id: null,
        items: []
    };

    // 3. Prepare "Loaded" Values (Transformation Logic)
    // We memoize this so it doesn't trigger re-renders if the data structure is deep
    const loadedValues = React.useMemo(() => {
        if (!existingData) return emptyValues;

        return {
            supplier_id: existingData.header.supplier_id,
            supplier_obj: { 
                supplier_id: existingData.header.supplier_id, 
                name: existingData.header.supplier_name,
                payment_terms: "Net 30" 
            },
            purchase_plan_id: existingData.header.purchase_plan_id,
            items: existingData.items.map(item => ({
                product_id: item.product_id,
                item_description: item.item_description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                purchase_order_item_id: item.purchase_order_item_id 
            }))
        };
    }, [existingData]);

    // 4. Initialize Form with `values` prop
    const methods = useForm({
        defaultValues: emptyValues, // Used for initial render or 'Create' mode
        values: isEditMode ? loadedValues : undefined, // AUTO-RESET when this data is ready
        resetOptions: {
            keepDirtyValues: true // Optional: Prevent overwriting if user started typing while loading
        }
    });

    const { 
        formState: { isDirty, isSubmitSuccessful, errors }, 
        handleSubmit, 
        control, 
        watch, 
        setValue 
        // Note: 'reset' is rarely needed now because 'values' handles it automatically
    } = methods;

    // 2. Setup Mutation (Create API)
    const createMutation = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: (data) => {
            // AC: Redirect to Detail View on success
            // Assuming API returns { purchase_order_id: 123, ... }
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] }); // force the parent to re-render
            navigate(`/purchase-orders/${data.purchase_order_id}`, { replace: true });
        },
        onError: (error) => {
            // Handle error (show toast/alert)
        }
    });

    const updateMutation = useMutation({
        mutationFn: (payload) => updatePurchaseOrder({ poId: id, payload }),
        onSuccess: (data) => {
            // re-fetch the po detail
            queryClient.invalidateQueries({ queryKey: ['poDetail', id] }); 
            // re-fetch the po list
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            navigate(`/purchase-orders/${id}`, { replace: true })
        },
        onError: (error) => console.error("Update failed", error)
    });

    // 3. Watchers for Summary Card
    const items = useWatch({ control: control, name: 'items' });
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
        handleSubmit((data) => {
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

    // Different page title and button based on create or edit purpose
    const pageTitle = isEditMode ? `Edit Purchase Order #${existingData?.header?.display_id || id}` : "New Purchase Order";
    const confirmButtonText = isEditMode ? "Save Changes" : "Confirm Order";
    const totalAmount = calculateTotal();

    // render loading state
    if (isEditMode && isLoading) {
        return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    }

    
    if (existingData && existingData.header.status !== 'Draft') {
        // You can render a "Read Only" alert or redirect immediately
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Purchase Order #{id} is already <strong>{existingData.header.status}</strong> and cannot be edited.
                </Alert>

                <Stack
                direction='row'
                justifyContent='space-around'
                >
                    <Button variant="contained" onClick={() => navigate(`/purchase-orders/${id}`)}>
                        Go to Details
                    </Button>

                    <Button variant="contained" onClick={() => navigate(`/purchase-orders`)}>
                        Go Purchase Orders List
                    </Button>
                </Stack>


            </Box>
        );
    }



    return (
        <FormProvider {...methods}>
            {/* ROOT CONTAINER: Centered Layout with Padding */}
            <Box sx={{ maxWidth: 1200, minHeight: '100%' }}>
                
                {/* HEADER: Stack for alignment */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate('/purchase-orders')} 
                        sx = {{
                            color:"white",
                            bgcolor:"primary.main"
                        }}
                    >
                        Go to List
                    </Button>
                    <Typography variant="h4" fontWeight="bold">
                        {pageTitle}
                    </Typography>
                </Stack>

                {createMutation.isError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        Failed to save PO. Please check your inputs.
                    </Alert>
                )}

                {/* MAIN LAYOUT: Grid for Sidebar vs Content */}
                <Grid container spacing={3}>
                    
                    {/* LEFT COLUMN: Form Inputs */}
                    <Grid item xs={12} md={8}>
                        <Stack spacing={3}>
                            
                            {/* SECTION 1: Vendor Selection */}
                            <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.paper' }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    Vendor Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            options={vendorOptions}
                                            value={watch('supplier_obj')}
                                            isOptionEqualToValue={(option, value) => option.supplier_id === value.supplier_id}
                                            getOptionLabel={(option) => option.name}
                                            onOpen={async () => {
                                                const results = await searchVendors("");
                                                setVendorOptions(results);
                                            }}
                                            onChange={(_, newValue) => {
                                                setValue('supplier_id', newValue?.id);
                                                setValue('supplier_obj', newValue);
                                            }}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    label="Select Vendor" 
                                                    required 
                                                    error={!!errors.supplier_id}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField 
                                            label="Payment Terms" 
                                            fullWidth 
                                            disabled 
                                            value={watch('supplier_obj')?.payment_terms || ''} 
                                            helperText="Auto-populated from Vendor"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* SECTION 2: Line Items (Component handles its own Paper/Layout) */}
                            <POLineItemsForm />
                        </Stack>
                    </Grid>

                    {/* RIGHT COLUMN: Summary & Actions */}
                    <Grid item xs={12} md={4}>
                        {/* STICKY WRAPPER: Box handles positioning */}
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            
                            {/* VISUAL SURFACE: Paper handles look */}
                            <Paper elevation={3} sx={{ p: 3, bgcolor: 'background.paper' }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    Order Summary
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                
                                {/* Calculations Stack */}
                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="text.secondary">Subtotal</Typography>
                                        <Typography fontWeight="bold">${totalAmount.toFixed(2)}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="text.secondary">Tax (0%)</Typography>
                                        <Typography fontWeight="bold">$0.00</Typography>
                                    </Stack>
                                </Stack>

                                <Divider sx={{ mb: 2 }} />
                                
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                                    <Typography variant="h6">Total</Typography>
                                    <Typography variant="h6" color="primary.main">
                                        ${totalAmount.toFixed(2)}
                                    </Typography>
                                </Stack>

                                {totalAmount > 5000 && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        High Value PO: Approval will be required.
                                    </Alert>
                                )}

                                {/* ACTION BUTTONS */}
                                <Stack direction="row" spacing={2}>
                                    <Button 
                                        fullWidth 
                                        variant="outlined" 
                                        startIcon={<SaveIcon />}
                                        onClick={handleSubmit(d => onSubmit(d, true))}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        Draft
                                    </Button>
                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        startIcon={(createMutation.isPending || updateMutation.isPending) ? <CircularProgress size={20} color="inherit"/> : <SendIcon />}
                                        onClick={handleSubmit(d => onSubmit(d, false))}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        {confirmButtonText}
                                    </Button>
                                </Stack>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>

                {/* --- EXIT DIALOG --- */}
                <Dialog
                    open={showExitDialog}
                    onClose={handleStayOnPage}
                >
                    <DialogTitle>Unsaved Changes</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
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
                            autoFocus
                        >
                            Save Draft
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </FormProvider>
    );
};

export default POCreatePage;