export const PO_COLUMNS_CONFIG = [
    { key: 'purchase_order_id', label: 'PO ID', isVisible: true, type: 'text' },
    { key: 'supplier_id', label: 'Supplier ID', isVisible: true, type: 'text' },
    { key: 'purchase_plan_id', label: 'Plan ID', isVisible: false, type: 'text' }, 
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