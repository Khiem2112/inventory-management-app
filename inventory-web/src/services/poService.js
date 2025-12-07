import api from './api';

export const PO_COLUMNS_CONFIG = [
    { key: 'purchase_order_id', label: 'PO ID', isVisible: true, type: 'text' },
    { key: 'supplier_name', label: 'Supplier Name', isVisible: true, type: 'text' },
    { key: 'purchase_plan_id', label: 'Plan ID', isVisible: false, type: 'text' }, 
    { key: 'create_user_name', label: 'Create User Name', isVisible: false, type: 'text' }, 
    { key: 'create_date', label: 'Creation Date', isVisible: true, type: 'date' },
    { key: 'total_price', label: 'Total Price', isVisible: true, type: 'currency' },
    { key: 'status', label: 'Status', isVisible: true, type: 'status' },
];

// --- DETAIL VIEW CONFIGURATION
export const PO_DETAIL_ITEMS_CONFIG = [
    { key: 'item_description', label: 'Product', isVisible: true, type: 'text' },
    { key: 'product_id', label: 'Ref ID', isVisible: true, type: 'text' },
    { key: 'unit_price', label: 'Unit Price', isVisible: true, type: 'currency' },
    { key: 'quantity', label: 'Qty', isVisible: true, type: 'number' },
    // 'total' is usually calculated on the fly, but we can define it here for the UI to render
    { key: 'total_line_amount', label: 'Total', isVisible: true, type: 'currency' } 
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

export const getDetailItemsConfig = () => {
    return PO_DETAIL_ITEMS_CONFIG.filter(c => c.isVisible);
};

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
        const response = await api.get(`/purchase-order/?${queryString}`);
        console.log(`Receive raw response: ${JSON.stringify(response)}`)
        // Return the data in a standard format the View expects
        return {
            data: response.data.items, // The array of POs
            meta: { 
                current_page: response.data.current_page, 
                total_pages: response.data.total_pages || 4, 
                total_records: response.data.total_records || 32,
                limit: response.data.limit || 10,
                suppliers: response.data.suppliers,
                users: response.data.users,
                statuses: response.data.statuses
            }, // The pagination info (total_pages, etc.)
        };
    } catch (error) {
        console.error("Failed to fetch POs:", error);
        throw error; // Let the View handle the UI error state
    }
};


/**
 * Fetch a single Purchase Order by ID
 * Returns { header: {...}, line_items: [...] }
 */
export const fetchPurchaseOrderDetail = async (poId) => {
    try {
        if (!poId) throw new Error("Purchase Order ID is required");

        // Assuming the endpoint for items is /purchase-order/{id} as per conversation
        // If the endpoint is strictly for items, it might be /purchase-order-items/{id} or similar.
        // Based on "fetchPurchaseOrder detail... returns a single list", we use the detail endpoint.
        const response = await api.get(`/purchase-order/${poId}`);
        
        // Return the array directly
        return {
            header: response.data?.header,
            items: response.data?.items
        };

    } catch (error) {
        console.error(`Failed to fetch items for PO ${poId}:`, error);
        throw error;
    }
};

// Create Purchase Order

export const createPurchaseOrder = async (payload) => {
    try {
        const response = await api.post('/purchase-order', payload);
        return response.data;
    } catch (error) {
        console.error("Failed to create PO:", error);
        throw error;
    }
};

/**
 * Lookup Helpers (Mocking these for now) ---
 * In a real app, these would hit /api/vendors?search=...
 */
export const searchVendors = async (query) => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { id: 101, name: "Acme Corp", payment_terms: "Net 30" },
        { id: 102, name: "Global Supplies", payment_terms: "Immediate" },
        { id: 103, name: "Tech Distributors", payment_terms: "Net 60" },
    ].filter(v => v.name.toLowerCase().includes(query.toLowerCase()));
};

export const searchProducts = async (query) => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { product_id: 10, name: "Standard Widget A - Blue", unit_price: 12.50, sku: "WID-A-BLU" },
        { product_id: 22, name: "Bulk Screws", unit_price: 0.99, sku: "SCR-BULK" },
        { product_id: 35, name: "Industrial Lubricant", unit_price: 45.00, sku: "LUB-IND" },
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
};