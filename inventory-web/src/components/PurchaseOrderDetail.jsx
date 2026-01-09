 import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    Grid, 
    Chip, 
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton,
    Tooltip,
    IconButton,
    Button, Dialog, DialogTitle, DialogContent, 
    DialogContentText, TextField, DialogActions, CircularProgress,
    useTheme,
    Alert
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// Services
import {PO_DETAIL_ITEMS_CONFIG } from '../services/poService';
import StatusBadge from '../components/status/statusBadge';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit'; // <--- 2. Import Icon

// --- 1. Detail Header (Pure Component - Instant Render) ---
const DetailHeader = ({ headerData, onClose }) => {
    // We map the fields directly as per your PO_COLUMNS_CONFIG keys
    // keys: purchase_order_id, supplier_name, purchase_plan_id, create_user_name, create_date, total_price, status
    const navigate = useNavigate()
    if (!headerData) return null;
    const isDraft = headerData.status === 'Draft';

    return (
        <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e0e0e0', borderRadius: 0 }}>
            {/* The Close Button */}
            <Tooltip title="Back to List">
                    <IconButton 
                        onClick={onClose}
                        sx={{ 
                            mr: 2, 
                            mt: -0.5,
                            color: 'text.secondary' 
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
            {/* Top Row: ID and Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                        Purchase Order
                    </Typography>
                    <Typography variant="h4" fontWeight="800" color="#2c3e50">
                        #{headerData.purchase_order_id}
                    </Typography>
                    {/*EDIT BUTTON (Only for Draft POs) */}
                    {isDraft && (
                        <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/purchase-orders/${headerData.purchase_order_id}/edit`)}
                        >
                            Edit
                        </Button>
                    )}
                </Box>
                <StatusBadge status={headerData.status} />
            </Box>

            {/* Data Grid based on PO_COLUMNS_CONFIG */}
            <Grid container spacing={3}>
                {/* Supplier */}
                <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Supplier Name
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                        {headerData.supplier_name}
                    </Typography>
                </Grid>

                {/* Total Price */}
                <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Total Price
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                        ${parseFloat(headerData.total_price || 0).toLocaleString()}
                    </Typography>
                </Grid>

                {/* Plan ID */}
                <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Plan ID
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body1">
                            {headerData.purchase_plan_id || 'N/A'}
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                </Grid>

                {/* Metadata Row */}
                <Grid item xs={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                            <Typography variant="caption" display="block" color="text.secondary">Created By</Typography>
                            <Typography variant="body2" fontWeight={500}>{headerData.create_user_name || 'System'}</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                            <Typography variant="caption" display="block" color="text.secondary">Creation Date</Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {headerData.create_date ? new Date(headerData.create_date).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

// --- 2. Line Items Table (Smart Component - Fetches its own data) ---
const LineItemsTable = ({ items, loading }) => {
    const theme = useTheme()

    // Loading State
    if (loading && items.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} />
                ))}
            </Box>
        );
    }

    // Empty State
    if (!items || items.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>No line items found for this order.</Typography>
            </Box>
        );
    }

    return (
        <TableContainer 
        component={Box}
        sx ={{
            borderRadius: 2
        }}
        >
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {PO_DETAIL_ITEMS_CONFIG.filter(c => c.isVisible).map((col) => (
                            <TableCell 
                                key={col.key} 
                                align={col.type === 'number' || col.type === 'currency' ? 'right' : 'left'}
                                sx={{ 
                                    bgcolor: `${theme.palette.primary.main}`,
                                    color: `white`,
                                    fontWeight: 'bold', 
                                    fontSize: '0.9rem' 
                                }}
                            >
                                {col.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={item.purchase_order_item_id || index} hover>
                            {PO_DETAIL_ITEMS_CONFIG.filter(c => c.isVisible).map((col) => {
                                const value = item[col.key];
                                
                                // Render logic based on type
                                let displayValue = value;
                                if (col.type === 'currency') {
                                    // Handle 'total_line_amount' calculation if api doesn't send it
                                    if (col.key === 'total_line_amount') {
                                        displayValue = `$${(item.quantity * item.unit_price).toFixed(2)}`;
                                    } else {
                                        displayValue = `$${parseFloat(value || 0).toFixed(2)}`;
                                    }
                                } else if (col.type === 'number') {
                                    displayValue = value;
                                }

                                return (
                                    <TableCell 
                                        key={col.key}
                                        align={col.type === 'number' || col.type === 'currency' ? 'right' : 'left'}
                                    >
                                        {col.key === 'quantity' ? (
                                            <Chip label={displayValue} size="small" variant="outlined" />
                                        ) : (
                                            displayValue
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// PO Approval Footer

const POApprovalFooter = ({ status, onApprove, onReject, onGeneratePDF, isProcessing }) => {
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // --- Derived States ---
    const isPending = status === 'Pending';
    const isIssued = status === 'Issued' || status === 'Open'; // Adjust based on your specific status enum

    // If neither pending nor issued (e.g. Draft), show nothing
    if (!isPending && !isIssued) return null;

    // --- Handlers ---
    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) return; // Prevent empty reasons
        onReject(rejectReason);
        setRejectModalOpen(false);
        setRejectReason("");
    };

    return (
        <>
            {/* STICKY FOOTER CONTAINER */}
            <Paper 
                elevation={6} 
                sx={{ 
                    position: 'sticky', 
                    bottom: 0, 
                    left: 0, 
                    right: 0,
                    p: 2, 
                    borderTop: '1px solid #e0e0e0',
                    zIndex: 10
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, maxWidth: 1200, mx: 'auto' }}>
                    
                    {/* STATE: PENDING APPROVAL */}
                    {isPending && (
                        <>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                startIcon={<CancelIcon />}
                                onClick={() => setRejectModalOpen(true)}
                                disabled={isProcessing}
                            >
                                Reject
                            </Button>
                            <Button 
                                variant="contained" 
                                color="success" 
                                startIcon={isProcessing ? <CircularProgress size={20} color="inherit"/> : <CheckCircleIcon />}
                                onClick={onApprove}
                                disabled={isProcessing}
                            >
                                Approve PO
                            </Button>
                        </>
                    )}

                    {/* STATE: ISSUED (PDF GENERATION) */}
                    {isIssued && (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={isProcessing ? <CircularProgress size={20} color="inherit"/> : <PictureAsPdfIcon />}
                            onClick={onGeneratePDF}
                            disabled={isProcessing}
                            aria-label="Download PDF"
                        >
                            {isProcessing ? "Generating..." : "Download PDF"}
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* REJECT REASON MODAL */}
            <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Purchase Order</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Please provide a reason for rejecting this order. This will be sent to the requester.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="reason"
                        label="Rejection Reason"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        error={rejectReason.length > 0 && rejectReason.trim().length === 0}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectModalOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleRejectSubmit} color="error" variant="contained">
                        Confirm Rejection
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// --- 3. Main Container (The Orchestrator) ---
const PODetailView = ({ 
    header, 
    items, 
    itemsLoading, 
    onClose, 
    onApprove, 
    onReject, 
    onGeneratePDF, 
    isProcessing }) => {
    // Scenario 1: No PO selected (e.g. initial load of master-detail)
    if (!header || !items) {
        return (
            <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                bgcolor: '#f8f9fa',
                color: 'text.secondary',
                flexDirection: 'column'
            }}>
                <InventoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
                <Typography variant="h6">No Purchase Order Selected</Typography>
                <Typography variant="body2">Select an item from the list to view details.</Typography>
            </Box>
        );
    }

    // Scenario 2: PO Selected
    const isIssued = header?.status === 'Issued' || header?.status === 'Open';

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white', position: 'relative' }}>
            
            {/* WATERMARK BACKGROUND */}
            {isIssued && (
                <Box sx={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                    fontSize: '8rem',
                    fontWeight: 'bold',
                    color: 'rgba(0, 128, 0, 0.05)', // Very faint green
                    pointerEvents: 'none', // Allow clicking through it
                    zIndex: 0,
                    userSelect: 'none'
                }}>
                    ISSUED
                </Box>
            )}

            <DetailHeader headerData={header} onClose={onClose} />
            <Divider />
            
            <Box sx={{ flexGrow: 1, overflow: 'auto', zIndex: 1 }}>
                <Typography variant="subtitle2" sx={{ p: 2, bgcolor: '#fafafa', color: 'text.secondary', fontWeight: 'bold' }}>
                    LINE ITEMS
                </Typography>
                <LineItemsTable items={items} loading={itemsLoading} />
            </Box>

            {/* ACTION FOOTER */}
            <POApprovalFooter 
                status={header?.status}
                onApprove={onApprove}
                onReject={onReject}
                onGeneratePDF={onGeneratePDF}
                isProcessing={isProcessing}
            />
        </Box>
    );
};

export default PODetailView;