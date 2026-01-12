import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
    Box, 
    Typography, 
    Button, 
    TablePagination, 
    Paper, 
    Alert, 
    useTheme,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';

import FilterBar from '../components/table/filterBar';
import ServerSideTable from '../components/table/poTable';
import { 
    PO_COLUMNS_CONFIG, 
    getInitialVisibleKeys, 
    getVisibleColumnsConfig, 
    fetchPurchaseOrders 
} from '../services/poService';
import { usePoUrlState } from '../hooks/PurchaseOrder/usePoUrlsState';

const PurchaseOrderList = ({ isCompact }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id: selectedId } = useParams();
    const { 
        filterState, 
        setFilterState, 
        paginationState, 
        setPaginationState 
    } = usePoUrlState();

    // Column visibility state
    const [visibleKeys, setVisibleKeys] = useState(
        isCompact 
        ? ['purchase_order_id', 'status', 'total_price'] 
        : getInitialVisibleKeys()
    );

    useEffect(() => {
        setVisibleKeys(
            isCompact 
            ? ['purchase_order_id', 'status', 'total_price'] 
            : getInitialVisibleKeys()
        );
    }, [isCompact]);

    // Data fetching logic
    const { data: queryResult, isLoading, isError, error } = useQuery({
        queryKey: ['purchaseOrders', paginationState, filterState],
        queryFn: () => fetchPurchaseOrders(paginationState, filterState),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false 
    });

    const poData = queryResult?.data || [];
    const meta = queryResult?.meta || { total_records: 0 };    
    
    const finalTableColumns = useMemo(() => 
        getVisibleColumnsConfig(visibleKeys), 
        [visibleKeys]
    );

    const columnsConfigForFilterTable = PO_COLUMNS_CONFIG.map(
          col => ({
          ...col,
          isVisible: visibleKeys.includes(col.key)
      }))

    return (
        <Box sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'transparent',
          }}> {/* Outer Page Container */}
            
            {/* 1. Page Title */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="700" color="text.primary">
                    {isCompact ? "Orders" : "Purchase Order List"}
                </Typography>
            </Box>

            {/* 2. Unified Action Bar (Button + Filters) */}
            {/* This Paper container stays visible even in compact mode, preventing jumps */}
            <Paper 
                elevation={0}
                sx={{ 
                    mb: 3, 
                    p: 1, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: `${theme.palette.background.paper}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    // Ensure the container has a minimum height so it doesn't collapse
                    minHeight: '72px',
                    height: '72px',
                    overflow: 'hidden', 
                    whiteSpace: 'nowrap'
                }}
            >
                {/* Create Button - Always Visible */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('create')}
                    size="medium"
                    sx={{ 
                        whiteSpace: 'nowrap', 
                        flexShrink: 0 
                    }} 
                >
                    "Create New PO"
                </Button>

                {/* Filters - Only Visible in Full View */}
                {!isCompact && (
                    <>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        
                        {/* Enable two Box to wrap the filterBar */}
                        {/* Box 1: act as the mask wrapper, handle the actual animated width */}
                        <Box sx={{ 
                            flexGrow: 1,
                            overflow: 'hidden', // Clip the content that hasn't been revealed yet
                            animation: 'fadeIn 0.5s ease-in-out',
                                '@keyframes fadeIn': {
                                    '0%': { opacity: 0 },
                                    '50%': { opacity: 0 }, // Stay invisible for first half of slide
                                    '100%': { opacity: 1 }
                                }
                        }}>
                            {/* Ignores the animation size, set a min size of 800px to prevent the filter bar's children perform wrap space and affect the height */}
                            <Box 
                            sx={{ 
                                flexGrow: 1, 
                                minWidth: '800px',

                                 }}>
                                <FilterBar 
                                    allColumnsConfig={columnsConfigForFilterTable}
                                    onStatusChange={(status) => setFilterState(prev => ({ ...prev, status, page: 1 }))}
                                    onSupplierChange={(vendor_id) => setFilterState(prev => ({ ...prev, vendor_id, page: 1 }))}
                                    initialStatus={filterState?.status}
                                    initialSupplierId={filterState?.vendor_id}
                                    suppliers={queryResult?.meta.suppliers || []}
                                    statuses={queryResult?.meta.statuses || []}
                                    onColumnToggle={setVisibleKeys}
                                />
                            </Box>
                        </Box>
                        
                    </>
                )}
            </Paper>
                    
            {/* Error Display */}
            {isError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error?.message || "Unable to load purchase orders."}
                </Alert>
            )}

            {/* 3. Main Table Content Section */}
            <Paper 
                elevation={3} 
                sx={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    bgcolor: 'transparent',
                    flexGrow: 1, 
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Table Area */}
                <Paper 
                elevation={0}
                sx={{ 
                    minHeight: 0,       // Allow shrinking
                    flexGrow: 0, 
                    overflow: 'hidden', // Force scroll management to the child
                    
                    // --- THE CRITICAL FIX ---
                    display: 'flex',       
                    flexDirection: 'column',
                    borderRadius: 2
                    }}>
                    <ServerSideTable 
                        data={poData}
                        limit={paginationState.limit}
                        loading={isLoading}
                        columnsConfig={finalTableColumns}
                        onRowClick={(poItem) => navigate(`/purchase-orders/${poItem.purchase_order_id}`)}
                        selectedId={selectedId}
                    />
                </Paper>

                {/* Pagination Area */}
                <Box 
                sx={{ 
                    p: 1, 
                    borderTop: `1px solid ${theme.palette.divider}`, 
                    bgcolor: `${theme.palette.background.paper}` 
                    }}>
                    <TablePagination
                        component="div"
                        count={meta.total_records}
                        page={paginationState.page - 1}
                        onPageChange={(event, newPage) => setPaginationState(prev => ({ ...prev, page: newPage + 1 }))}
                        rowsPerPage={paginationState.limit}
                        onRowsPerPageChange={(event) => {
                            setPaginationState(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }));
                        }}
                        rowsPerPageOptions={[10, 20, 50]}
                        sx= {{
                        '& .MuiTablePagination-displayedRows': {
                        // 1. Force all numbers to be equal width (like code font)
                        fontVariantNumeric: 'tabular-nums', 
                        
                        // 2. Reserve specific space so it doesn't shrink/grow
                        minWidth: '100px', 
                        textAlign: 'right' 
                    }
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default PurchaseOrderList;