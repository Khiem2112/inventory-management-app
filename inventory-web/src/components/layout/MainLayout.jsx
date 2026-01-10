import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, Divider, List, ListItem, ListItemButton, 
         ListItemIcon, ListItemText, Typography, AppBar, IconButton, Avatar, 
         Menu, MenuItem, Tooltip, Drawer } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

const drawerWidth = 260;

const MainLayout = () => {
    const { userData, logout } = useAuth(); // Decoded JWT contains role information
    const navigate = useNavigate();
    const location = useLocation();
    
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    // Sidebar Configuration with Role Restrictions
    const navItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'staff', 'supplier'] },
        { text: 'Inventory', icon: <InventoryIcon />, path: '/products', roles: ['admin', 'staff'] },
        { text: 'Procurement', icon: <ShoppingCartIcon />, path: '/purchase-orders', roles: ['admin', 'staff'] },
        { text: 'Receiving', icon: <LocalShippingIcon />, path: '/good-receipt', roles: ['admin', 'staff'] },
        { text: 'Warehouse', icon: <WarehouseIcon />, path: '/warehouse', roles: ['admin', 'staff'] },
        { text: 'Shipment Manifest', icon: <LocalShippingIcon />, path: '/supplier/manifest/create/search', roles: ['supplier'] },
    ];

    // Logic to disable other functions for the 'supplier' role
    const filteredNavItems = navItems.filter(item => 
        item.roles.includes(userData?.role?.toLowerCase() || 'staff')
    );

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleProfileMenuClose = () => setAnchorEl(null);

    const handleLogout = () => {
        handleProfileMenuClose();
        logout();
        navigate('/sign-in');
    };

    const drawerContent = (
        <Box>
            <Toolbar sx={{ py: 2, justifyContent: 'center' }}>
                <InventoryIcon sx={{ color: 'primary.main', mr: 1, fontSize: 30 }} />
                <Typography variant="h6" fontWeight="800" color="primary.main">STOCKMASTER</Typography>
            </Toolbar>
            <Divider />
            <List sx={{ px: 1.5 }}>
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton 
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: isActive ? 'primary.light' : 'transparent',
                                    color: isActive ? 'white' : 'text.primary',
                                    '&:hover': { bgcolor: isActive ? 'primary.light' : 'rgba(0,0,0,0.04)' },
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" elevation={0} sx={{ 
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                bgcolor: 'white', borderBottom: '1px solid #e0e0e0', color: 'text.primary'
            }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="body1" fontWeight="500" sx={{ color: 'text.secondary' }}>
                        {userData?.role?.toUpperCase()} Portal
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, mr: 1 }}>
                            {userData?.username || 'User'}
                        </Typography>
                        <IconButton onClick={handleProfileMenuOpen} size="small">
                            <Avatar sx={{ width: 35, height: 35, bgcolor: 'primary.main' }}>
                                {userData?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
                    sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
                    {drawerContent}
                </Drawer>
                <Drawer variant="permanent" open
                    sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #e0e0e0' } }}>
                    {drawerContent}
                </Drawer>
            </Box>

            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    height: '100vh',
                    bgcolor: 'transparent',
                    overflow: 'hidden',
                    display: 'flex',       // Ensure children stack correctly
                    flexDirection: 'column'
                }}
            >
                {/* 1. The Spacer: Sits flush at the top, unpadded */}
                <Toolbar /> 

                {/* 2. The Content Canvas: Handles ALL the spacing logic */}
                <Box 
                    sx={{ 
                        flexGrow: 1, // Fill the remaining height
                        
                        // Move your "Page Spacing" rules here
                        pt: 3,   // Top spacing (starts AFTER the toolbar)
                        pb: 5,   // Bottom spacing
                        pl: 5,   // Left spacing
                        pr: '20%', // The specific right margin you wanted
                        
                        // Ensure this Box is the definitive "boundary"
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden', // Ensure this container doesn't scroll
                        // --- FIX END ---

                        width: '100%', 
                        position: 'relative'
                    }}
                >
                    <Outlet />
                </Box>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <MenuItem onClick={handleProfileMenuClose}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon> Profile</MenuItem>
                <MenuItem onClick={handleProfileMenuClose}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon> Settings</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}><ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon> Logout</MenuItem>
            </Menu>
        </Box>
    );
};

export default MainLayout;