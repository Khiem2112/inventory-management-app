// src/views/PurchaseOrderList.jsx (Simulated Render)
import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query'; // <--- 1. Import Hook
import FilterBar from '../components/table/filterBar';
import ServerSideTable from '../components/table/poTable';
import {PO_COLUMNS_CONFIG, getInitialVisibleKeys, getVisibleColumnsConfig, fetchPurchaseOrders } from '../services/poService';
import TablePagination from '@mui/material/TablePagination';// ... other imports for filter, pagination icons
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@mui/material';

import { usePoUrlState } from '../hooks/PurchaseOrder/usePoUrlsState';

// ... other imports


const PurchaseOrderList = ({
    isCompact = true
}) => {
    const { 
        filterState, 
        setFilterState, 
        paginationState, 
        setPaginationState 
    } = usePoUrlState();

    // 1. Initialize state using the service function
    const [visibleKeys, setVisibleKeys] = useState(
        isCompact 
        ? ['purchase_order_id', 'status', 'total_price'] 
        : getInitialVisibleKeys()
    );

    const { 
    data: queryResult, // Contains { data, meta } from your service
    isLoading, 
    isError,  
    error 
    } = useQuery({
        // CRITICAL: The Query Key. Any change here triggers a re-fetch automatically.
        queryKey: ['purchaseOrders', paginationState, filterState],
        
        // The Service Function
        queryFn: () => fetchPurchaseOrders(paginationState, filterState),
        
        // UX Improvement: Keep old data visible while fetching new page
        placeholderData: keepPreviousData, 
        
        // Optional: Prevent refetching on window focus if data is static-ish
        refetchOnWindowFocus: false 
    });
    const poData = queryResult?.data || [];
    const meta = queryResult?.meta || { current_page: 1, total_pages: 1, total_records: 0 };    
    const suppliersList = queryResult?.meta.suppliers || []
    const usersList = queryResult?.meta.users || []
    const statusesList = queryResult?.meta.statuses || []
    const navigate = useNavigate()
    const {
        id: selectedId
    } = useParams()
    console.log(`Get the poData: ${JSON.stringify(poData)}`)
    // Use useMemo to avoid recalculating on every render unless keys change
    const finalTableColumns = useMemo(() => 
        getVisibleColumnsConfig(visibleKeys), 
        [visibleKeys]
    );
    const handleRowClick = (poItem) => {
        // Navigate to the detail URL
        // AND pass the full 'poItem' object in state (Optimistic UI)
        navigate(`/purchase-orders/${poItem.purchase_order_id}`, { 
            state: { initialData: poItem } 
        });
    }
    // Placeholder functions for demo purposes
    const handleFilterChange = (newFilters) => {
        setFilterState(prev => ({ ...prev, ...newFilters }));
        setPaginationState(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };
    const handleSupplierFiltering = (chosenSupplierID) => {
        console.log(`Start to handle supplier filtering`)
        setFilterState(prev => {
            return (
                {...prev, vendor_id: chosenSupplierID}
            )
        })
    } 
    const handleStatusFilterirng = (chosenStatus) => {
        setFilterState(prev => {
            return (
                {...prev, status: chosenStatus}
            )
        })
    }

    const handlePaginationChange = (newPage) => {
        setPaginationState(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit) => {
        setPaginationState(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const handleColumnToggle = (newKeys) => {
        setVisibleKeys(newKeys);
    };
    // Handle to vreate new PO
    const handleNavigateCreatePO = () => {
        navigate('create')
    }


    return (
        <div className={`po-list-view ${isCompact ? 'po-list-view--compact' : ''}`}>
            {!isCompact && <h2>Purchase Order List</h2>}
            {isError && (
                <div className="error-banner">
                    Error: {error?.message || "Unable to load purchase orders."}
                </div>
            )}
            <Button
            variant="contained"
            sx={{
                justifyContent:'space-between',
                fontWeight:'bold'
            }}
            onClick={handleNavigateCreatePO}
            >
                Create New PO
            </Button>
            
            {/* FilterBar (AC2) and ColumnToggler (AC1) */}
            
            {!isCompact && 
            <FilterBar 
            // 1. Pass the full configuration for the checklist build (LABEL, isRequired)
            allColumnsConfig={PO_COLUMNS_CONFIG}
            onStatusChange={handleStatusFilterirng}
            onSupplierChange={handleSupplierFiltering} 
            suppliers={suppliersList}
            statuses={statusesList}
            users={usersList}
            
            // 3. Pass the handler to update the state
            onColumnToggle={handleColumnToggle}
        />
            }

            

            {/* ServerSideTable (AC3, AC4, AC5) */}
            <ServerSideTable 
                data={poData}
                limit={paginationState.limit}
                loading={isLoading}
                columnsConfig={finalTableColumns}
                onRowClick={handleRowClick}
                selectedId={selectedId}
            />
                        {/* --- MUI Pagination Footer --- */}
            <TablePagination
                component="div"
                count={meta.total_records}
                page={paginationState.page - 1} // TRANSLATION: Backend(1-based) -> MUI(0-based)
                onPageChange={(event, newPage) => {
                    console.log(`Event: ${event} and newPage: ${newPage} || OnPageChange`)
                    handlePaginationChange(newPage + 1)
                }}
                rowsPerPage={paginationState.limit}
                onRowsPerPageChange={(event) => {
                    const newPage = parseInt(event.target.value, 10)
                    console.log(`Func: onLimitChangne with input: ${newPage}`)
                    handleLimitChange(newPage)
                }}
                rowsPerPageOptions={[10, 20, 50]} // Options for the dropdown
                labelRowsPerPage="Rows:" // Optional customization
            />
            
        </div>
    );
};

export default PurchaseOrderList