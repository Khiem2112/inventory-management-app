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
                    minHeight: '72px' 
                }}
            >
                {/* Create Button - Always Visible */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('create')}
                    size="medium"
                    sx={{ whiteSpace: 'nowrap' }} 
                >
                    {isCompact ? "New" : "Create New PO"}
                </Button>

                {/* Filters - Only Visible in Full View */}
                {!isCompact && (
                    <>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
                <Box sx={{ 
                    minHeight: 0,       // Allow shrinking
                    flexGrow: 0, 
                    overflow: 'hidden', // Force scroll management to the child
                    
                    // --- THE CRITICAL FIX ---
                    display: 'flex',       
                    flexDirection: 'column'
                    }}>
                    <ServerSideTable 
                        data={poData}
                        limit={paginationState.limit}
                        loading={isLoading}
                        columnsConfig={finalTableColumns}
                        onRowClick={(poItem) => navigate(`/purchase-orders/${poItem.purchase_order_id}`)}
                        selectedId={selectedId}
                    />
                </Box>

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
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default PurchaseOrderList;