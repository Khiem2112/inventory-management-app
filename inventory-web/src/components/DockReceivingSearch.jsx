import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
    Box, Paper, Typography, TextField, Button, 
    Dialog, DialogTitle, DialogContent, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, IconButton, Divider, Stack 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterAltIcon from '@mui/icons-material/FilterAlt'; 
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { searchManifests } from '../services/grServices';

const DockReceivingSearch = ({ onManifestSelect }) => {
    const { register, handleSubmit } = useForm();
    
    // --- State ---
    const [isModalOpen, setModalOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- Handlers ---
    const onSubmit = async (data) => {
        setIsSearching(true);
        setModalOpen(true); 
        try {
            const results = await searchManifests(data);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (manifest) => {
        setModalOpen(false);
        onManifestSelect(manifest); 
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            {/* Visual Container: Paper handles the "card" look */}
            <Paper 
                elevation={2} 
                sx={{
                    height: '100%', 
                    bgcolor: 'background.paper', // THEME COLOR
                    p: 2 
                }}
            >
                {/* Header: Replaced Flex Box with Stack */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <FilterAltIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Search Filters
                    </Typography>
                </Stack>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Form Layout: Replaced Grid with vertical Stack for cleaner sidebar look */}
                    <Stack spacing={2}>
                        <TextField 
                            label="Manifest ID" 
                            fullWidth 
                            size="small" 
                            type="number"
                            placeholder="e.g. 12"
                            {...register('manifest_id')} 
                        />
                        <TextField 
                            label="Supplier Name" 
                            fullWidth 
                            size="small" 
                            placeholder="e.g. ConnectAll"
                            {...register('supplier_name')} 
                        />
                        <TextField 
                            label="Tracking / Ref #" 
                            fullWidth 
                            size="small" 
                            placeholder="e.g. TN211..."
                            {...register('tracking_ref')} 
                        />
                        
                        <Box>
                            <Divider sx={{ mb: 2 }} />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                fullWidth 
                                size="large"
                                startIcon={<SearchIcon />}
                            >
                                Find Manifests
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </Paper>

            {/* --- SEARCH RESULTS MODAL --- */}
            <Dialog 
                open={isModalOpen} 
                onClose={() => setModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Select Manifest to Receive
                    <IconButton onClick={() => setModalOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent dividers>
                    {isSearching ? (
                        <Stack alignItems="center" sx={{ p: 5 }}>
                            <CircularProgress />
                        </Stack>
                    ) : searchResults.length === 0 ? (
                        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                            No manifests found matching your criteria.
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Manifest Code</TableCell>
                                        <TableCell>Supplier</TableCell>
                                        <TableCell>Tracking #</TableCell>
                                        <TableCell>Est. Arrival</TableCell>
                                        <TableCell align="right">Items</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {searchResults.map((row) => (
                                        <TableRow key={row.manifest_id} hover>
                                            <TableCell fontWeight="bold">{row.display_id}</TableCell>
                                            <TableCell>{row.supplier_name}</TableCell>
                                            <TableCell>{row.tracking_ref}</TableCell>
                                            <TableCell>{row.expected_date}</TableCell>
                                            <TableCell align="right">{row.item_count}</TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    endIcon={<ArrowForwardIcon />}
                                                    onClick={() => handleSelect(row)}
                                                >
                                                    Select
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
            </Dialog>
        </LocalizationProvider>
    );
};

export default DockReceivingSearch;