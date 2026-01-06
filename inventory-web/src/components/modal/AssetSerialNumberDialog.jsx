import { useState, useEffect } from 'react';
import { 
    Box, Typography, TextField, Button, CircularProgress,
    IconButton, Dialog, DialogTitle, Alert, AlertTitle,
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction, Link,
    Snackbar, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import Copy Icon
import { useMutation } from '@tanstack/react-query';
import { verifyShipmentLineAssets } from '../../services/grServices';

// --- Sub-Component: Detail View for Long Lists ---

const SerialDetailDialog = ({ open, onClose, title, items }) => {

    const [copyFeedback, setCopyFeedback] = useState(false);

    const handleCopy = () => {
        if (items && items.length > 0) {
            // Join items with newlines for easy pasting elsewhere
            const textToCopy = items.join('\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
            });
        }
    };
    return(
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        {/* 1. Copy Button in Header */}
        <IconButton onClick={handleCopy} size="small" title="Copy list to clipboard">
            <ContentCopyIcon fontSize="small" />
        </IconButton>
        <DialogContent dividers>
            <List dense>
                {items.map((item, idx) => (
                    <ListItem key={idx} divider>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>
            {/* Tiny feedback toast inside dialog */}
            <Snackbar
                open={copyFeedback}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                message="Copied to clipboard!"
                sx={{ position: 'absolute', bottom: 10 }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
);
} 


// --- Sub-Component: Truncated List Display ---
const TruncatedSerialList = ({ items, title, maxDisplay = 5 }) => {
    const [detailOpen, setDetailOpen] = useState(false);

    if (!items || items.length === 0) return null;

    const displayItems = items.slice(0, maxDisplay);
    const remainingCount = items.length - maxDisplay;

    return (
        <>
            <Typography variant="body2" component="span">
                {displayItems.join(", ")}
                {remainingCount > 0 && (
                    <>
                        {", "}
                        <Link 
                            component="button" 
                            variant="body2" 
                            onClick={() => setDetailOpen(true)}
                            sx={{ verticalAlign: 'baseline', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            ... (+{remainingCount} more)
                        </Link>
                    </>
                )}
            </Typography>

            <SerialDetailDialog 
                open={detailOpen} 
                onClose={() => setDetailOpen(false)} 
                title={title} 
                items={items} 
            />
        </>
    );
};

const SerialNumberDialog = ({ open, onClose, onSave, initialSerials = [], maxQty, productName, manifestLineId }) => {
    const [currentSerial, setCurrentSerial] = useState("");
    const [serials, setSerials] = useState(initialSerials);
    console.log(`Serial number dialog re-render with current serial number: `. currentSerial )
    // Reset local state when dialog opens
    useEffect(() => {
        if (open) {
            setSerials(initialSerials);
            setCurrentSerial("")
            if (isVerificationEnabled) mutation.reset(); // Clear previous verification results
        }
    }, [open, initialSerials]);

    // TanStack Mutation for Verification [Requirement 2]
    const mutation = useMutation({
        mutationFn: verifyShipmentLineAssets,
    });

    const handleAdd = () => {
        const rawInput = currentSerial;
        if (!rawInput.trim()) return;

        // 2. Bulk Input Logic
        // Split by newlines, commas, or spaces (common delimiters for pasted lists)
        const newItems = rawInput
            .split(/[\n, ]+/) 
            .map(s => s.trim())
            .filter(s => s !== ""); // Remove empty strings

        if (newItems.length === 0) return;

        // Filter out duplicates and limit check
        const uniqueNewItems = newItems.filter(newItem => 
            !serials.some(s => s.serial_number === newItem)
        );

        // Check overflow
        if (serials.length + uniqueNewItems.length > maxQty) {
            alert(`Cannot add ${uniqueNewItems.length} items. Exceeds remaining quantity.`);
            return;
        }

        // Add valid items
        const newSerialObjects = uniqueNewItems.map(s => ({ serial_number: s }));
        setSerials([...serials, ...newSerialObjects]);
        
        setCurrentSerial("");
        mutation.reset(); 
    };

    const handleSave = () => {
        onSave(serials);
        onClose();
    };

    const verifyResponse = mutation.data
    // Helper visibility checks [Requirement 1]
    const isVerificationEnabled = Boolean(manifestLineId);
    console.log(`Get the raw mutation: ${JSON.stringify(mutation)}`, )
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assets for {productName}</DialogTitle>
            <DialogContent dividers>
                {/* 1. Conditional Alerts for Verification Mode */}
                {isVerificationEnabled && verifyResponse && (
                    <Box sx={{ mb: 2 }}>
                        {verifyResponse.redundant_asset_serials.length > 0 && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                <Box sx={{ mt: 1 }}>
                                    <TruncatedSerialList 
                                        items={verifyResponse.redundant_asset_serials} 
                                        title="Invalid Serial Numbers"
                                    />
                                </Box>
                            </Alert>
                        )}
                        {verifyResponse.missing_asset_serials.length > 0 && (
                            <Alert severity="warning">
                                <AlertTitle>Missing Items</AlertTitle>
                                Remaining: 
                                <Box component="span" sx={{ ml: 1 }}>
                                    <TruncatedSerialList 
                                        items={verifyResponse.missing_asset_serials} 
                                        title="Missing Serial Numbers"
                                    />
                                </Box>
                            </Alert>
                        )}
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField 
                        fullWidth 
                        size="small" 
                        label="Scan/Enter Serial Numbers" 
                        placeholder="Paste list here (comma or newline separated)"
                        value={currentSerial}
                        multiline // Allow multi-line pasting visibility
                        maxRows={20}
                        onChange={(e) => setCurrentSerial(e.target.value)}
                        onKeyPress={(e) => {
                            // Allow Enter to submit if not holding Shift (standard text area behavior)
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                    />
                    <Button variant="outlined" onClick={handleAdd} disabled={serials.length >= maxQty}>Add</Button>
                </Box>
                
                <List dense sx={{ maxHeight: 250, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    {serials.map((item, idx) => {
                        // 2. Conditional status styling [Requirement 1]
                        const isRedundant = isVerificationEnabled && verifyResponse?.redundant_asset_serials.includes(item.serial_number);
                        const isMatched = isVerificationEnabled && verifyResponse?.matched_asset_serials.includes(item.serial_number);

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
                    disabled={isVerificationEnabled && verifyResponse?.redundant_asset_serials.length > 0}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SerialNumberDialog;