import { useState, useEffect } from 'react';
import { 
    Box, TextField, Button, CircularProgress, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, List, ListItem, 
    ListItemText, ListItemSecondaryAction, Alert, AlertTitle, 
    Snackbar, Link, Typography, Chip, 
    Tooltip, Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // For Duplicates
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For Invalid
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // For Valid
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // For Pending
import { useMutation } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form'; 
import { verifyShipmentLineAssets, verifyAssetsExistence } from '../../services/grServices';

// --- Sub-Component: Detail View for Long Lists ---
const SerialDetailDialog = ({ open, onClose, title, items }) => {
    const [copyFeedback, setCopyFeedback] = useState(false);

    const handleCopy = () => {
        if (items && items.length > 0) {
            const textToCopy = items.join('\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
            });
        }
    };
    return(
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {title}
                <IconButton onClick={handleCopy} size="small" title="Copy list">
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <List dense>
                    {items.map((item, idx) => (
                        <ListItem key={idx} divider>
                            <ListItemText primary={item} />
                        </ListItem>
                    ))}
                </List>
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
};

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

// --- Main Component ---
const SerialNumberDialog = ({ 
    open, onClose, onSave, 
    initialSerials = [], maxQty, productName, manifestLineId, receivingStrategy 
}) => {
    const { getValues } = useFormContext(); 
    
    // --- STATE ---
    const [serials, setSerials] = useState([]);
    const [currentSerial, setCurrentSerial] = useState("");
    const [needsVerification, setNeedsVerification] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    console.log(`Current serials: `, serials)

    // --- INITIALIZATION ---
    useEffect(() => {
        if (open) {
            setSerials(initialSerials.map(s => ({ 
                serial_number: s.serial_number, 
                status: 'pending' 
            })));
            setNeedsVerification(false);
            setCurrentSerial("");
            mutation.reset(); 
        }
    }, [open, initialSerials]);

    // --- MUTATION ---
    const mutation = useMutation({
        // FIX: We destructure { assets } because your onClick passes an object.
        mutationFn: ({ assets }) => {
            // 1. Prepare the clean array of objects required by both services
            const cleanAssetsArray = assets.map(s => ({ serial_number: s.serial_number }));

            // 2. Branch Logic based on Strategy
            if (receivingStrategy === 'asset_specified') {
                // Strategy A: Shipment Line Verification (needs line_id wrapper)
                return verifyShipmentLineAssets({ 
                    line_id: manifestLineId, 
                    assets: cleanAssetsArray 
                });
            } else {
                // Strategy B: Asset Existence/Uniqueness (needs array directly)
                return verifyAssetsExistence(cleanAssetsArray);
            }
        },
        onSuccess: (data) => {
            let badSerials = [];
            let goodSerials = [];
            
            // Handle different response keys from the two services
            if (receivingStrategy === 'asset_specified') {
                badSerials = data.redundant_asset_serials || [];
                goodSerials = data.matched_asset_serials || [];
            } else {
                badSerials = data.existed_asset_serials || [];
                goodSerials = data.new_asset_serials || [];
            }

            setSerials(prev => prev.map(item => {
                if (badSerials.includes(item.serial_number)) return { ...item, status: 'invalid' };
                if (goodSerials.includes(item.serial_number)) return { ...item, status: 'valid' };
                return item;
            }));

            setNeedsVerification(false);
        },
        onError: (error) => {
            console.error("Verification failed", error);
            setSnackbar({ open: true, message: "Verification failed. Please check connection." });
        }
    });

    // --- HANDLERS ---
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const handleAdd = () => {
        const rawInput = currentSerial;
        if (!rawInput.trim()) return;

        const rawItems = rawInput
            .split(/[\n, ]+/)
            .map(s => s.trim())
            .filter(s => s !== "");

        if (rawItems.length === 0) return;

        const uniqueNewItems = rawItems.filter(newItem => 
            !serials.some(s => s.serial_number === newItem)
        );

        if (uniqueNewItems.length === 0) {
            setSnackbar({ open: true, message: "All items entered are already in the list." });
            setCurrentSerial("");
            return;
        }

        if (serials.length + uniqueNewItems.length > maxQty) {
            const remainingSpace = maxQty - serials.length;
            setSnackbar({
                open: true,
                message: `Cannot add ${uniqueNewItems.length} items. Only ${remainingSpace} slots remaining.`
            });
            return; 
        }

        const newObjects = uniqueNewItems.map(sn => ({ serial_number: sn, status: 'pending' }));
        setSerials([...serials, ...newObjects]);
        setCurrentSerial("");
        setNeedsVerification(true);

        if (rawItems.length > uniqueNewItems.length) {
            const ignoredCount = rawItems.length - uniqueNewItems.length;
            setSnackbar({
                open: true,
                message: `Added ${uniqueNewItems.length} items. ${ignoredCount} duplicates ignored.`
            });
        }
    };

    const handleDelete = (index) => {
        const newList = [...serials];
        newList.splice(index, 1);
        setSerials(newList);
        setNeedsVerification(true);
    };

    // --- COMPUTED LISTS ---
    const getGlobalDuplicates = () => {
        const allLines = getValues('lines') || [];
        const otherSerials = new Set();
        allLines.forEach(line => {
            if (line.id !== manifestLineId && line.asset_items) {
                line.asset_items.forEach(item => {
                    if (item.serial_number) otherSerials.add(item.serial_number);
                });
            }
        });
        return new Set([...otherSerials]);
    };
    const globalDuplicateSet = getGlobalDuplicates();

    const duplicateList = serials.filter(s => globalDuplicateSet.has(s.serial_number)).map(s => s.serial_number);
    const invalidList = serials.filter(s => s.status === 'invalid').map(s => s.serial_number);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assets for {productName}</DialogTitle>
            <DialogContent dividers>
                
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {duplicateList.length > 0 && (
                        <Alert severity="error">
                            <AlertTitle>Duplicate Scanning</AlertTitle>
                            Found in other lines: <TruncatedSerialList items={duplicateList} title="Cross-Line Duplicates" />
                        </Alert>
                    )}

                    {needsVerification && serials.length > 0 && (
                        <Alert 
                            severity="info" 
                            icon={<InfoIcon />}
                            action={
                                <Button color="inherit" size="small" onClick={() => mutation.mutate({ assets: serials })}>
                                    Verify Now
                                </Button>
                            }
                        >
                            <AlertTitle>Verification Needed</AlertTitle>
                            List has changed. Please verify assets again.
                        </Alert>
                    )}

                    {invalidList.length > 0 && !needsVerification && (
                        <Alert severity="error">
                            <AlertTitle>Invalid Serials</AlertTitle>
                            Please remove items: <TruncatedSerialList items={invalidList} title="Invalid Items" />
                        </Alert>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField 
                         value={currentSerial} 
                         onChange={(e) => setCurrentSerial(e.target.value)}
                         onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleAdd();
                             }
                         }}
                         placeholder="Scan or paste serials..." 
                         fullWidth size="small"
                         multiline maxRows={4}
                    />
                    <Button onClick={handleAdd} variant="outlined">Add</Button>
                </Box>
                
                <List dense sx={{ maxHeight: 250, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    {serials.map((item, idx) => {
                        // Calculate Independent States
                        const isGlobalDuplicate = globalDuplicateSet.has(item.serial_number);
                        const isBackendInvalid = item.status === 'invalid';
                        const isBackendValid = item.status === 'valid';
                        const isPending = item.status === 'pending';
                        
                        // Row Color Logic: Red if ANY error exists
                        const hasError = isGlobalDuplicate || isBackendInvalid;
                        const rowBgColor = hasError ? '#ffebee' : (isBackendValid ? '#e8f5e9' : 'transparent');
                        console.log(`Handle row ${idx} where those logic is `)

                        return (
                            <ListItem key={idx} divider sx={{ bgcolor: rowBgColor }}>
                                <ListItemText 
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
                                            <Typography variant="body2">{item.serial_number}</Typography>
                                            
                                            {/* VISUAL TAGS FOR STATUS */}
                                            <Stack direction="row" spacing={1}>
                                                
                                                {/* 1. FE Integrity Tag */}
                                                {isGlobalDuplicate && (
                                                    <Chip 
                                                        label="Duplicate" 
                                                        color="error" 
                                                        size="small" 
                                                        icon={<WarningAmberIcon />}
                                                        variant="outlined"
                                                    />
                                                )}

                                                {/* 2. BE Integrity Tag */}
                                                {isBackendInvalid && (
                                                    <Chip 
                                                        label="Invalid" 
                                                        color="error" 
                                                        size="small" 
                                                        icon={<ErrorOutlineIcon />} 
                                                        variant="outlined"
                                                    />
                                                )}
                                                {isBackendValid && (
                                                    <Chip 
                                                        label="Verified" 
                                                        color="success" 
                                                        size="small" 
                                                        icon={<CheckCircleIcon />} 
                                                        variant="outlined"
                                                    />
                                                )}
                                                {isPending && (
                                                    <Chip 
                                                        label="Pending" 
                                                        size="small" 
                                                        icon={<HelpOutlineIcon />} 
                                                        variant="outlined"
                                                        sx={{ borderColor: 'text.disabled', color: 'text.secondary' }}
                                                    />
                                                )}
                                            </Stack>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" size="small" onClick={() => handleDelete(idx)}>
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
                
                <Button 
                    // This matches the structure in mutationFn
                    onClick={() => mutation.mutate({ assets: serials })}
                    disabled={mutation.isPending || serials.length === 0}
                >
                    {mutation.isPending ? "Checking..." : "Verify Assets"}
                </Button>
                <Tooltip title={invalidList.length > 0 
                            ? "Fix invalid serials" 
                            : duplicateList.length > 0 
                            ? "Remove duplicates" 
                            : needsVerification 
                            ? "Verify serials" 
                            : "Save"} placement="right">
                    <span style={{ display: 'inline-block' }}>
                        <Button 
                        onClick={() => onSave(serials)} 
                        variant="contained" 
                        disabled={invalidList.length > 0 || duplicateList.length > 0 || needsVerification}
                    >
                        Save
                        </Button>

                    </span>
                    
                </Tooltip>
                
            </DialogActions>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="warning" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default SerialNumberDialog;