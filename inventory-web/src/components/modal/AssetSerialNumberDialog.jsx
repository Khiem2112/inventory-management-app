import{ useState, useEffect} from 'react';
import { 
    Box, Typography,TextField, Button, 
  IconButton, Dialog, DialogTitle, 
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

// --- Sub-Component: Serial Number Manager Dialog ---
const SerialNumberDialog = ({ open, onClose, onSave, initialSerials = [], maxQty, productName }) => {
    const [currentSerial, setCurrentSerial] = useState("");
    const [serials, setSerials] = useState(initialSerials);

    // Reset local state when dialog opens with new data
    useEffect(() => {
        if (open) setSerials(initialSerials);
    }, [open]);

    const handleAdd = () => {
        if (!currentSerial.trim()) return;
        if (serials.some(s => s.serial_number === currentSerial)) return; // Prevent dupes
        if (serials.length >= maxQty) return; // Prevent over-shipping

        setSerials([...serials, { serial_number: currentSerial.trim() }]);
        setCurrentSerial("");
    };

    const handleDelete = (index) => {
        const newSerials = [...serials];
        newSerials.splice(index, 1);
        setSerials(newSerials);
    };

    const handleSave = () => {
        onSave(serials);
        onClose();
    };

    console.log(`Current serial number`, serials )
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Specify Assets for {productName}</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField 
                        fullWidth 
                        label="Scan/Enter Serial Number" 
                        value={currentSerial}
                        onChange={(e) => setCurrentSerial(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        disabled={serials.length >= maxQty}
                        helperText={`${serials.length} / ${maxQty} assets added`}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAdd}
                        disabled={!currentSerial || serials.length >= maxQty}
                    >
                        Add
                    </Button>
                </Box>
                
                {serials.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                        No serial numbers added yet.
                    </Typography>
                ) : (
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                        {serials.map((item, idx) => (
                            <ListItem key={idx} divider>
                                <ListItemText primary={item.serial_number} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" size="small" onClick={() => handleDelete(idx)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save Assets</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SerialNumberDialog