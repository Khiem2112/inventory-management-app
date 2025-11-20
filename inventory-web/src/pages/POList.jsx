// src/views/PurchaseOrderList.jsx (Simulated Render)
import { useState, useMemo } from 'react';
import FilterBar from '../components/table/filterBar';
import ServerSideTable from '../components/table/poTable';
import {PO_COLUMNS_CONFIG, getInitialVisibleKeys } from '../services/poColumnService';
import { getVisibleColumnsConfig } from '../services/poColumnService';
// ... other imports

const apiData = [
  { "status": "Issued", "supplier_id": 1, "purchase_plan_id": 1, "CreateUserId": 1, "total_price": "10000.00", "purchase_order_id": 1, "create_date": "2025-07-30T21:30:36.623000" },
  { "status": "Received", "supplier_id": 3, "purchase_plan_id": 2, "CreateUserId": 2, "total_price": "800.00", "purchase_order_id": 2, "create_date": "2025-07-30T21:30:36.623000" }
];

const mockMeta = {
    current_page: 1,
    total_pages: 5,
    total_records: 98
};

// Assuming initial visible columns for demo
const initialVisibleColumns = PO_COLUMNS_CONFIG
    .filter(c => c.isVisible)
    .map(c => c.key);

const PurchaseOrderList = () => {
    const [filterState, setFilterState] = useState({});
    const [paginationState, setPaginationState] = useState({ page: 1, limit: 20 });
    const [loading, setLoading] = useState(false);

    // 1. Initialize state using the service function
    const [visibleKeys, setVisibleKeys] = useState(getInitialVisibleKeys());
    
    // Handler logic (calls setVisibleKeys(newKeys) remains the same)
    
    // 2. Prepare the final, filtered configuration array for the table (CRITICAL CHANGE)
    // Use useMemo to avoid recalculating on every render unless keys change
    const finalTableColumns = useMemo(() => 
        getVisibleColumnsConfig(visibleKeys), 
        [visibleKeys]
    );
    // Placeholder functions for demo purposes
    const handleFilterChange = (newFilters) => {
        console.log('Filters updated:', newFilters);
        setFilterState(newFilters);
        // Logic to trigger API fetch...
    };

    const handlePaginationChange = (page) => {
        console.log('Page changed to:', page);
        setPaginationState(prev => ({ ...prev, page }));
        // Logic to trigger API fetch...
    };

    const handleLimitChange = (limit) => {
        console.log('Limit changed to:', limit);
        setPaginationState(prev => ({ ...prev, limit, page: 1 }));
        // Logic to trigger API fetch...
    };
    const handleColumnToggle = (newKeys) => {
        setVisibleKeys(newKeys);
    };


    return (
        <div className="po-list-view">
            <h2>Purchase Order List (FR-PO-001)</h2>
            
            {/* FilterBar (AC2) and ColumnToggler (AC1) */}
            <FilterBar 
            // 1. Pass the full configuration for the checklist build (LABEL, isRequired)
            allColumnsConfig={PO_COLUMNS_CONFIG}  
            
            // 3. Pass the handler to update the state
            onColumnToggle={handleColumnToggle}
        />

            {/* ServerSideTable (AC3, AC4, AC5) */}
            <ServerSideTable 
                data={apiData}
                meta={mockMeta}
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
// In a real application, you'd render this main component:
// ReactDOM.render(<PurchaseOrderList />, document.getElementById('app'));