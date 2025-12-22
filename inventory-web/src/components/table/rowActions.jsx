import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // For Manifest
import { useNavigate } from 'react-router-dom';

const RowActions = ({ item, onEdit, onDelete, onCreateManifest }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const navigate = useNavigate()

    const handleClick = (event) => {
        // CRITICAL: Stop the click from bubbling to the row's onRowClick (navigation)
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    };

    const handleAction = (actionFn) => {
        handleClose(); // Close menu
        console.log(`Handle action function type: `, typeof actionFn)
        if (actionFn) actionFn(item); // Trigger parent handler with the specific item
    };

        // The table's action
    
    const handleEditPO = (item) => {

        navigate(`/purchase-orders/${item.purchase_order_id}/edit`)

    }

    const handleDeletePO = (item) => {
        // pass
    }

    const handleCreateShipmentManifest = (item) => {
        navigate(`/purchase-orders/${item.purchase_order_id}/create-shipment-manifest`)

    }
    
    

    return (
        <>
            <IconButton
                aria-label="more"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
                size="small"
            >
                <MoreVertIcon />
            </IconButton>
            
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                // Ensure menu clicks don't bubble to the row
                MenuListProps={{ onMouseLeave: handleClose }} 
                onClick={(e) => e.stopPropagation()} 
            >
                <MenuItem onClick={() => handleAction(handleCreateShipmentManifest)}>
                    <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Create Manifest</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => handleAction(handleEditPO)}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit PO</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => handleAction(handleDeletePO)} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default RowActions;