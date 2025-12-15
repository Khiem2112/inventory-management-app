import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
    Box, Paper, Typography, Grid, TextField, Button, 
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; 
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { searchManifests } from '../services/grServices';

const DockReceivingSearch = ({ onManifestSelect }) => {
    const { register, handleSubmit, control } = useForm();
    
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
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary.main">
                    Find Inbound Manifest
                </Typography>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2} alignItems="flex-end">
                        {/* Row 1: IDs and Text */}
                        <Grid item xs={12} md={3}>
                            <TextField 
                                label="Manifest ID" 
                                fullWidth 
                                size="small" 
                                type="number"
                                {...register('manifest_id')} 
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField 
                                label="Supplier Name" 
                                fullWidth 
                                size="small" 
                                {...register('supplier_name')} 
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField 
                                label="Tracking / Ref #" 
                                fullWidth 
                                size="small" 
                                {...register('tracking_ref')} 
                            />
                        </Grid>
                        
                        {/* Row 2: Search Button */}
                        <Grid item xs={12} md={3}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                fullWidth 
                                size="large"
                                startIcon={<SearchIcon />}
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress />
                        </Box>
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