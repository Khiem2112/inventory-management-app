import { useState, useEffect } from 'react';
import { 
    Box, Typography, TextField, Button, CircularProgress,
    IconButton, Dialog, DialogTitle, Alert, AlertTitle,
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useMutation } from '@tanstack/react-query';
import { verifyShipmentLineAssets } from '../../services/grServices';

const SerialNumberDialog = ({ open, onClose, onSave, initialSerials = [], maxQty, productName, manifestLineId }) => {
    const [currentSerial, setCurrentSerial] = useState("");
    const [serials, setSerials] = useState(initialSerials);

    // Reset local state when dialog opens
    useEffect(() => {
        if (open) {
            setSerials(initialSerials);
            mutation.reset(); // Clear previous verification results
        }
    }, [open, initialSerials]);

    // TanStack Mutation for Verification [Requirement 2]
    const mutation = useMutation({
        mutationFn: verifyShipmentLineAssets,
    });

    const handleAdd = () => {
        const trimmed = currentSerial.trim();
        if (!trimmed || serials.some(s => s.serial_number === trimmed) || serials.length >= maxQty) return;
        setSerials([...serials, { serial_number: trimmed }]);
        setCurrentSerial("");
        mutation.reset(); // Reset verification because the list changed
    };

    const handleSave = () => {
        onSave(serials);
        onClose();
    };

    // Helper visibility checks [Requirement 1]
    const isVerificationEnabled = Boolean(manifestLineId);
    const result = mutation.data; // { missing_asset_serials, redundant_asset_serials, matched_asset_serials }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assets for {productName}</DialogTitle>
            <DialogContent dividers>
                {/* 1. Conditional Alerts for Verification Mode */}
                {isVerificationEnabled && result && (
                    <Box sx={{ mb: 2 }}>
                        {result.redundant_asset_serials.length > 0 && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                <AlertTitle>Invalid Serials Detected</AlertTitle>
                                {result.redundant_asset_serials.length} items not in manifest.
                            </Alert>
                        )}
                        {result.missing_asset_serials.length > 0 && (
                            <Alert severity="warning">
                                <AlertTitle>Missing Items</AlertTitle>
                                Remaining: {result.missing_asset_serials.join(", ")}
                            </Alert>
                        )}
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField 
                        fullWidth size="small" label="Serial Number" 
                        value={currentSerial}
                        onChange={(e) => setCurrentSerial(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button variant="outlined" onClick={handleAdd} disabled={serials.length >= maxQty}>Add</Button>
                </Box>
                
                <List dense sx={{ maxHeight: 250, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    {serials.map((item, idx) => {
                        // 2. Conditional status styling [Requirement 1]
                        const isRedundant = isVerificationEnabled && result?.redundant_asset_serials.includes(item.serial_number);
                        const isMatched = isVerificationEnabled && result?.matched_asset_serials.includes(item.serial_number);

                        return (
                            <ListItem key={idx} divider sx={{ bgcolor: isRedundant ? '#ffebee' : 'transparent' }}>
                                <ListItemText 
                                    primary={item.serial_number} 
                                    primaryTypographyProps={{ color: isRedundant ? 'error' : 'textPrimary' }}
                                />
                                <ListItemSecondaryAction>
                                    {isMatched && <CheckCircleOutlineIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />}
                                    <IconButton edge="end" size="small" onClick={() => {
                                        const newList = [...serials];
                                        newList.splice(idx, 1);
                                        setSerials(newList);
                                        mutation.reset();
                                    }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                
                {/* 3. Conditional Verify Button [Requirement 1] */}
                {isVerificationEnabled && (
                    <Button 
                        onClick={() => mutation.mutate( {line_id: manifestLineId, assets: serials} )}
                        disabled={mutation.isPending || serials.length === 0}
                    >
                        {mutation.isPending ? <CircularProgress size={20} /> : "Verify Assets"}
                    </Button>
                )}

                <Button 
                    onClick={handleSave} variant="contained" 
                    // Disable save if we are in verification mode and there are redundancies
                    disabled={isVerificationEnabled && result?.redundant_asset_serials.length > 0}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SerialNumberDialog;