// src/hooks/usePoUrlState.js (NEW FILE)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_STATE = { page: 1, limit: 8 };

// Helper to read state from the URL
const parseUrlState = (search) => {
    const params = new URLSearchParams(search);
    
    // Read and type-cast with defaults
    const page = parseInt(params.get('page')) || DEFAULT_STATE.page;
    const limit = parseInt(params.get('limit')) || DEFAULT_STATE.limit;
    const status = params.get('status') || DEFAULT_STATE.status;
    const vendor_id = params.get('vendor_id') || DEFAULT_STATE.vendor_id;

    return { page, limit, status, vendor_id };
};

// Helper to write state back to the URL
const buildUrlSearch = (state) => {
    const newParams = new URLSearchParams();
    
    if (state.page !== DEFAULT_STATE.page) newParams.set('page', state.page);
    if (state.limit !== DEFAULT_STATE.limit) newParams.set('limit', state.limit);
    if (state.status !== DEFAULT_STATE.status && state.status) newParams.set('status', state.status);
    if (state.vendor_id !== DEFAULT_STATE.vendor_id && state.vendor_id) newParams.set('vendor_id', state.vendor_id);

    return newParams.toString();
};

export const usePoUrlState = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Core State: Holds the combined, URL-derived state
    const [unifiedState, setUnifiedState] = useState(() => parseUrlState(location.search));

    // 2. URL -> State Sync (Handles Back/Forward buttons)
    useEffect(() => {
        const urlState = parseUrlState(location.search);
        // Only update if the URL change results in a different state object
        if (JSON.stringify(urlState) !== JSON.stringify(unifiedState)) {
            setUnifiedState(urlState);
        }
    }, [location.search]); // Depend only on URL change

    // 3. State -> URL Sync (Handles User actions)
    useEffect(() => {
        const newSearch = buildUrlSearch(unifiedState);
        const currentSearch = location.search.substring(1);

        if (currentSearch !== newSearch) {
            // THIS IS THE KEY: Use replace to update the URL without history clutter
            navigate({ search: newSearch }, { replace: true });
        }
    }, [unifiedState]); // Depend only on local state change

    // 4. Exposed Setters: Crucial for applying filter/page reset logic
    const setFilterState = useCallback((update) => {
    setUnifiedState(prevState => {
        // 1. Get the current filter slice from the full state
        const prevFilterState = {
            status: prevState.status,
            vendor_id: prevState.vendor_id,
        };
        
        // 2. Determine the new filter values: execute the callback if 'update' is a function
        const newFiltersPartial = typeof update === 'function' 
            ? update(prevFilterState) // Execute the user's callback with the filter slice
            : update; // Use the object if an object was passed
            
        // 3. Merge and apply required logic (reset page)
        return {
            ...prevState, // Carry over consistent fields (e.g., limit)
            ...newFiltersPartial, // Apply new filter values (e.g., vendor_id)
            page: 1, // CRITICAL: Reset page on filter change
        };
    });
}, []); // Dependencies remain correct

    const setPaginationState = useCallback((update) => {
    setUnifiedState(prevState => {
        // 1. Get the current pagination slice from the full state
        const prevPaginationState = {
            page: prevState.page,
            limit: prevState.limit,
        };

        // 2. Determine the new pagination values: execute the callback if 'update' is a function
        const newPaginationPartial = typeof update === 'function' 
            ? update(prevPaginationState) // Execute the user's callback with the pagination slice
            : update; // Use the object if an object was passed

        // 3. Check for limit change to apply page reset logic
        const shouldResetPage = newPaginationPartial.limit !== prevState.limit;

        // 4. Merge and apply required logic
        return {
            ...prevState, // Carry over consistent fields (e.g., status, vendor_id)
            ...newPaginationPartial, // Apply new pagination values (e.g., page, limit)
            // If limit changed, force page to 1, otherwise use the new page value
            page: shouldResetPage ? 1 : newPaginationPartial.page,
        };
    });
}, [])

    // 5. Expose split states for TanStack Query compatibility
    const filterState = useMemo(() => ({ status: unifiedState.status, vendor_id: unifiedState.vendor_id }), [unifiedState]);
    const paginationState = useMemo(() => ({ page: unifiedState.page, limit: unifiedState.limit }), [unifiedState]);

    return { filterState, setFilterState, paginationState, setPaginationState };
};