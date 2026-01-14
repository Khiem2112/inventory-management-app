import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { 
    Box, Paper, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, 
    Grid, Divider, Chip, Tooltip, Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SerialNumberDialog from './modal/AssetSerialNumberDialog';
import { useState } from 'react';

const ReceivingGrid = ({ manifestData, onSubmit, isSubmitting }) => {

    const [serialDialogOpen, setSerialDialogOpen] = useState(false)
    const [activeLineIndex, setActiveLineIndex] = useState(null);
    
    const methods = useForm({
        defaultValues: {
            lines: manifestData.lines.map(line => ({
                ...line,
                asset_items: [] 
            }))
        }
    });

    const { control, handleSubmit, watch, setValue, getValues} = methods
    const { fields } = useFieldArray({
        control,
        name: "lines"
    });

    const watchedLines = watch("lines");

    const openSerialDialog = (index) => {
        setActiveLineIndex(index);
        setSerialDialogOpen(true);
    };

    const handleSaveSerials = (newSerials) => {
        setValue(`lines.${activeLineIndex}.asset_items`, newSerials);
        setValue(`lines.${activeLineIndex}.quantity_input`, newSerials.length); 
        setSerialDialogOpen(false)
    };

    const totalExpectedQty = manifestData.lines.reduce((acc, line) => acc + (line.quantity_declared || 0), 0);
    const totalScanned = watchedLines.reduce((acc, line) => acc + (Number(line.current_receive_input) || 0), 0);
    const activeLine = activeLineIndex !== null ? getValues(`lines.${activeLineIndex}`) : null;

    return (
        <FormProvider {...methods}>
             {/* 1. OUTER CONTAINER: Flex Column, 100% Height */}
             <Paper 
                elevation={2} 
                sx={{ 
                    p: 3, 
                    bgcolor: 'background.paper',
                    height: '100%',            // Fill parent height
                    display: 'flex',           // Enable Flexbox
                    flexDirection: 'column',   // Stack children vertically
                    overflow: 'hidden'         // Prevent outer scrollbars
                }}
            >
                {/* --- HEADER INFO (Fixed at Top) --- */}
                <Box sx={{ mb: 3, flexShrink: 0 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Manifest #{manifestData.shipment_manifest_id}
                            </Typography>
                            <Stack spacing={0.5}>
                                <Typography variant="body1" color="text.secondary">
                                    Supplier ID: <strong>{manifestData.supplier_id}</strong>
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    PO Reference: <strong>PO-{manifestData.purchase_order_id}</strong>
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                            <Chip 
                                label={manifestData.status.toUpperCase()} 
                                color={manifestData.status === 'cancelled' ? 'error' : 'primary'} 
                                variant="outlined" 
                                sx={{ mb: 1 }}
                            />
                            <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                                <Typography variant="body2">
                                    Tracking: {manifestData.tracking_number}
                                </Typography>
                                <Typography variant="body2">
                                    Carrier: {manifestData.carrier_name}
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ mb: 3, flexShrink: 0 }} />

                {/* --- DATA GRID & FOOTER --- */}
                {/* 2. FORM WRAPPER: Flex Column, Fills remaining space */}
                <Box 
                    component="form" 
                    onSubmit={handleSubmit(onSubmit)}
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        flexGrow: 1,      // Take all remaining vertical space
                        minHeight: 0      // CRITICAL: Allows children to scroll
                    }}
                >
                    {/* 3. TABLE CONTAINER: Scrolls independently */}
                    <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product / SKU</TableCell>
                                    <TableCell align="center">Ref ID</TableCell>
                                    <TableCell width="25%">Receiving Progress</TableCell>
                                    <TableCell align="center" sx={{ width: 150 }}>Qty Input</TableCell>
                                    <TableCell align="right">Receiving Strategy</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fields.map((line, index) => {
                                    // ... [Table Logic Unchanged] ...
                                    const currentLineData = watchedLines[index]; 
                                    const assetItems = currentLineData?.asset_items || [];
                                    const currentInput = currentLineData?.quantity_input || 0;
                                    const declared = currentLineData?.quantity_declared || 0;
                                    const received = currentLineData?.quantity_received || 0;
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
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <ManifestLineProgress 
                                                        declared={declared} 
                                                        received={received} 
                                                        remaining={remaining} 
                                                    />
                                                    {/* Optional: Small text below bar for quick reference */}
                                                    <Typography variant="caption" color="text.secondary" align="center">
                                                        {received} received / {remaining} remaining
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
                                                    <Chip label={`${assetItems.length} Assets`} size="small" color={assetItems.length > 0 ? "primary" : "default"} />
                                                    <Button
                                                        size="small" variant="outlined" startIcon={<QrCodeIcon />}
                                                        onClick={() => openSerialDialog(index)}
                                                    >
                                                        Manage
                                                    </Button>
                                                </Stack>
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
                        initialSerials={activeLine ? activeLine.asset_items : []}
                        maxQty={activeLine ? activeLine.quantity_remaining : 0}
                        productName={activeLine ? activeLine.product_name : ''}
                        manifestLineId={activeLine ? activeLine.id : ''}
                        receivingStrategy={activeLine ? activeLine.receiving_strategy : 'quantity_declared'}
                    />

                    {/* --- FOOTER ACTIONS (Sticky at Bottom) --- */}
                    {/* 4. FOOTER: No flexGrow, so it sits at bottom */}
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            mt: 2, // Slight gap from table
                            p: 2, 
                            bgcolor: 'background.default', 
                            flexShrink: 0, // Prevent footer from collapsing
                            justifySelf: 'flex-end'
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
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
                        </Stack>
                    </Paper>
                </Box>
            </Paper>
        </FormProvider>
    );
};

export default ReceivingGrid;


const ManifestLineProgress = ({ declared, received, remaining }) => {
    // Safety check to avoid division by zero
    const total = declared || 1; 
    
    // Calculate percentages for width
    // We clamp values to ensure visual stability (e.g., if received > declared)
    const receivedPercent = Math.min(100, Math.max(0, (received / total) * 100));
    const remainingPercent = Math.min(100, Math.max(0, (remaining / total) * 100));

    return (
        <Box sx={{ width: '100%', height: 24, display: 'flex', borderRadius: 1, overflow: 'hidden', bgcolor: '#eee' }}>
            
            {/* GREEN SECTION: Received */}
            <Tooltip title={`${received}/${declared} has been received`} arrow>
                <Box 
                    sx={{ 
                        width: `${receivedPercent}%`, 
                        bgcolor: '#4caf50', // Green
                        cursor: 'pointer',
                        transition: 'width 0.3s ease',
                        '&:hover': { opacity: 0.9 }
                    }} 
                />
            </Tooltip>

            {/* ORANGE SECTION: Remaining */}
            <Tooltip title={`${remaining}/${declared} is remaining`} arrow>
                <Box 
                    sx={{ 
                        flexGrow: 1, // Takes up the rest of the space
                        bgcolor: '#ff9800', // Orange
                        cursor: 'pointer',
                        transition: 'width 0.3s ease',
                        '&:hover': { opacity: 0.9 }
                    }} 
                />
            </Tooltip>
        </Box>
    );
};