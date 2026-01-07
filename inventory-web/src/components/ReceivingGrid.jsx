import { useForm, useFieldArray, Controller, FormProvider } from 'react-hook-form';
import { 
    Box, Paper, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TextField, Button, 
    Grid, Divider, Chip, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SerialNumberDialog from './modal/AssetSerialNumberDialog';
import { useState } from 'react';

const ReceivingGrid = ({ manifestData, onSubmit, isSubmitting }) => {

    // State to control the Serial Dialog
    const [serialDialogOpen, setSerialDialogOpen] = useState(false)
    const [activeLineIndex, setActiveLineIndex] = useState(null);
    

    const methods = useForm({
        defaultValues: {
            lines: manifestData.lines.map(line => ({
                ...line,
                // Initialize received asset items with [] or existing received count
                asset_items: [] 
            }))
        }
    });

    const { control, handleSubmit, watch, setValue,  getValues} = methods
    const { fields } = useFieldArray({
        control,
        name: "lines"
    });

    // Helper to calculate totals for the footer
    const watchedLines = watch("lines");

    // Handle open the asset serial dialog
    const openSerialDialog = (index) => {
    setActiveLineIndex(index);
    setSerialDialogOpen(true);
};


    // Save serials from dialog back to form state
    const handleSaveSerials = (newSerials) => {
        console.log(`Handle save dialog with new serial numbers`, newSerials)
        setValue(`lines.${activeLineIndex}.asset_items`, newSerials);
        // Also update the declared quantity to match the serial count
        setValue(`lines.${activeLineIndex}.quantity_input`, newSerials.length); // Later I will get this value in the table
    };

    // total_lines from API is the COUNT of lines, not sum of quantities. 
    // We sum quantity_declared for "Total Expected"
    const totalExpectedQty = manifestData.lines.reduce((acc, line) => acc + (line.quantity_declared || 0), 0);
    const totalScanned = watchedLines.reduce((acc, line) => acc + (Number(line.current_receive_input) || 0), 0);
    const activeLine = activeLineIndex !== null ? getValues(`lines.${activeLineIndex}`) : null;
    return (
        <FormProvider {...methods}>
             <Paper elevation={2} sx={{ p: 3 }}>
            {/* --- HEADER INFO --- */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Manifest #{manifestData.shipment_manifest_id}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Supplier ID: <strong>{manifestData.supplier_id}</strong>
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            PO Reference: <strong>PO-{manifestData.purchase_order_id}</strong>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                        <Chip 
                            label={manifestData.status.toUpperCase()} 
                            color={manifestData.status === 'cancelled' ? 'error' : 'primary'} 
                            variant="outlined" 
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                            Tracking: {manifestData.tracking_number}
                        </Typography>
                        <Typography variant="body2">
                            Carrier: {manifestData.carrier_name}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* --- DATA GRID --- */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Product / SKU</TableCell>
                                <TableCell align="center">Ref ID</TableCell>
                                <TableCell align="right">Declared</TableCell>
                                <TableCell align="right">Previously Received</TableCell>
                                <TableCell align="right">Remaining</TableCell>
                                <TableCell align="center" sx={{ width: 150 }}>Qty Input</TableCell>
                                <TableCell align="right">Receiving Strategy</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.map((line, index) => {
                                console.log(`Mapping data for line ${index}, having asset items: ${JSON.stringify(line)}`)
                                // Watch specific field for validation
                                const currentLineData = watchedLines[index]; 
        
                                // Use currentLineData instead of line for logic and display
                                const assetItems = currentLineData?.asset_items || [];
                                const currentInput = currentLineData?.quantity_input || 0;
                                const remaining = currentLineData?.quantity_remaining || 0;
                                
                                const isOver = Number(currentInput) > remaining;
                                const isComplete = Number(currentInput) === remaining;

                                return (
                                    <TableRow key={line.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {line.product_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {line.supplier_sku}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={line.id} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="500">{currentLineData?.quantity_declared || 0}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="500">{currentLineData?.quantity_received || 0}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="500">{remaining}</Typography>
                                        </TableCell>
                                        
                                        {/* Open Asset Dialog */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                                <Chip label={`${assetItems.length} Assets`} size="small" color={assetItems.length > 0 ? "primary" : "default"} />
                                                <Button
                                                    size="small" variant="outlined" startIcon={<QrCodeIcon />}
                                                    onClick={() => openSerialDialog(index)}
                                                >
                                                    Manage
                                                </Button>
                                            </Box>

                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip 
                                                label={line.receiving_strategy === 'asset_specified' ? 'Specified' : 'Declared'} 
                                                size="small" 
                                                color={line.receiving_strategy === 'asset_specified' ? 'info' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {isOver && (
                                                <Tooltip title="Warning: Count exceeds declared quantity">
                                                    <WarningAmberIcon color="warning" />
                                                </Tooltip>
                                            )}
                                            {isComplete && (
                                                <CheckCircleIcon color="success" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Serial Number Modal */}
                <SerialNumberDialog 
                    open={serialDialogOpen}
                    onClose={() => setSerialDialogOpen(false)}
                    onSave={handleSaveSerials}
                    // Pass the Active Line Data
                    initialSerials={activeLine ? activeLine.asset_items : []}
                    maxQty={activeLine ? activeLine.quantity_remaining : 0}
                    productName={activeLine ? activeLine.product_name : ''}
                    manifestLineId={activeLine ? activeLine.id : ''}
                    receivingStrategy={activeLine ? activeLine.receiving_strategy : 'quantity_declared'}
                />

                {/* --- FOOTER ACTIONS --- */}
                <Paper 
                    elevation={3} 
                    sx={{ 
                        mt: 3, p: 2, bgcolor: '#f8f9fa', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                    }}
                >
                    <Box>
                        <Typography variant="subtitle2">
                            Total Expected: <strong>{totalExpectedQty}</strong>
                        </Typography>
                        <Typography variant="subtitle2">
                            Total Scanned: <strong>{totalScanned}</strong>
                        </Typography>
                    </Box>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        size="large"
                        disabled={isSubmitting || manifestData.status === 'cancelled'}
                        startIcon={<SaveAltIcon />}
                    >
                        {isSubmitting ? 'Processing...' : 'Finalize Receipt'}
                    </Button>
                </Paper>
            </form>
        </Paper>
        </FormProvider>
    );
};

export default ReceivingGrid;