import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller, FormProvider, useWatch, useFormContext } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { 
    Box, Typography, Paper, Grid, TextField, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Stepper, Step, StepLabel, CircularProgress, Alert, Divider,
    Select, MenuItem, FormControl, IconButton, Chip, Dialog, DialogTitle, 
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DeleteIcon from '@mui/icons-material/Delete';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import SerialNumberDialog from '../components/modal/AssetSerialNumberDialog'
import ErrorDialog from '../components/common/ErrorDialog';
import { fetchPOContext, submitManifest } from '../services/smServices';

// --- NEW COMPONENT: Shipment Progress Bar ---
const ShipmentProgress = ({ shipped, declaring, remaining, total }) => {
    // Prevent division by zero
    const safeTotal = total || 1;
    
    // Calculate widths
    const shippedPct = Math.min(100, (shipped / safeTotal) * 100);
    const declaringPct = Math.min(100, (declaring / safeTotal) * 100);
    const remainingPct = Math.min(100, (remaining / safeTotal) * 100);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ 
                display: 'flex', 
                height: 12, // Slightly thicker for visibility
                borderRadius: 1, 
                overflow: 'hidden', 
                bgcolor: '#f5f5f5', 
                border: '1px solid #e0e0e0',
                mb: 0.5 
            }}>
                {/* Green: Previously Shipped */}
                {shipped > 0 && (
                    <Tooltip title={`${shipped} Previously Shipped`}>
                        <Box sx={{ width: `${shippedPct}%`, bgcolor: '#4caf50' }} /> 
                    </Tooltip>
                )}
                {/* Yellow: Currently Declaring */}
                {declaring > 0 && (
                    <Tooltip title={`${declaring} Being Declared Now`}>
                        <Box sx={{ width: `${declaringPct}%`, bgcolor: '#ffeb3b' }} /> 
                    </Tooltip>
                )}
                {/* Orange: Remaining after this declaration */}
                {remaining > 0 && (
                    <Tooltip title={`${remaining} Remaining`}>
                        <Box sx={{ width: `${remainingPct}%`, bgcolor: '#ff9800' }} /> 
                    </Tooltip>
                )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', textAlign: 'center' }}>
                <span style={{ color: '#2e7d32' }}>{shipped} Ship</span> / 
                <span style={{ color: '#fbc02d', fontWeight: 'bold' }}> {declaring} Now</span> / 
                <span style={{ color: '#ef6c00' }}> {remaining} Rem</span>
            </Typography>
        </Box>
    );
};

const steps = ['Select Purchase Order', 'Enter Shipment Details', 'Confirmation'];

const PONotFoundPage = ({ poId, onBack }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 5, 
            textAlign: 'center', 
            maxWidth: 600, 
            mx: 'auto', 
            mt: 4,
            bgcolor: '#fff4f4',
            border: '1px dashed #ffcdd2',
            borderRadius: 2
        }}
    >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
        
        <Typography variant="h5" gutterBottom fontWeight="bold" color="text.primary">
            Purchase Order #{poId} Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            We could not locate a Purchase Order with this ID. Please check the number and try again.
        </Typography>

        <Button 
            variant="outlined" 
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            fullWidth
        >
            Return to Search
        </Button>
    </Paper>
);

const POClearPage = ({ poId, onBack }) => {
    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 5, 
                textAlign: 'center', 
                maxWidth: 600, 
                mx: 'auto', 
                mt: 4,
                bgcolor: '#f8f9fa',
                border: '1px dashed #ced4da',
                borderRadius: 2
            }}
        >
            <LocalShippingIcon color="info" sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
            
            <Typography variant="h5" gutterBottom fontWeight="bold" color="text.primary">
                Manifest Complete for PO #{poId}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                All items from this Purchase Order have been assigned to shipment manifests. 
                There are no remaining quantities available to manifest at this time.
            </Typography>

            <Box sx={{ 
                textAlign: 'left', 
                bgcolor: '#fff4e5', 
                p: 2, 
                borderRadius: 1, 
                mb: 4,
                border: '1px solid #ffe2b7'
            }}>
                <Typography variant="caption" display="block" color="warning.dark" fontWeight="bold" sx={{ mb: 0.5 }}>
                    PLEASE NOTE:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    A completed manifest does not guarantee final stock entry. Items are still subject to 
                    <strong> Quality Control (QC) inspection</strong> upon arrival. Quantities may be 
                    rejected or adjusted based on physical condition and compliance.
                </Typography>
            </Box>

            <Button 
                variant="outlined" 
                color="primary"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                fullWidth
            >
                Return to Order Search
            </Button>
        </Paper>
    );
};

