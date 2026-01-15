import { useState, useEffect, useMemo } from 'react';
import { 
    Box, TextField, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, List, ListItem, 
    ListItemText, Alert, AlertTitle, 
    Snackbar, Link, Typography, Chip, 
    Tooltip, Stack, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; 
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; 
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import BlockIcon from '@mui/icons-material/Block';
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
    initialSerials = [], 
    maxQty, 
    productName, 
    manifestLineId, 
    receivingStrategy 
}) => {
    const { getValues } = useFormContext() || {}; 
    
    // --- STATE ---
    const [serials, setSerials] = useState([]);
    const [currentSerial, setCurrentSerial] = useState("");
    const [needsVerification, setNeedsVerification] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    // Helper: Check strategy
    const isAssetSpecified = receivingStrategy === 'asset_specified';

    // --- INITIALIZATION ---
    useEffect(() => {
        if (open) {
            const formatted = initialSerials.map(s => {
                if (typeof s === 'string') {
                    return { serial_number: s, status: 'pending', isAccepted: true };
                }
                return { 
                    ...s, 
                    status: s.status || 'pending', 
                    isAccepted: s.isAccepted !== undefined ? s.isAccepted : true 
                };
            });
            setSerials(formatted);
            setNeedsVerification(false);
            setCurrentSerial("");
            mutation.reset(); 
        }
    }, [open]);

    // --- MUTATION ---
    const mutation = useMutation({
        mutationFn: ({ assets }) => {
            const cleanAssetsArray = assets.map(s => ({ serial_number: s.serial_number }));

            if (isAssetSpecified) {
                return verifyShipmentLineAssets({ 
                    line_id: manifestLineId, 
                    assets: cleanAssetsArray 
                });
            } else {
                return verifyAssetsExistence(cleanAssetsArray);
            }
        },
        onSuccess: (data) => {
            let badSerials = [];
            let goodSerials = [];
            
            if (isAssetSpecified) {
                badSerials = data.redundant_asset_serials || [];
                goodSerials = data.matched_asset_serials || [];
            } else {
                badSerials = data.existed_asset_serials || [];
                goodSerials = data.new_asset_serials || [];
            }

            setSerials(prev => prev.map(item => {
                const sn = item.serial_number;
                
                if (badSerials.includes(sn)) {
                    // Invalid items are auto-rejected ONLY if we are in asset_specified mode
                    // or if logic dictates. For now, we set isAccepted false for bad items
                    // but the UI visibility depends on the flag.
                    return { ...item, status: 'invalid', isAccepted: false };
                }
                if (goodSerials.includes(sn)) {
                    return { ...item, status: 'valid', isAccepted: true };
                }
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

        if (maxQty && serials.length + uniqueNewItems.length > maxQty) {
            const remainingSpace = maxQty - serials.length;
            setSnackbar({
                open: true,
                message: `Cannot add ${uniqueNewItems.length} items. Only ${remainingSpace} slots remaining.`
            });
            return; 
        }

        const newObjects = uniqueNewItems.map(sn => ({ 
            serial_number: sn, 
            status: 'pending', 
            isAccepted: true 
        }));
        
        setSerials([...serials, ...newObjects]);
        setCurrentSerial("");
        setNeedsVerification(true);
    };

    const handleDelete = (index) => {
        const newList = [...serials];
        newList.splice(index, 1);
        setSerials(newList);
        setNeedsVerification(true);
    };

    const toggleAcceptance = (index) => {
        const newList = [...serials];
        newList[index].isAccepted = !newList[index].isAccepted;
        setSerials(newList);
    };

    // --- COMPUTED LISTS ---
    const getGlobalDuplicates = () => {
        if (!getValues) return new Set();
        const allLines = getValues('lines') || [];
        const otherSerials = new Set();
        allLines.forEach(line => {
            if (line.id !== manifestLineId && line.asset_items) {
                line.asset_items.forEach(item => {
                    const sn = typeof item === 'string' ? item : item.serial_number;
                    if (sn) otherSerials.add(sn);
                });
            }
        });
        return new Set([...otherSerials]);
    };
    
    const globalDuplicateSet = useMemo(() => getGlobalDuplicates(), [serials]);

    const duplicateList = serials
        .filter(s => globalDuplicateSet.has(s.serial_number))
        .map(s => s.serial_number);
        
    const invalidList = serials
        .filter(s => s.status === 'invalid')
        .map(s => s.serial_number);

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
                        <Alert severity="warning">
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
                        const isGlobalDuplicate = globalDuplicateSet.has(item.serial_number);
                        const isBackendInvalid = item.status === 'invalid';
                        const isBackendValid = item.status === 'valid';
                        const isPending = item.status === 'pending';
                        
                        const isAccepted = item.isAccepted;

                        // --- STYLING LOGIC ---
                        const rowBgColor = isGlobalDuplicate 
                            ? '#ffebee' 
                            : isBackendInvalid 
                                ? '#fff3e0' 
                                : 'transparent';
                        
                        // Condition styling on Strategy: Only strike/red if asset_specified AND rejected
                        const showRejectionStyle = isAssetSpecified && !isAccepted;
                        
                        const textColor = showRejectionStyle ? 'error.main' : 'text.primary';
                        const textDecoration = showRejectionStyle ? 'line-through' : 'none';

                        return (
                            <ListItem key={idx} divider sx={{ bgcolor: rowBgColor }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    
                                    {/* SERIAL NUMBER & STATUS CHIPS */}
                                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ 
                                                textDecoration: textDecoration,
                                                color: textColor,
                                                fontWeight: isBackendValid ? 'bold' : 'normal',
                                                mr: 1
                                            }}
                                        >
                                            {item.serial_number}
                                        </Typography>
                                        
                                        {/* Status Tags */}
                                        {isGlobalDuplicate && <Chip label="Duplicate" color="error" size="small" variant="outlined" icon={<WarningAmberIcon />} />}
                                        
                                        {isBackendInvalid && (
                                            <Chip 
                                                label="Invalid" 
                                                color="warning" 
                                                size="small" 
                                                variant="outlined" 
                                                icon={<ErrorOutlineIcon />} 
                                            />
                                        )}
                                        
                                        {isBackendValid && (
                                            <Chip 
                                                label="Verified" 
                                                color="success" 
                                                size="small" 
                                                variant="outlined" 
                                                icon={<CheckCircleIcon />} 
                                            />
                                        )}
                                        
                                        {/* Show Rejected Chip ONLY if strategy is asset_specified */}
                                        {isAssetSpecified && !isAccepted && (
                                            <Chip 
                                                label="Rejected" 
                                                color="error" 
                                                size="small" 
                                                variant="outlined" 
                                                icon={<BlockIcon />} 
                                            />
                                        )}
                                        
                                        {isPending && <Chip label="Pending" size="small" variant="outlined" />}
                                    </Box>

                                    {/* ACTIONS */}
                                    <Stack direction="row" spacing={0.5}>
                                        {/* Toggle Button ONLY if strategy is asset_specified */}
                                        {isAssetSpecified && (
                                            <Tooltip title={isAccepted ? "Reject" : "Accept"}>
                                                <IconButton size="small" onClick={() => toggleAcceptance(idx)}>
                                                    {isAccepted 
                                                        ? <ThumbUpIcon color="success" fontSize="small" /> 
                                                        : <ThumbDownIcon color="error" fontSize="small" />
                                                    }
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        <IconButton size="small" onClick={() => handleDelete(idx)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                
                <Button 
                    onClick={() => mutation.mutate({ assets: serials })}
                    disabled={mutation.isPending || serials.length === 0}
                >
                    {mutation.isPending ? "Checking..." : "Verify Assets"}
                </Button>
                
                <Tooltip title="Save changes" placement="right">
                    <span>
                        <Button 
                            onClick={() => onSave(serials)} 
                            variant="contained" 
                            disabled={needsVerification}
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