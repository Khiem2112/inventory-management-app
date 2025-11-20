// src/views/PurchaseOrderList.jsx (Simulated Render)
import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query'; // <--- 1. Import Hook
import FilterBar from '../components/table/filterBar';
import ServerSideTable from '../components/table/poTable';
import {PO_COLUMNS_CONFIG, getInitialVisibleKeys, getVisibleColumnsConfig, fetchPurchaseOrders } from '../services/poService';
// ... other imports



const PurchaseOrderList = () => {
    const [filterState, setFilterState] = useState({});
    const [paginationState, setPaginationState] = useState({ page: 1, limit: 20 });
    const [loading, setLoading] = useState(false);

    // 1. Initialize state using the service function
    const [visibleKeys, setVisibleKeys] = useState(getInitialVisibleKeys());

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
    // 2. Prepare the final, filtered configuration array for the table (CRITICAL CHANGE)
    // Use useMemo to avoid recalculating on every render unless keys change
    const finalTableColumns = useMemo(() => 
        getVisibleColumnsConfig(visibleKeys), 
        [visibleKeys]
    );
    // Placeholder functions for demo purposes
    const handleFilterChange = (newFilters) => {
        setFilterState(prev => ({ ...prev, ...newFilters }));
        setPaginationState(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const handlePaginationChange = (newPage) => {
        setPaginationState(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit) => {
        setPaginationState(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const handleColumnToggle = (newKeys) => {
        setVisibleKeys(newKeys);
    };


    return (
        <div className="po-list-view">
            <h2>Purchase Order List (FR-PO-001)</h2>
            {isError && (
                <div className="error-banner">
                    Error: {error?.message || "Unable to load purchase orders."}
                </div>
            )}
            
            {/* FilterBar (AC2) and ColumnToggler (AC1) */}
            <FilterBar 
            // 1. Pass the full configuration for the checklist build (LABEL, isRequired)
            allColumnsConfig={PO_COLUMNS_CONFIG}  
            
            // 3. Pass the handler to update the state
            onColumnToggle={handleColumnToggle}
        />

            {/* ServerSideTable (AC3, AC4, AC5) */}
            <ServerSideTable 
                data={poData}
                meta={meta}
                loading={loading}
                onPageChange={handlePaginationChange}
                onLimitChange={handleLimitChange}
                columnsConfig={finalTableColumns}
            />
            
            {/* Visual States Check:
              - Loading: Pass 'loading={true}'
              - Empty: Pass 'data={[]}'
              - Success: Current state (data filled)
            */}
        </div>
    );
};

export default PurchaseOrderList