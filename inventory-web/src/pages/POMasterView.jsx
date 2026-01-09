// src/views/POMasterView.jsx
import React, { useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import PurchaseOrderList from './POList';
import { Box,Paper } from '@mui/material';


const POMasterView = () => {
  const isDetailView = useMatch("/purchase-orders/:id");
  // Styles for the split view
const layoutStyles = {
    display: 'grid',
    gridTemplateColumns: isDetailView ? '450px 1fr' : '1fr', 
    height: 'calc(100vh - 64px)', // Full height minus Navbar
    overflow: 'hidden',
    bgcolor: 'background.paper',
    transition: 'all 0.3s ease'
};
    return (
        <Box sx={layoutStyles}>
            {/* LEFT PANE: The List */}
            <Paper 
                elevation={2} 
                sx={{ 
                    borderRight: '1px solid #e0e0e0', 
                    overflowY: 'auto',
                    bgcolor: 'white',
                    zIndex: 1,
                    // If we are NOT in detail view, we hide the sidebar border for a cleaner look
                    borderRight: isDetailView ? '1px solid #e0e0e0' : 'none'
                }}
            >
                {/* Dynamic Prop: 
                   - Pass isCompact={true} ONLY when squeezed into the sidebar.
                   - Otherwise, let it expand to full table mode.
                */}
                <PurchaseOrderList isCompact={!!isDetailView} />
            </Paper>

            {/* RIGHT PANE: The Detail (Rendered by Router) */}
            <Box sx={{ 
              overflowY: 'auto', 
              bgcolor: 'white', 
              display: isDetailView ? 'block' : 'none' }}>
                <Outlet /> 
            </Box>
        </Box>
    );
};

export default POMasterView;