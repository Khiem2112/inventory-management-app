// src/views/POMasterView.jsx
import React, { useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import PurchaseOrderList from './POList';
import { Box,Paper, useTheme } from '@mui/material';


const POMasterView = () => {
  const isDetailView = useMatch("/purchase-orders/:id");
  // Styles for the split view
  const theme = useTheme()
const layoutStyles = {
    display: 'grid',
    gridTemplateColumns: isDetailView ? '450px 1fr' : '1fr', 
    height: '100%', // Fit within the MainLayout's padded box
    minHeight: '600px',
    overflow: 'hidden',
    bgcolor: 'transparent',
    transition: 'all 0.3s ease'
};
    return (
        <Box sx={layoutStyles}>
            {/* LEFT PANE: The List */}
            <Paper 
                elevation={2} 
                sx={{ 
                    overflowY: 'auto',
                    bgcolor: 'transparent',
                    zIndex: 1,
                    // If we are NOT in detail view, we hide the sidebar border for a cleaner look
                    borderRight: isDetailView ? `1px solid ${theme.palette.background.default}` : `none`
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