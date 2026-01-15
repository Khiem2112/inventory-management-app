import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { 
    Box, Paper, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Button, 
    Grid, Divider, Chip, Tooltip, Stack, IconButton
} from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SerialNumberDialog from './modal/AssetSerialNumberDialog';
import { useState } from 'react';

// --- COMPONENT: Manifest Line Progress ---
const ManifestLineProgress = ({ declared, received, accepted, rejected }) => {
    const total = declared || 1; 

    const receivedPercent = Math.min(100, (received / total) * 100);
    const acceptedPercent = Math.min(100, (accepted / total) * 100);
    const rejectedPercent = Math.min(100, (rejected / total) * 100);
    
    const remainingCount = Math.max(0, declared - received - accepted);
    const remainingPercent = Math.min(100, (remainingCount / total) * 100);

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ 
                width: '100%', height: 24, display: 'flex', 
                borderRadius: 1, overflow: 'hidden', bgcolor: '#f5f5f5', border: '1px solid #e0e0e0'
            }}>
                {received > 0 && (
                    <Tooltip title={`${received} Historically Received`}>
                        <Box sx={{ width: `${receivedPercent}%`, bgcolor: 'primary.light' }} />
                    </Tooltip>
                )}
                {accepted > 0 && (
                    <Tooltip title={`${accepted} Accepted (Current Session)`}>
                        <Box sx={{ width: `${acceptedPercent}%`, bgcolor: 'success.light', cursor: 'pointer' }} />
                    </Tooltip>
                )}
                {remainingCount > 0 && (
                    <Tooltip title={`${remainingCount} Remaining`}>
                        <Box sx={{ width: `${remainingPercent}%`, bgcolor: 'pending.light' }} />
                    </Tooltip>
                )}
                {rejected > 0 && (
                    <Tooltip title={`${rejected} Rejected`}>
                        <Box sx={{ width: `${rejectedPercent}%`, bgcolor: 'error.light' }} />
                    </Tooltip>
                )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, fontSize: '0.7rem', color: 'text.secondary' }}>
                <span>{received} Rec</span>
                <span style={{ color: '#fbc02d', fontWeight: 'bold' }}>{accepted} Acc</span>
                <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{rejected} Rej</span>
                <span>{remainingCount} Rem</span>
            </Box>
        </Box>
    );
};

