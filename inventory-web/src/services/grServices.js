import api from './api';

/**
 * Search for Inbound Manifests (ASNs)
 * Endpoint: /receiving/manifests/search
 * Query Params: manifest_id, supplier_id, supplier_name, tracking_number, date_from, date_to
 */
export const searchManifests = async (filters) => {
    try {
        const params = new URLSearchParams();
        if (filters.manifest_id) params.append('manifest_id', filters.manifest_id);
        if (filters.supplier_name) params.append('supplier_name', filters.supplier_name);
        if (filters.tracking_ref) params.append('tracking_number', filters.tracking_ref); // Note: UI uses tracking_ref, API uses tracking_number
        // Add date_from and date_to if your UI provides them
        
        const response = await api.get(`/receiving/manifests/search?${params.toString()}`);
        
        // Map API response to UI structure
        // API returns { results: [...] }
        return (response.data.results || []).map(item => ({
            manifest_id: item.id, // ID for selection
            display_id: item.manifest_code, // "SM-1" for display
            supplier_name: item.supplier_name,
            expected_date: item.estimated_arrival ? new Date(item.estimated_arrival).toLocaleDateString() : 'N/A',
            status: item.status, // "posted"
            item_count: item.item_count,
            tracking_ref: item.tracking_number,
            po_number: item.po_number
        }));
    } catch (error) {
        console.error("Failed to search manifests:", error);
        throw error;
    }
};

/**
 * Fetch details for a specific manifest (lines to receive)
 * Endpoint: /receiving/manifests/{id}/lines
 */
export const fetchManifestDetails = async (manifestId) => {
    try {
        const response = await api.get(`/receiving/manifests/${manifestId}/lines`);
        return response.data; // Structure matches ReceivingGrid expectations mostly
    } catch (error) {
        console.error(`Failed to fetch manifest ${manifestId}:`, error);
        throw error;
    }
};

/**
 * Verify asset serials in a shipment manifest line
 * Endpoint: /receiving/manifests/lines/${shipmentManifestLineId}/verify_asset
 */
export const verifyShipmentLineAssets = async (payload) => {
    // DEBUG: Check your console. It should show: { line_id: "...", assets: [...] }
    console.log("Payload received by verify function:", payload);

    const { line_id, assets } = payload;

    // Ensure we don't send the request if line_id is missing
    if (!line_id) throw new Error("Missing manifest line ID");

    const response = await api.post(`receiving/manifest/lines/${line_id}/verify_asset`, assets);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
    }

    return response.json();
};
/**
 * Submit the Receipt
 * Payload structure would typically be: { manifest_id, received_lines: [{ id, qty_received }] }
 */
export const finalizeManifest = async (payload) => {
    try {
        // Placeholder for the actual submission endpoint
        console.log("Submitting Receipt:", payload);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, receipt_id: "GR-" + Math.floor(Math.random() * 10000) };
    } catch (error) {
        console.error("Submission failed", error);
        throw error;
    }
};