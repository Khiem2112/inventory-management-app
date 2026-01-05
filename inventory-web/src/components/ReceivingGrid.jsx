import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
    Box, Paper, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TextField, Button, 
    Grid, Divider, Chip, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

const ReceivingGrid = ({ manifestData, onSubmit, isSubmitting }) => {
    const { control, handleSubmit, watch } = useForm({
        defaultValues: {
            lines: manifestData.lines.map(line => ({
                ...line,
                // Initialize input with 0 or existing received count
                current_receive_input:  0 
            }))
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "lines"
    });

    // Helper to calculate totals for the footer
    const watchedLines = watch("lines");
    // total_lines from API is the COUNT of lines, not sum of quantities. 
    // We sum quantity_declared for "Total Expected"
    const totalExpectedQty = manifestData.lines.reduce((acc, line) => acc + (line.quantity_declared || 0), 0);
    const totalScanned = watchedLines.reduce((acc, line) => acc + (Number(line.current_receive_input) || 0), 0);

    return (
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
                                <TableCell align="right" sx={{ width: 150 }}>Qty Input</TableCell>
                                <TableCell align="right">Receiving Strategy</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.map((line, index) => {
                                // Watch specific field for validation
                                const currentInput = watch(`lines.${index}.current_receive_input`);
                                const declared = line.quantity_declared;
                                const prev_received = line.quantity_received;
                                const remaining = line.quantity_remaining;
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
                                            <Typography fontWeight="500">{declared}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="500">{prev_received}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="500">{remaining}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Controller
                                                name={`lines.${index}.current_receive_input`}
                                                control={control}
                                                rules={{ required: true, min: 0 }}
                                                render={({ field }) => (
                                                    <TextField
                                                        {...field}
                                                        type="number"
                                                        size="small"
                                                        error={isOver}
                                                        helperText={isOver ? `+${Number(currentInput) - remaining}` : ''}
                                                        InputProps={{
                                                            inputProps: { min: 0, style: { textAlign: 'right' } }
                                                        }}
                                                        sx={{ 
                                                            bgcolor: isOver ? '#fff4e5' : 'transparent',
                                                            '& .MuiOutlinedInput-root': {
                                                                '& fieldset': {
                                                                    borderColor: isOver ? 'warning.main' : 'inherit',
                                                                },
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="500">{line.receiving_strategy || "Unknown strategy"}</Typography>
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
    );
};

export default ReceivingGrid;