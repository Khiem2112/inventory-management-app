// src/views/POMasterView.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import PurchaseOrderList from './POList';
import { Box } from '@mui/material';

// Styles for the split view
const layoutStyles = {
    display: 'grid',
    gridTemplateColumns: '450px 1fr', // Fixed width list, fluid detail
    height: 'calc(100vh - 64px)', // Full height minus Navbar
    overflow: 'hidden'
};

const POMasterView = () => {
    return (
        <Box sx={layoutStyles}>
            {/* LEFT PANE: The List */}
            <Box sx={{ borderRight: '1px solid #ddd', overflowY: 'auto' }}>
                {/* We pass a 'compact' prop to tell the list to simplify itself */}
                <PurchaseOrderList isCompact={true} />
            </Box>

            {/* RIGHT PANE: The Detail (Rendered by Router) */}
            <Box sx={{ overflowY: 'auto', bgcolor: 'white' }}>
                <Outlet /> 
            </Box>
        </Box>
    );
};

export default POMasterView;