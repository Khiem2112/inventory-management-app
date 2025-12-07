import React, { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Grid, Paper, Button, Autocomplete, TextField, 
    Divider, CircularProgress, Alert, Snackbar 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import POLineItemsForm from '../components/form/POLineItemsForm'; 
import { createPurchaseOrder, searchVendors } from '../services/poService';

// Mock Plan ID for now (as per user mock request)
const DEFAULT_PLAN_ID = 5;

const POCreatePage = () => {
    const navigate = useNavigate();
    const [vendorOptions, setVendorOptions] = useState([]);
    
    // 1. Setup Form
    const methods = useForm({
        defaultValues: {
            supplier_id: null,
            supplier_obj: null, // Helper for Autocomplete UI
            purchase_plan_id: DEFAULT_PLAN_ID,
            items: [] 
        }
    });

    // 2. Setup Mutation (Create API)
    const createMutation = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: (data) => {
            // AC: Redirect to Detail View on success
            // Assuming API returns { purchase_order_id: 123, ... }
            navigate(`/purchase-orders/${data.purchase_order_id}`);
        },
        onError: (error) => {
            // Handle error (show toast/alert)
        }
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
        // Transform form data to match API Mock
        const payload = {
            supplier_id: data.supplier_id,
            is_draft: isDraft,
            purchase_plan_id: data.purchase_plan_id,
            items: data.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                item_description: item.item_description
            }))
        };
        createMutation.mutate(payload);
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
            </Box>
        </FormProvider>
    );
};

export default POCreatePage;