const UrlAwareStepper = () => {
    const location = useLocation();
    let activeStep = 0;
    if (location.pathname.includes('/success')) {
        activeStep = 2;
    } else if (location.pathname.includes('/search')) {
        activeStep = 0;
    } else {
        activeStep = 1;
    }

    const steps = ['Select Purchase Order', 'Enter Shipment Details', 'Confirmation'];

    return (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
    );
};

const Step0_POSearch = () => {
    const navigate = useNavigate()
    const [poInput, setPoInput] = useState("");

    const handlePOSearch = () => {
        if (poInput.trim()) {
            navigate(`../${poInput.trim()}`); 
        }
    };

    return (
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
                    value={poInput}
                    onChange={(e) => setPoInput(e.target.value)}
                />
                <Button 
                    variant="contained" 
                    size="large" 
                    startIcon={<SearchIcon/>}
                    onClick={handlePOSearch}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handlePOSearch();
                        }
                    }}
                >
                    Find
                </Button>
            </Box>
        </Paper>
    )
}

// Single row in the Step1 Details
const ManifestItemData = ({
    index,
    field,
    onOpenSerialDialog
}) => {
    const methods = useFormContext()
    const { register, control, formState: { errors } } = methods
    
    // Watch live values
    const shipmentMode = useWatch({
        control: control,
        name: `lines.${index}.shipment_mode`
    });

    const assetItems = useWatch({
        control: control,
        name: `lines.${index}.asset_items`
    }) || [];

    const quantityDeclared = useWatch({
        control: control,
        name: `lines.${index}.quantity_declared`
    }) || 0;

    const max = field.max_qty;
    const total = field.total_quantity || field.max_qty; // Fallback if total not available
    
    // --- Calculate Progress Values ---
    const previouslyShipped = Math.max(0, total - max);
    const declaring = Number(quantityDeclared);
    const remaining = Math.max(0, max - declaring);

    const mode = shipmentMode;
    const assets = assetItems;

    return (
        <>
        {/* 1. Product */}
        <TableCell>
            <Typography variant="body2" fontWeight="bold">{field.product_name}</Typography>
        </TableCell>
        
        {/* 2. SKU */}
        <TableCell>
            <TextField 
                variant="standard"
                fullWidth
                placeholder="Supplier SKU"
                {...register(`lines.${index}.supplier_sku`)} 
            />
        </TableCell>

        {/* 3. Serial # */}
        <TableCell>
            <TextField 
                variant="standard" 
                fullWidth 
                placeholder="Batch/Serial (Optional)"
                {...register(`lines.${index}.supplier_serial_number`)}
            />
        </TableCell>

        {/* 4. Progress (Renamed from Pending) */}
        <TableCell>
            <ShipmentProgress 
                shipped={previouslyShipped} 
                declaring={declaring} 
                remaining={remaining} 
                total={total} 
            />
        </TableCell>

        {/* 5. Shipment Data (Input or Button) */}
        <TableCell align="right">
            {mode === 'quantity_declared' ? (
                <TextField 
                    type="number" size="small"
                    {...register(`lines.${index}.quantity_declared`, { 
                        required: true, min: 0, max: { value: max, message: `Max ${max}` } 
                    })}
                    error={!!errors.lines?.[index]?.quantity_declared}
                    helperText={errors.lines?.[index]?.quantity_declared?.message}
                    InputProps={{ inputProps: { min: 0, max: max, style: { textAlign: 'right' } } }}
                />
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                    <Chip 
                        label={`${assets.length} Selected`} 
                        size="small" 
                        color={assets.length > 0 ? "primary" : "default"} 
                        variant={assets.length > 0 ? "filled" : "outlined"}
                    />
                    <Button
                        size="small" variant="outlined" startIcon={<QrCodeIcon />}
                        onClick={() => onOpenSerialDialog(index)}
                    >
                        Assets
                    </Button>
                    {/* Hidden input to enforce validation */}
                    <input type="hidden" value={assets.length} {...register(`lines.${index}.quantity_declared`, { min: 1 })} />
                </Box>
            )}
        </TableCell>

        {/* 6. Mode */}
        <TableCell>
            <Controller
                name={`lines.${index}.shipment_mode`}
                control={control}
                render={({ field: selectField }) => (
                    <Select {...selectField} size="small" fullWidth variant="standard">
                        <MenuItem value="asset_specified">Specify Assets</MenuItem>
                        <MenuItem value="quantity_declared">Qty Declared</MenuItem>
                    </Select>
                )}
            />
        </TableCell>
        </>
    )
}

