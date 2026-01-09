// src/views/POMasterView.jsx
import React from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import PurchaseOrderList from './POList';
import { Box, Paper, useTheme } from '@mui/material';

const POMasterView = () => {
    // Check if we are on a detail route (e.g., /purchase-orders/123)
    const isDetailView = !!useMatch("/purchase-orders/:id");
    const theme = useTheme();

    return (
        <Box sx={{
            display: 'flex',              // Use Flexbox for sliding alignment
            height: '100%',
            minHeight: '600px',
            overflow: 'hidden',           // Prevent page scroll during animation
            bgcolor: 'transparent',
            position: 'relative'          // Anchor for absolute positioning if needed
        }}>
            {/* LEFT PANE: The List 
              - Default: width 100%
              - Active: width 450px
            */}
            <Paper
                elevation={2}
                sx={{
                    // 1. Animation Logic
                    width: isDetailView ? '450px' : '100%',
                    transition: 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)', // Smooth ease-out slide
                    
                    // 2. Layout & Style
                    height: '100%',
                    display: 'flex',      // Pass layout context down
                    flexDirection: 'column',
                    flexShrink: 0,        // Prevent compression
                    overflowY: 'auto',    // Internal Scroll
                    overflowX: 'hidden',  // Hide horizontal scroll during resize
                    bgcolor: 'transparent',
                    zIndex: 2,            // Keep above the right pane slightly
                    
                    // 3. Dynamic Borders
                    borderRight: isDetailView 
                        ? `1px solid ${theme.palette.divider}` 
                        : 'none',
                    
                    // 4. White-space handling
                    // Prevents table columns from "dancing" while width is changing
                    whiteSpace: 'nowrap', 
                }}
            >   
                <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
                    <PurchaseOrderList isCompact={isDetailView} />
                </Box>
            </Paper>

            {/* RIGHT PANE: The Detail
              - Default: width 0, opacity 0
              - Active: flex-grow 1, opacity 1
            */}
            <Box sx={{
                // 1. Animation Logic
                // We use flex-grow to fill remaining space, but animate opacity for the fade-in effect
                flexGrow: 1,
                minWidth: 0,              // CSS Grid/Flex fix: allows child to shrink to 0
                opacity: isDetailView ? 1 : 0,
                transform: isDetailView ? 'translateX(0)' : 'translateX(20px)', // Subtle slide-in movement
                transition: 'opacity 0.4s ease-in 0.1s, transform 0.4s ease-out 0.1s', 
                
                // 2. Layout
                height: '100%',
                overflowY: 'auto',
                bgcolor: 'white',
                
                // 3. Visibility Management
                // We physically hide it when closed so it doesn't trap focus or clicks
                visibility: isDetailView ? 'visible' : 'hidden', 
            }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default POMasterView;