const ReceivingGrid = ({ manifestData, onSubmit, isSubmitting }) => {

    const [serialDialogOpen, setSerialDialogOpen] = useState(false)
    const [activeLineIndex, setActiveLineIndex] = useState(null);
    
    const methods = useForm({
        defaultValues: {
            lines: manifestData.lines.map(line => ({
                ...line,
                asset_items: line.asset_items || [] 
            }))
        }
    });

    const { control, handleSubmit, watch, setValue } = methods
    const { fields } = useFieldArray({ control, name: "lines" });
    const watchedLines = watch("lines");

    const openSerialDialog = (index) => {
        setActiveLineIndex(index);
        setSerialDialogOpen(true);
    };

    const handleSaveSerials = (updatedAssets) => {
        setValue(`lines.${activeLineIndex}.asset_items`, updatedAssets);
        const acceptedCount = updatedAssets.filter(a => a.isAccepted).length;
        setValue(`lines.${activeLineIndex}.quantity_input`, acceptedCount);
        setSerialDialogOpen(false)
    };

    const totalExpected = watchedLines.reduce((acc, line) => acc + (line.quantity_declared || 0), 0);
    const totalAccepted = watchedLines.reduce((acc, line) => {
        const assets = line.asset_items || [];
        return acc + assets.filter(a => a.isAccepted === true).length;
    }, 0);

    return (
        <FormProvider {...methods}>
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* --- HEADER --- */}
                <Box sx={{ p: 3, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.main' }}>
                                    <Inventory2OutlinedIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        {manifestData.manifest_code || "New Manifest"}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            Supplier: <strong>{manifestData.supplier_name}</strong>
                                        </Typography>
                                        <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
                                        <Chip 
                                            label={manifestData.status || 'Draft'} 
                                            size="small" 
                                            color={manifestData.status === 'received' ? 'success' : 'default'} 
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent={{ md: 'flex-end' }} sx={{ color: 'text.secondary' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocalShippingOutlinedIcon fontSize="small" />
                                    <Box>
                                        <Typography variant="caption" display="block">Tracking Ref</Typography>
                                        <Typography variant="body2" color="text.primary">{manifestData.tracking_number || "N/A"}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DescriptionOutlinedIcon fontSize="small" />
                                    <Box>
                                        <Typography variant="caption" display="block">PO Number</Typography>
                                        <Typography variant="body2" color="text.primary">{manifestData.po_number || "N/A"}</Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                {/* --- TABLE CONTAINER (Controls Vertical Scroll) --- */}
                <TableContainer sx={{ maxHeight: '65vh', overflowX: 'auto' }}>
                    <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width="25%">Product Details</TableCell>
                                <TableCell width="20%" align="center">Ref ID</TableCell>
                                <TableCell width="30%">Receiving Progress</TableCell>
                                <TableCell width="15%" align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fields.map((line, index) => {
                                const currentLineData = watchedLines[index];
                                const declared = currentLineData?.quantity_declared || 0;
                                const received = currentLineData?.quantity_received || 0;
                                const assets = currentLineData?.asset_items || [];
                                const acceptedCount = assets.filter(a => a.isAccepted === true).length;
                                const rejectedCount = assets.filter(a => a.isAccepted === false).length;

                                return (
                                    <TableRow key={line.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" noWrap title={line.product_name}>
                                                {line.product_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {line.supplier_sku}
                                            </Typography>
                                        </TableCell>
                                        
                                        {/* --- REF ID COLUMN (Auto Scroll, Hidden Scrollbar) --- */}
                                        <TableCell align="center">
                                            <Box sx={{ 
                                                width: '100%', 
                                                overflowX: 'auto', 
                                                whiteSpace: 'nowrap',
                                                scrollbarWidth: 'none',  /* Firefox */
                                                '&::-webkit-scrollbar': { display: 'none' } /* Chrome/Safari */
                                            }}>
                                                <Chip label={line.id} size="small" variant="outlined" />
                                            </Box>
                                        </TableCell>
                                        
                                        <TableCell>
                                            <ManifestLineProgress 
                                                declared={declared}
                                                received={received}
                                                accepted={acceptedCount}
                                                rejected={rejectedCount}
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                onClick={() => openSerialDialog(index)}
                                            >
                                                Assets ({assets.length})
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* --- FOOTER --- */}
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={3}>
                            <Typography variant="subtitle2">
                                Total Declared: <Typography component="span" fontWeight="bold">{totalExpected}</Typography>
                            </Typography>
                            <Typography variant="subtitle2">
                                Total Accepted: <Typography component="span" fontWeight="bold" color="success.main">{totalAccepted}</Typography>
                            </Typography>
                        </Stack>
                        
                        <Button 
                            variant="contained" 
                            startIcon={<SaveAltIcon />}
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            sx={{ px: 4 }}
                        >
                            Finalize Receipt
                        </Button>
                    </Stack>
                </Box>

                {activeLineIndex !== null && (
                    <SerialNumberDialog
                        open={serialDialogOpen}
                        onClose={() => setSerialDialogOpen(false)}
                        onSave={handleSaveSerials}
                        initialSerials={watchedLines[activeLineIndex]?.asset_items || []}
                        receivingStrategy={watchedLines[activeLineIndex]?.receiving_strategy} 
                        manifestLineId={watchedLines[activeLineIndex]?.id}
                        productName={watchedLines[activeLineIndex]?.product_name}
                        maxQty={watchedLines[activeLineIndex]?.quantity_remaining}
                    />
                )}
            </Paper>
        </FormProvider>
    );
};

export default ReceivingGrid;