const Step1_Details = () => {
    // Dialog State
    const [serialDialogOpen, setSerialDialogOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState(null);

    // Error State
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Open the Serial Dialog for a specific line
    const openSerialDialog = (index) => {
        setActiveLineIndex(index);
        setSerialDialogOpen(true);
    };

    // Save serials from dialog back to form state
    const handleSaveSerials = (newSerials) => {
        setValue(`lines.${activeLineIndex}.asset_items`, newSerials);
        // Also update the declared quantity to match the serial count
        setValue(`lines.${activeLineIndex}.quantity_declared`, newSerials.length);
        setSerialDialogOpen(false)
    };

    // --- Form Setup ---
    const methods = useForm({
        defaultValues: {
            tracking_number: '',
            carrier_name: '',
            estimated_arrival: '',
            lines: [] 
        }
    });

    const { control, handleSubmit, register, watch, setValue, reset, getValues, formState: { errors } } = methods
    const { fields } = useFieldArray({ control, name: 'lines' });

    // Current PO params
    const { po_id: selectedPOId } = useParams();
    const navigate = useNavigate();

    // --- Mutation: Fetch PO Context ---
    const {
        data: poContext,
        isSuccess: isFetchingPOContextSuccess,
        isError: isFetchingPOContextError,
        isLoading: isFetchingPOContextLoading
    } = useQuery({
        queryFn: () => fetchPOContext(selectedPOId),
        queryKey: selectedPOId
    });

    // 2. Handle the "Cleared" state as Derived State
    const shippableLines = useMemo(() => {
        if (!poContext?.items) return [];
        return poContext.items
            .filter(item => item.quantity_remaining > 0)
            .map(item => ({
                purchase_order_item_id: item?.purchase_order_item_id,
                product_id: item?.product_id,
                product_name: item?.product_name,
                // Assuming item.quantity exists (Total Ordered) for progress calculation
                total_quantity: item.quantity || item.quantity_remaining, 
                max_qty: item?.quantity_remaining,
                supplier_sku: item.item_description,
                quantity_declared: item.quantity_remaining, // Default to full remaining? Or 0?
                supplier_serial_number: "",
                // CHANGE: Default to 'asset_specified'
                shipment_mode: 'asset_specified' 
            }));
    }, [poContext]);

    const isPOClear = poContext && shippableLines.length === 0;

    // 3. Handle the FORM RESET
    useEffect(() => {
        if (isFetchingPOContextSuccess) {
            reset({
                lines: shippableLines,
                tracking_number: '',
                carrier_name: '',
                estimated_arrival: ''
            });
        }
    }, [isFetchingPOContextSuccess, isPOClear, shippableLines, reset]);
    
    // Error Handling
    const isPONotFound = isFetchingPOContextError

    const handleBackToSearch = () => {
        navigate('/supplier/manifest/create/search');
    } 

    // --- Mutation: Submit Manifest ---
    const submitManifestMutation = useMutation({
        mutationFn: submitManifest,
        onSuccess: (data) => {
            navigate('success', { state: { manifestSuccessResponse: data } })
        },
        onError: (error) => {
            setSubmitError(error)
            setErrorDialogOpen(true)
        }
    })

    const onSubmit = (data) => {
        const payload = {
            purchase_order_id: Number(selectedPOId),
            tracking_number: data.tracking_number,
            carrier_name: data.carrier_name,
            estimated_arrival: new Date(data.estimated_arrival).toISOString(), 
            status: "posted", 
            lines: data.lines.map(line => {
                const baseLine = {
                    purchase_order_item_id: line.purchase_order_item_id,
                    supplier_serial_number: line.supplier_serial_number || "N/A",
                    supplier_sku: line.supplier_sku || "N/A",
                    shipment_mode: line.shipment_mode
                };

                if (line.shipment_mode === 'asset_specified') {
                    return {
                        ...baseLine,
                        asset_items: line.asset_items 
                    };
                } else {
                    return {
                        ...baseLine,
                        quantity: Number(line.quantity_declared) 
                    };
                }
            })
        };
        console.log("Submitting Payload:", payload);
        submitManifestMutation.mutate(payload);
    };

    if (isPONotFound) return <PONotFoundPage poId={selectedPOId} onBack={handleBackToSearch} />

    if (isPOClear) {
        return <POClearPage poId={selectedPOId} onBack={handleBackToSearch} />;
    }
    
    if (isFetchingPOContextLoading && selectedPOId) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>Loading Order Context...</Typography>
            </Box>
        );
    }

    const activeLine = activeLineIndex !== null ? getValues(`lines.${activeLineIndex}`) : null;
    
    return (
        <FormProvider {...methods} >
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
                                <Typography variant="caption" color="text.secondary">Creation Employee</Typography>
                                <Typography variant="body1">{poContext.header.create_user_name}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Order Date</Typography>
                                <Typography variant="body1">{poContext.header.create_date}</Typography>
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
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Controller
                                    control={control}
                                    name="estimated_arrival"
                                    rules={{ required: "Required" }}
                                    render={({ field, fieldState: { error } }) => (
                                        <DateTimePicker
                                            label="Est. Arrival"
                                            value={field.value ? new Date(field.value) : null}
                                            onChange={(date) => field.onChange(date)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!error,
                                                    helperText: error?.message,
                                                    variant: "outlined"
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom>Items to Ship</Typography>
                    <TableContainer sx={{ border: '1px solid #eee' }}>
                        {/* CHANGE 1: Fixed Layout */}
                        <Table size="small" sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                    {/* CHANGE 3: Reordered Columns */}
                                    <TableCell width="15%">Product</TableCell>
                                    <TableCell width="16%">Supplier SKU</TableCell>
                                    <TableCell width="15%">Serial #</TableCell>
                                    <TableCell width="20%">Progress</TableCell>
                                    <TableCell width="24%" align="right">Shipment Data</TableCell>
                                    <TableCell width="10%">Mode</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fields.map((field, index) => {
                                    return (
                                        <TableRow 
                                        key={field.id}
                                        sx = {{
                                            height: '53px'
                                        }}
                                        >
                                            <ManifestItemData index={index} field={field} onOpenSerialDialog={openSerialDialog}/>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={handleBackToSearch}>Back</Button>
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
                <SerialNumberDialog 
                    open={serialDialogOpen}
                    onClose={() => setSerialDialogOpen(false)}
                    onSave={handleSaveSerials}
                    initialSerials={activeLine ? activeLine.asset_items : []}
                    maxQty={activeLine ? activeLine.quantity_remaining : 0}
                    productName={activeLine ? activeLine.product_name : ''}
                />
                <ErrorDialog
                    open={errorDialogOpen} 
                    onClose={() => setErrorDialogOpen(false)} 
                    error={submitError}
                    title="Manifest Submission Failed"
                />
            </form>
        </FormProvider>    
    );
}

const Step2_Success = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const submissionResult = location?.state?.manifestSuccessResponse || {}

    return (
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
            <Button variant="outlined" onClick={() => navigate('search')}>Create Another</Button>
        </Paper>
    );
} 

/* The User flow:
(1) Search PO --> (2)
          
(2) Shipment Detail Page
        --> Not Found
        --> PO is cleared
        --> Found PO --> Detail page
(3) Success Page 
        --> create new SM from that PO --> (2)
        --> create new SM from other PO --> (1)

**/

const ProtectedSuccessRoute =({ children }) => {
    const location = useLocation()
    const { po_id } = useParams()
    const isSuccessDataPresent = location?.state?.manifestSuccessResponse

    if (!isSuccessDataPresent) {
        return <Navigate to={`../${po_id}`} replace />;
    }
    return children
}

const ShipmentManifestCreatePage = () => {
    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Create Shipment Manifest</Typography>
            <UrlAwareStepper/>
            <Routes>
                <Route path="*" element={<Navigate to="search" replace />} />
                <Route path = 'search' element={<Step0_POSearch/> }/>
                <Route path = ':po_id' element={<Step1_Details/> }/>
                <Route path = ':po_id/success' element={
                    <ProtectedSuccessRoute>
                        <Step2_Success/>
                    </ProtectedSuccessRoute>
                }/>
            </Routes>
        </Box>
    );
};

export default ShipmentManifestCreatePage;