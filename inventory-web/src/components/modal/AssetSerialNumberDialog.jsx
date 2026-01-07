import { useState, useEffect } from 'react';
import { 
    Box, Typography, TextField, Button, CircularProgress,
    IconButton, Dialog, DialogTitle, Alert, AlertTitle,
    DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction, Link,
    Snackbar, Chip
} from '@mui/material';
import { useFormContext } from 'react-hook-form'; //
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import Copy Icon
import { useMutation } from '@tanstack/react-query';
import { verifyShipmentLineAssets, verifyAssetsExistence } from '../../services/grServices';

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

const SerialNumberDialog = ({ open, onClose, onSave, initialSerials = [], maxQty, productName, manifestLineId, receivingStrategy }) => {
    const [currentSerial, setCurrentSerial] = useState("");
    const [serials, setSerials] = useState(initialSerials);

    // Strategy Logic
    const isAssetSpecified = receivingStrategy === 'asset_specified';
    const isQuantityDeclared = receivingStrategy === 'quantity_declared';
    console.log(`Serial number dialog re-render with current serial number: `. currentSerial )
    const { getValues } = useFormContext();
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
        mutationFn: (data) => {
            if (isAssetSpecified) {
                // Flow 1: Check against Manifest (Strict)
                return verifyShipmentLineAssets({ line_id: manifestLineId, assets: data.assets });
            } else {
                // Flow 2: Check Global Existence (Prevent Duplicates)
                // verifyAssetsExistence expects just the list of assets
                return verifyAssetsExistence(data.assets);
            }
        },
        onSuccess: (data) => {
            let badSerials = [];
            let goodSerials = [];

            if (receivingStrategy === 'asset_specified') {
                badSerials = data.redundant_asset_serials || [];
                goodSerials = data.matched_asset_serials || [];
            } else {
                badSerials = data.existed_asset_serials || [];
                goodSerials = data.new_asset_serials || [];
            }

            // Update status based on response
            setSerials(prev => prev.map(item => {
                if (badSerials.includes(item.serial_number)) return { ...item, status: 'invalid' };
                if (goodSerials.includes(item.serial_number)) return { ...item, status: 'valid' };
                // If backend didn't return it (rare), keep it as pending
                return item;
            }));
        }
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
        const newSerialObjects = uniqueNewItems.map(s => ({ serial_number: s, status: 'pending' }));
        setSerials([...serials, ...newSerialObjects]);
        
        setCurrentSerial("");
    };

    const handleDelete = (idx) => {
        const newList = [...serials];
        newList.splice(idx, 1);
        setSerials(newList);
    }

    const handleSave = () => {
        onSave(serials);
        onClose();
    };

    const handleVerify = () => {
        // Prepare payload simply as the array of objects, the mutationFn adapter handles the rest
        mutation.mutate({ assets: serials });
    };

    const getGlobalDuplicates = () => {
        const allLines = getValues('lines') || [];
        const otherSerials = new Set();

        // Collect serials from ALL OTHER lines
        allLines.forEach(line => {
            if (line.id !== manifestLineId && line.asset_items) {
                line.asset_items.forEach(item => {
                    if (item.serial_number) otherSerials.add(item.serial_number);
                });
            }
        });

        // Return local items that exist in that set
        return serials
            .map(s => s.serial_number)
            .filter(sn => otherSerials.has(sn));
    };

    const globalDuplicateItems = getGlobalDuplicates();
    
    // NEW: Check for "Pending" items to trigger the warning bar
    const hasUnverifiedItems = serials.some(s => s.status === 'pending');

    // --- Derived State for UI Feedback ---
    let invalidItems = [];
    let validItems = [];
    let warningMessage = null;
    let errorMessage = null;

    // Check Global Duplicates first
    if (globalDuplicateItems.length > 0) {
        errorMessage = (
            <Alert severity="error" sx={{ mb: 1 }}>
                <AlertTitle>Duplicate in Manifest</AlertTitle>
                Found in other lines: <TruncatedSerialList items={globalDuplicateItems} title="Cross-Line Duplicates" />
            </Alert>
        );
    }

    const verifyResponse = mutation.data
    // Helper visibility checks [Requirement 1]
    const isVerificationEnabled = Boolean(manifestLineId) && (isAssetSpecified || isQuantityDeclared);

    console.log(`Get the raw mutation: ${JSON.stringify(mutation)}`, )

    // Dynamically handle invalid/validItems based on mode we are handliing
    if (verifyResponse) {
        if (isAssetSpecified) {
            // Logic for Asset Specified (Strict Matching)
            invalidItems = verifyResponse.redundant_asset_serials || [];
            validItems = verifyResponse.matched_asset_serials || [];
            
            if (invalidItems.length > 0) {
             const backendError = (
                <Alert severity="error" sx={{ mb: 1 }}>
                    <AlertTitle>Invalid Serials</AlertTitle>
                    {invalidItems.length} items not in manifest: <TruncatedSerialList items={invalidItems} title="Invalid Items" />
                </Alert>
            );
            errorMessage = <>{errorMessage}{backendError}</>;
        }
            if ((verifyResponse.missing_asset_serials || []).length > 0) {
                warningMessage = (
                    <Alert severity="warning">
                        <AlertTitle>Missing Items</AlertTitle>
                        Remaining: <TruncatedSerialList items={verifyResponse.missing_asset_serials} title="Missing Items" />
                    </Alert>
                );
            }
        } else {
            // Logic for Quantity Declared (Existence Check)
            // 'existed_asset_serials' are bad here (duplicates in DB)
            invalidItems = verifyResponse.existed_asset_serials || [];
            // 'new_asset_serials' are good
            validItems = verifyResponse.new_asset_serials || [];

            if (invalidItems.length > 0) {
                errorMessage = (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        <AlertTitle>Duplicate Assets Found</AlertTitle>
                        {invalidItems.length} serials already exist in the system: <TruncatedSerialList items={invalidItems} title="Duplicate Assets" />
                    </Alert>
                );
            }
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assets for {productName} <Chip label={receivingStrategy} size="small" sx={{ml: 1}} /></DialogTitle>
            <DialogContent dividers>
                {/* B. Verification Warning Bar (The User Request) */}
                {hasUnverifiedItems && serials.length > 0 && (
                    <Box>
                        <Alert
                        severity="info"
                        icon={<InfoIcon/>}
                        action={
                            <Button color="inherit" size="small" onClick={() => mutation.mutate(serials)}>
                                Verify Now
                            </Button>
                        }
                    >
                        <AlertTitle>Verification Needed</AlertTitle>
                        List has changed. Please verify assets again.
                        </Alert>
                    </Box>
                )}                
                <Box sx={{ mb: 2 }}>
                    {errorMessage}
                    {warningMessage}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                    <TextField 
                        fullWidth size="small" label="Scan/Enter Serial Numbers" 
                        placeholder="Paste list here..." multiline maxRows={4}
                        value={currentSerial} onChange={(e) => setCurrentSerial(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }}}
                    />
                    <Button variant="outlined" onClick={handleAdd} disabled={serials.length >= maxQty} sx={{ height: 40 }}>Add</Button>
                </Box>
                
                <List dense sx={{ maxHeight: 250, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    {serials.map((item, idx) => {
                        // Check duplication against context
                        const isGlobalDuplicate = globalDuplicateItems.includes(item.serial_number);
                        const isBackendInvalid = invalidItems.includes(item.serial_number);
                        const isError = isGlobalDuplicate || isBackendInvalid;

                        return (
                            <ListItem
                                key={idx} divider 
                                sx={{ bgcolor: isError ? '#ffebee' : 'transparent' }}
                            >
                                <ListItemText 
                                    primary={item.serial_number} 
                                    primaryTypographyProps={{ 
                                        color: isError ? 'error' : 'textPrimary',
                                        fontWeight: isGlobalDuplicate ? 'bold' : 'normal'
                                    }}
                                    secondary={isGlobalDuplicate ? "Already in another line" : null}
                                    secondaryTypographyProps={{ color: 'error' }}
                                />
                                <ListItemSecondaryAction>
                                    {!isError && <CheckCircleOutlineIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />}
                                    <IconButton edge="end" size="small" onClick={handleDelete}>
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
                
                {isVerificationEnabled && (
                    <Button 
                        onClick={handleVerify}
                        disabled={mutation.isPending || serials.length === 0}
                    >
                        {mutation.isPending ? <CircularProgress size={20} /> : "Verify Assets"}
                    </Button>
                )}

                <Button 
                    onClick={handleSave} variant="contained" 
                    // Block save if invalid items exist
                    disabled={isVerificationEnabled && invalidItems.length > 0}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SerialNumberDialog;