export const PO_COLUMNS_CONFIG = [
    { key: 'purchase_order_id', label: 'PO ID', isVisible: true, type: 'text' },
    { key: 'supplier_id', label: 'Supplier ID', isVisible: true, type: 'text' },
    { key: 'purchase_plan_id', label: 'Plan ID', isVisible: false, type: 'text' }, 
    { key: 'create_user_id', label: 'Create User ID', isVisible: false, type: 'text' }, 
    { key: 'create_date', label: 'Creation Date', isVisible: true, type: 'date' },
    { key: 'total_price', label: 'Total Price', isVisible: true, type: 'currency' },
    { key: 'status', label: 'Status', isVisible: true, type: 'status' },
];

/**
 * Returns an array of keys for columns that are visible by default.
 */
export const getInitialVisibleKeys = () => {
    return PO_COLUMNS_CONFIG
        .filter(c => c.isVisible)
        .map(c => c.key);
};

/**
 * Given a list of keys, returns the full configuration objects for rendering.
 */
export const getVisibleColumnsConfig = (visibleKeys) => {
    return PO_COLUMNS_CONFIG.filter(col => visibleKeys.includes(col.key));
};

import api from './api'; // The file you uploaded

// Map the UI filter object to the API query parameters
// API expects: ?page=1&limit=20&status=Open&vendor_id=...
const buildQueryParams = (pagination, filters) => {
    const params = new URLSearchParams();
    
    params.append('page', pagination.page);
    params.append('limit', pagination.limit);

    if (filters.status) params.append('status', filters.status);
    if (filters.vendor_id) params.append('vendor_id', filters.vendor_id);
    // Add other filters as needed
    
    return params.toString();
};

export const fetchPurchaseOrders = async (pagination, filters) => {
    try {
        const queryString = buildQueryParams(pagination, filters);
        // If not, use full URL: 'http://127.0.0.1:8000/purchase-order/all'
        const response = await api.get(`/purchase-order/all?${queryString}`);
        console.log(`Receive raw response: ${JSON.stringify(response)}`)
        // Return the data in a standard format the View expects
        return {
            data: response.data, // The array of POs
            meta: response.data.meta, // The pagination info (total_pages, etc.)
        };
    } catch (error) {
        console.error("Failed to fetch POs:", error);
        throw error; // Let the View handle the UI error state
    }
};