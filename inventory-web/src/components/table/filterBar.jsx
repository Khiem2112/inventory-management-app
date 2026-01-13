import React, { useState, useMemo } from 'react';
import { 
    Box, TextField, MenuItem, Button, Menu, 
    Checkbox, FormControlLabel, Divider, Stack, Typography, 
    IconButton, Tooltip, useTheme
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PO_COLUMNS_CONFIG } from '../../services/poService';
import dayjs from 'dayjs';

/**
 * MUI Refactored Column Toggler
 */
const ColumnToggler = ({ allColumnsConfig, onToggle }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Sync keys with parent config
    const activeVisibleKeys = useMemo(() => 
        allColumnsConfig.filter(c => c.isVisible).map(c => c.key), 
        [allColumnsConfig]
    );
    
    const [pendingKeys, setPendingKeys] = useState(activeVisibleKeys);

    const handleOpen = (event) => {
        setPendingKeys(activeVisibleKeys);
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => 
    {
      setPendingKeys(activeVisibleKeys)
      setAnchorEl(null)
    }

    const handleCheckboxChange = (key, isRequired) => {
        setPendingKeys(prev => {
            if (prev.includes(key)) {
                if (isRequired) return prev; // Cannot remove required columns
                return prev.filter(k => k !== key);
            }
            return [...prev, key];
        });
    };

    const handleApply = () => {
        onToggle(pendingKeys);
        handleClose();
    };

    const handleReset = () => {
        const defaultKeys = PO_COLUMNS_CONFIG.filter(c => c.isVisible).map(c => c.key);
        setPendingKeys(defaultKeys);
    };

    return (
        <Box>
            <Button 
                variant="outlined" 
                startIcon={<ViewColumnIcon />} 
                onClick={handleOpen}
                sx={{ height: 40, fontWeight: 600 }}
            >
                Columns
            </Button>
            <Menu 
                anchorEl={anchorEl} 
                open={open} 
                onClose={handleClose}
                PaperProps={{ sx: { p: 1, minWidth: 250, mt: 1, boxShadow: 3 } }}
            >
                <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    Visible Columns
                </Typography>
                <Divider sx={{ mb: 1 }} />
                
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {allColumnsConfig.map(col => (
                        <MenuItem key={col.key} sx={{ py: 0 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        size="small" 
                                        checked={pendingKeys.includes(col.key)} 
                                        onChange={() => handleCheckboxChange(col.key, col.isRequired)}
                                        disabled={col.isRequired && pendingKeys.includes(col.key)}
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        {col.label} {col.isRequired && <span style={{fontSize: '0.7rem', opacity: 0.6}}>(Req)</span>}
                                    </Typography>
                                }
                                sx={{ width: '100%', mr: 0 }}
                            />
                        </MenuItem>
                    ))}
                </Box>
                
                <Divider sx={{ mt: 1 }} />
                <Stack direction="row" spacing={1} sx={{ p: 1 }}>
                    <Tooltip title="Reset to default">
                        <IconButton size="small" onClick={handleReset}><RestartAltIcon /></IconButton>
                    </Tooltip>
                    <Button fullWidth size="small" onClick={handleClose} color="inherit">Cancel</Button>
                    <Button fullWidth size="small" variant="contained" onClick={handleApply}>Apply</Button>
                </Stack>
            </Menu>
        </Box>
    );
};

/**
 * FilterBar Component
 * Note: Removed the outer Paper wrapper to allow flexible layout in parent.
 */
const FilterBar = ({ 
    onSupplierChange, 
    onStatusChange,
    onStartDateChange, 
    onEndDateChange,  
    startDate,         
    endDate,
    initialSupplierId,
    initialStatus,
    onColumnToggle, 
    allColumnsConfig, 
    suppliers = [], 
    statuses = [] 
}) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center" 
            lexWrap="nowrap" 
            sx={{ 
                width: '100%', 
                overflowX: 'auto',
                py: 1, 
                px: 1 
                }}>
                {/* Header Icon */}
                <FilterListIcon color="action" sx={{ mr: 1, flexShrink: 0 }} />

                {/* Vendor Filter */}
                <TextField
                    select
                    label="Vendor"
                    size="small"
                    value={initialSupplierId || ""}
                    onChange={(e) => onSupplierChange(Number(e.target.value))}
                    sx={{ minWidth: 200, flexShrink: 0 }}
                >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map(s => (
                        <MenuItem key={s.supplier_id} value={s.supplier_id}>
                            {s.name || "Unknown Supplier"}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Status Filter */}
                <TextField
                    select
                    label="Status"
                    size="small"
                    value={initialStatus || ""}
                    onChange={(e) => onStatusChange(e.target.value)}
                    sx={{ minWidth: 160, flexShrink: 0 }}
                >
                    <MenuItem value="">All Statuses</MenuItem>
                    {statuses.map(status => (
                        <MenuItem key={status} value={status}>
                            {status}
                        </MenuItem>
                    ))}
                </TextField>

                {/* Start Date Filter */}
                <DatePicker
                    label="From"
                    value={startDate ? dayjs(startDate) : null}
                    onChange={(newValue) => onStartDateChange(newValue ? newValue.format('YYYY-MM-DD') : null)}
                    slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
                />

                {/* End Date Filter */}
                <DatePicker
                    label="To"
                    value={endDate ? dayjs(endDate) : null}
                    onChange={(newValue) => onEndDateChange(newValue ? newValue.format('YYYY-MM-DD') : null)}
                    slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
                />

                {/* Spacer to push Toggler to the right */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Column Selection */}
                <Box 
                sx={{ 
                    flexShrink: 0,
                    marginLeft: 'auto'
                    }}>
                    <ColumnToggler 
                        allColumnsConfig={allColumnsConfig} 
                        onToggle={onColumnToggle} 
                    />
                </Box>
            </Stack>
        </LocalizationProvider>
        
    );
};

export default FilterBar;