import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
    Box, 
    Typography, 
    Button, 
    TablePagination, 
    Paper, 
    Alert, 
    useTheme 
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
          overflow: 'hidden',
          bgcolor: 'transparent'
          }}> {/* Outer Page Container */}
            
            {/* 1. Page Title Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant={isCompact ? "h6" : "h4"} fontWeight="700" color="text.primary">
                    {isCompact ? "Orders" : "Purchase Order List"}
                </Typography>
            </Box>

            {/* 2. Main Actions Field (Create Button & Filter Bar) */}
            <Box 
                sx={{ 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: `${theme.palette.background.paper}`
                }}
            >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('create')}
                        size={isCompact ? "small" : "medium"}
                    >
                        Create New PO
                    </Button>
                </Box>
                
                {!isCompact && (
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
                )}
            </Box>

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
                    bgcolor: 'transparent'
                }}
            >
                {/* Table Area */}
                <Box sx={{ minHeight: 400 }}>
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