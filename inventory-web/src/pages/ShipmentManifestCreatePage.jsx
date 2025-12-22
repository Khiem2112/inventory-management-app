import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    Box, Typography, Paper, Grid, TextField, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Stepper, Step, StepLabel, CircularProgress, Alert, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { fetchPOContext, submitManifest } from '../services/smServices';

const steps = ['Select Purchase Order', 'Enter Shipment Details', 'Confirmation'];

const ShipmentManifestCreatePage = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedPOId, setSelectedPOId] = useState('');
    const [poContext, setPoContext] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);

    // --- Form Setup ---
    const { control, handleSubmit, register, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            tracking_number: '',
            carrier_name: '',
            estimated_arrival: '',
            lines: [] // Renamed 'items' to 'lines' to match API payload better, though internal form name can be anything
        }
    });

    const { fields } = useFieldArray({ control, name: 'lines' });

    // --- Mutation: Fetch PO Context ---
    const poLookupMutation = useMutation({
        mutationFn: fetchPOContext,
        onSuccess: (data) => {
            setPoContext(data);
            
            // Map PO Items to Manifest Lines
            // Filter: Only items with quantity_remaining > 0
            const shippableLines = data.items
                .filter(item => item.quantity_remaining > 0)
                .map(item => ({
                    // Form-specific fields to track context
                    product_id: item.product_id, 
                    product_name: item.product_name,
                    max_qty: item.quantity_remaining,
                    
                    // API-specific fields for submission
                    supplier_sku: item.item_description, // Default SKU mapping
                    quantity_declared: item.quantity_remaining, // Default to max
                    supplier_serial_number: "" // Optional field
                }));
            
            reset({ 
                lines: shippableLines,
                tracking_number: '', 
                carrier_name: '',
                estimated_arrival: ''
            });
            setActiveStep(1);
        },
        onError: () => alert("PO not found or invalid.")
    });

    // --- Mutation: Submit Manifest ---
    const submitManifestMutation = useMutation({
        mutationFn: submitManifest,
        onSuccess: (data) => {
            setSubmissionResult(data);
            setActiveStep(2);
        }
    });

    // --- Handlers ---
    const handlePOSearch = () => {
        if (selectedPOId) poLookupMutation.mutate(selectedPOId);
    };

    const onSubmit = (data) => {
        // Construct Payload matching your API requirement
        const payload = {
            purchase_order_id: Number(selectedPOId),
            tracking_number: data.tracking_number,
            carrier_name: data.carrier_name,
            estimated_arrival: new Date(data.estimated_arrival).toISOString(), // Ensure ISO format
            status: "posted", // Default status as per requirement
            lines: data.lines.map(line => ({
                product_id: line.product_id,
                quantity_declared: Number(line.quantity_declared),
                supplier_sku: line.supplier_sku || "N/A", 
                supplier_serial_number: line.supplier_serial_number || "N/A"
            }))
        };
        submitManifestMutation.mutate(payload);
    };

    // --- Render Steps ---

    const renderStep0_POSearch = () => (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Start New Shipment</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Enter the Purchase Order number provided by the buyer to retrieve order details.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField 
                    fullWidth 
                    label="Purchase Order ID" 
                    placeholder="e.g. 33" 
                    value={selectedPOId}
                    onChange={(e) => setSelectedPOId(e.target.value)}
                />
                <Button 
                    variant="contained" 
                    size="large" 
                    startIcon={poLookupMutation.isPending ? <CircularProgress size={20} color="inherit"/> : <SearchIcon />}
                    onClick={handlePOSearch}
                    disabled={!selectedPOId || poLookupMutation.isPending}
                >
                    Find
                </Button>
            </Box>
        </Paper>
    );

    const renderStep1_Details = () => (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Paper sx={{ p: 3, mb: 3 }}>
                {/* Header Summary */}
                <Box sx={{ mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">PO Number</Typography>
                            <Typography variant="body1" fontWeight="bold">#{poContext.header.purchase_order_id}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Customer</Typography>
                            <Typography variant="body1">{poContext.header.create_user_name}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Order Date</Typography>
                            <Typography variant="body1">{poContext.header.create_date}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">Supplier</Typography>
                            <Typography variant="body1">{poContext.header.supplier_name}</Typography>
                        </Grid>
                    </Grid>
                </Box>

                <Typography variant="h6" gutterBottom>Shipment Info</Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth label="Tracking Number" 
                            {...register('tracking_number', { required: "Required" })}
                            error={!!errors.tracking_number}
                            helperText={errors.tracking_number?.message}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth label="Carrier Name" 
                            {...register('carrier_name', { required: "Required" })}
                            error={!!errors.carrier_name}
                            helperText={errors.carrier_name?.message}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField 
                            fullWidth type="datetime-local" label="Est. Arrival" InputLabelProps={{ shrink: true }}
                            {...register('estimated_arrival', { required: "Required" })}
                            error={!!errors.estimated_arrival}
                            helperText={errors.estimated_arrival?.message}
                        />
                    </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>Items to Ship</Typography>
                <TableContainer sx={{ border: '1px solid #eee' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                <TableCell>Product</TableCell>
                                <TableCell>SKU / Ref</TableCell>
                                <TableCell align="right">Pending Qty</TableCell>
                                <TableCell align="right" width={150}>Ship Qty</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.map((field, index) => {
                                const max = field.max_qty;
                                return (
                                    <TableRow key={field.id}>
                                        <TableCell>{field.product_name}</TableCell>
                                        <TableCell>
                                            <TextField 
                                                variant="standard"
                                                fullWidth
                                                placeholder="Supplier SKU"
                                                {...register(`lines.${index}.supplier_sku`)} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">{max}</TableCell>
                                        <TableCell align="right">
                                            <TextField 
                                                type="number" size="small"
                                                {...register(`lines.${index}.quantity_declared`, { 
                                                    required: true, min: 0, max: { value: max, message: `Max ${max}` } 
                                                })}
                                                error={!!errors.lines?.[index]?.quantity_declared}
                                                helperText={errors.lines?.[index]?.quantity_declared?.message}
                                                InputProps={{ inputProps: { min: 0, max: max, style: { textAlign: 'right' } } }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setActiveStep(0)}>Back</Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        size="large"
                        startIcon={submitManifestMutation.isPending ? <CircularProgress size={20} color="inherit"/> : <ArrowForwardIcon />}
                        disabled={submitManifestMutation.isPending}
                    >
                        Create Manifest
                    </Button>
                </Box>
            </Paper>
        </form>
    );

    const renderStep2_Success = () => (
        <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 4 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" gutterBottom>Success!</Typography>
            <Typography variant="body1" paragraph>
                Shipment Manifest <strong>ID #{submissionResult?.id}</strong> has been created.
            </Typography>
            <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 2, mb: 3, textAlign: 'left' }}>
                <Typography variant="body2"><strong>Status:</strong> {submissionResult?.status}</Typography>
                <Typography variant="body2"><strong>Tracking:</strong> {submissionResult?.tracking_number}</Typography>
                <Typography variant="body2"><strong>Est. Arrival:</strong> {new Date(submissionResult?.estimated_arrival).toLocaleString()}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => window.location.reload()}>Create Another</Button>
        </Paper>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Create Shipment Manifest</Typography>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>

            {activeStep === 0 && renderStep0_POSearch()}
            {activeStep === 1 && poContext && renderStep1_Details()}
            {activeStep === 2 && renderStep2_Success()}
        </Box>
    );
};

export default ShipmentManifestCreatePage;