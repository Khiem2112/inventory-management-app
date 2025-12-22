import api from './api';

/**
 * 1. Fetch PO Context for Manifest Creation
 * Endpoint: /purchase-order/{po_id}
 * Response: { header: {...}, items: [...] }
 */
export const fetchPOContext = async (poId) => {
    try {
        const response = await api.get(`/purchase-order/${poId}`);
        return response.data; 
    } catch (error) {
        console.error(`Failed to fetch PO Context for ${poId}`, error);
        throw error;
    }
};

/**
 * 2. Submit New Shipment Manifest
 * Endpoint: /supplier/manifest
 * Request: { purchase_order_id, tracking_number, carrier_name, estimated_arrival, status, lines: [...] }
 */
export const submitManifest = async (payload) => {
    try {
        const response = await api.post('/supplier/manifest', payload);
        return response.data;
    } catch (error) {
        console.error("Failed to submit manifest", error);
        throw error;
    }
};