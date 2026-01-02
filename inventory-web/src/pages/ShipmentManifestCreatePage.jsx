import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Box, Typography, Paper, Grid, TextField, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Stepper, Step, StepLabel, CircularProgress, Alert, Divider,
    Select, MenuItem, FormControl, IconButton, Chip, Dialog, DialogTitle, 
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction
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


import ErrorDialog from '../components/common/ErrorDialog';
import { fetchPOContext, submitManifest } from '../services/smServices';

const steps = ['Select Purchase Order', 'Enter Shipment Details', 'Confirmation'];


// --- Sub-Component: Serial Number Manager Dialog ---
const SerialNumberDialog = ({ open, onClose, onSave, initialSerials = [], maxQty, productName }) => {
    const [currentSerial, setCurrentSerial] = useState("");
    const [serials, setSerials] = useState(initialSerials);

    // Reset local state when dialog opens with new data
    useEffect(() => {
        if (open) setSerials(initialSerials);
    }, [open]);

    const handleAdd = () => {
        if (!currentSerial.trim()) return;
        if (serials.some(s => s.serial_number === currentSerial)) return; // Prevent dupes
        if (serials.length >= maxQty) return; // Prevent over-shipping

        setSerials([...serials, { serial_number: currentSerial.trim() }]);
        setCurrentSerial("");
    };

    const handleDelete = (index) => {
        const newSerials = [...serials];
        newSerials.splice(index, 1);
        setSerials(newSerials);
    };

    const handleSave = () => {
        onSave(serials);
        onClose();
    };

    console.log(`Current serial number`, serials )
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Specify Assets for {productName}</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField 
                        fullWidth 
                        label="Scan/Enter Serial Number" 
                        value={currentSerial}
                        onChange={(e) => setCurrentSerial(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        disabled={serials.length >= maxQty}
                        helperText={`${serials.length} / ${maxQty} assets added`}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAdd}
                        disabled={!currentSerial || serials.length >= maxQty}
                    >
                        Add
                    </Button>
                </Box>
                
                {serials.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                        No serial numbers added yet.
                    </Typography>
                ) : (
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                        {serials.map((item, idx) => (
                            <ListItem key={idx} divider>
                                <ListItemText primary={item.serial_number} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" size="small" onClick={() => handleDelete(idx)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save Assets</Button>
            </DialogActions>
        </Dialog>
    );
};

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
            {/* Changed to LocalShipping for a "Logistics" feel rather than "Final Completion" */}
            <LocalShippingIcon color="info" sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
            
            <Typography variant="h5" gutterBottom fontWeight="bold" color="text.primary">
                Manifest Complete for PO #{poId}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                All items from this Purchase Order have been assigned to shipment manifests. 
                There are no remaining quantities available to manifest at this time.
            </Typography>

            {/* Added QC Disclaimer */}
            <Box sx={{ 
                textAlign: 'left', 
                bgcolor: '#fff4e5', // Light warning/info color
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
                variant="outlined" // Outlined feels less "final" than contained
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
const ShipmentManifestCreatePage = () => {

    const location = useLocation()

    const smCreationResult = location?.state?.submissionResult

    const [activeStep, setActiveStep] = useState(0) // Global state to track the current step, other child component will update this active step

    // --- Handlers ---

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
    };

    // --- Render Steps ---

    const renderStep0_POSearch = () => {

        const [searchParams, setSearchParams] = useSearchParams()

        const [poInput, setPoInput] = useState();

        const setSelectedPOId = (newId) => {
          if (newId) {
            setSearchParams({ po_id: newId });
        } else {
            setSearchParams({});
        }
        };

        const handlePOSearch = () => {
            if (poInput) setSelectedPOId(poInput);
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
                    startIcon={poLookupMutation.isPending ? <CircularProgress size={20} color="inherit"/> : <SearchIcon />}
                    onClick={handlePOSearch}
                    disabled={poLookupMutation.isPending} // The Find button is disabled when there the po lookup is performed
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && selectedPOId && !poLookupMutation.isPending) {
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

    const renderStep1_Details = ({
    }
    ) => {

        // Dialog State
        const [serialDialogOpen, setSerialDialogOpen] = useState(false);
        const [activeLineIndex, setActiveLineIndex] = useState(null);

        // Error State
        const [errorDialogOpen, setErrorDialogOpen] = useState(false);
        const [submitError, setSubmitError] = useState(null);

        // --- Form Setup ---
        const { control, handleSubmit, register, watch, setValue, reset, getValues, formState: { errors } } = useForm({
            defaultValues: {
                tracking_number: '',
                carrier_name: '',
                estimated_arrival: '',
                lines: [] 
            }
        });

        const { fields } = useFieldArray({ control, name: 'lines' });


        // Current PO params
        const [searchParams, setSearchParams] = useSearchParams();
        const selectedPOId = searchParams.get('po_id') || '';

        // Pass submission result to step 2
        const navigate = useNavigate();

        // --- Mutation: Fetch PO Context ---
        const {
            data: poContext,
            isSuccess: isFetchingPOContextSuccess,
            error: fetchingPOContextError,
            isError: isFetchingPOContextError,
            isLoading: isFetchingPOContextLoading
        } = useQuery({
            queryFn: () => fetchPOContext(selectedPOId),
            queryKey: selectedPOId
    });

        // 2. Handle the "Cleared" state as Derived State (No useEffect needed for this!)
        const shippableLines = useMemo(() => {
        if (!poContext?.items) return [];
        return poContext.items
            .filter(item => item.quantity_remaining > 0)
            .map(item => ({
            purchase_order_item_id: item?.purchase_order_item_id,
            product_id: item?.product_id,
            product_name: item?.product_name,
            max_qty: item?.quantity_remaining,
            supplier_sku: item.item_description,
            quantity_declared: item.quantity_remaining,
            supplier_serial_number: ""
            }));
        }, [poContext]);

        const isPOClear = poContext && shippableLines.length === 0;

        // 3. Handle the FORM RESET as a Side Effect
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
        
        // Error Handling: Set Not Found state
        const isPONotFound = isFetchingPOContextError

        const handleBackToSearch = () => {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('po_id')
            setSearchParams(newParams)
        } // Handle clear the po_id which navigate the page back to step0


        // --- Mutation: Submit Manifest ---
        const submitManifestMutation = useMutation({
            mutationFn: submitManifest,
            onSuccess: (data) => {
                navigate('/manifest/success', { state: { manifestSuccessResponse: data } })

            },
            onError: (error) => {
                // Capture the error object and open the dialog
                setSubmitError(error)
                setErrorDialogOpen(true)
            }
        })
                // Handle onSubmit to create new Shipment Manifest
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

                // Conditional Payload based on Flow
                if (line.shipment_mode === 'asset_specified') {
                    return {
                        ...baseLine,
                        asset_items: line.asset_items // Array of { serial_number }
                    };
                } else {
                    // Flow: quantity_declared
                    return {
                        ...baseLine,
                        quantity: Number(line.quantity_declared) // API expects 'quantity' for this mode
                    };
                }
            })
        };
        
        console.log("Submitting Payload:", payload);
        submitManifestMutation.mutate(payload);
    };

        // Rendering logic when already haved data
        if (isPONotFound) return (
        <PONotFoundPage poId={selectedPOId} onBack={handleBackToSearch} />
    )

        if (isPOClear) {
                return <POClearPage poId={selectedPOId} onBack={handleBackToSearch} />;
            }
        
        // 1. Loading Guard (The "Pre-check" you requested)
        if (isFetchingPOContextLoading && selectedPOId) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>Loading Order Context...</Typography>
                </Box>
            );
        }


        return (
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
                                            {/* UPDATED: DateTimePicker with Controller */}
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
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fafafa' }}>
                                <TableCell width="25%">Product</TableCell>
                                <TableCell width="15%">Supplier SKU</TableCell>
                                <TableCell width="15%">Serial #</TableCell> {/* New Column */}

                                <TableCell width="15%">Pending</TableCell>
                                <TableCell width="20%">Mode</TableCell>
                                <TableCell width="25%" align="right">Shipment Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.map((field, index) => {
                                const max = field.max_qty;
                                const mode = watch(`lines.${index}.shipment_mode`);
                                const assets = watch(`lines.${index}.asset_items`) || [];
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
                                        {/* New Serial Number Input */}
                                        <TableCell>
                                            <TextField 
                                                variant="standard" 
                                                fullWidth 
                                                placeholder="Required"
                                                {...register(`lines.${index}.supplier_serial_number`, { required: "Required" })}
                                                error={!!errors.lines?.[index]?.supplier_serial_number}
                                            />
                                        </TableCell>
                                        <TableCell align="right">{max}</TableCell>
                                        <TableCell>
                                            <Controller
                                                name={`lines.${index}.shipment_mode`}
                                                control={control}
                                                render={({ field: selectField }) => (
                                                    <Select {...selectField} size="small" fullWidth variant="standard">
                                                        <MenuItem value="quantity_declared">Qty Declared</MenuItem>
                                                        <MenuItem value="asset_specified">Specify Assets</MenuItem>
                                                    </Select>
                                                )}
                                            />
                                        </TableCell>
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
                                                    <Chip label={`${assets.length} Assets`} size="small" color={assets.length > 0 ? "primary" : "default"} />
                                                    <Button 
                                                        size="small" variant="outlined" startIcon={<QrCodeIcon />}
                                                        onClick={() => openSerialDialog(index)}
                                                    >
                                                        Manage
                                                    </Button>
                                                    {/* Hidden input to enforce validation if needed */}
                                                    <input type="hidden" value={assets.length} {...register(`lines.${index}.quantity_declared`, { min: 1 })} />
                                                </Box>
                                            )}
                                        </TableCell>
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
            {/* Serial Number Modal */}
            <SerialNumberDialog 
                open={serialDialogOpen}
                onClose={() => setSerialDialogOpen(false)}
                onSave={handleSaveSerials}
                initialSerials={activeLineIndex !== null ? getValues(`lines.${activeLineIndex}.asset_items`) : []}
                maxQty={activeLineIndex !== null ? getValues(`lines.${activeLineIndex}.max_qty`) : 0}
                productName={activeLineIndex !== null ? getValues(`lines.${activeLineIndex}.product_name`) : ''}
            />
            {/* Error Dialog */}
            <ErrorDialog 
                open={errorDialogOpen} 
                onClose={() => setErrorDialogOpen(false)} 
                error={submitError}
                title="Manifest Submission Failed"
            />
        </form>
    );

    }

    const renderStep2_Success = ({
        submissionResult
    }) => {

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
            <Button variant="outlined" onClick={() => window.location.reload()}>Create Another</Button>
        </Paper>
    );

    } 
    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Create Shipment Manifest</Typography>
            {!isPOClear && (
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                </Stepper>
            )}

            {activeStep === 0 && renderStep0_POSearch()}
            {/* Just need to know current activeStep to render step 1 */}
            {activeStep === 1 && renderStep1_Details()} 
            {activeStep === 2 && renderStep2_Success()}

        </Box>
    );
};





export default ShipmentManifestCreatePage;