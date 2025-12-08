import React, { useState, useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    IconButton, TextField, Autocomplete, Box, Button, Typography, Paper,
    CircularProgress, Tooltip, Avatar, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { searchProducts } from '../../services/poService';

const POLineItemsForm = () => {
    const { control, register, watch, setValue, getValues} = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Local state for product options to avoid re-fetching on every row
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    // Product duplicate error
    const [duplicateError, setDuplicateError] = useState({ open: false, message: '' });

    // Fetch products once when component mounts or on first interaction
    // Optimization: Since the API returns ALL products, we fetch once and let MUI filter client-side.
    const loadProducts = async () => {
        if (productOptions.length > 0) return; // Already loaded

        setLoadingProducts(true);
        try {
            // Pass empty string to get all products mapped correctly
            const results = await searchProducts(""); 
            setProductOptions(results);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Make close the current duplicate error
    const handleCloseToast = () => {
        setDuplicateError({ ...duplicateError, open: false });
    };

    const handleProductSelect = (index, product) => {
    // Helper to clear the line
    const emptyLine = () => {
        setValue(`items.${index}.product_id`, '');
        setValue(`items.${index}.item_description`, '');
        setValue(`items.${index}.unit_price`, 0); // Or undefined/null based on requirements
    };

    // 1. Handle Clear Action
    if (!product) {
        emptyLine();
        return;
    }

    // 2. Get LIVE data (Crucial Fix: Use getValues instead of fields)
    const currentItems = getValues("items") || []; 
    
    // 3. Check for duplicates
    // We look for ANY item that has the same ID but is NOT the current row
    const isDuplicate = currentItems.some((item, idx) => 
        idx !== index && String(item.product_id) === String(product.product_id)
    );

    if (isDuplicate) {
        // DUPLICATE FOUND
        setDuplicateError({
                open: true,
                message: `The product "${product.name}" is already in the list.`
            });
            
            // Clear the selection
            emptyLine();
            return; 
    }

    // 4. NO DUPLICATE - Proceed to set values
    setValue(`items.${index}.product_id`, product.product_id);
    setValue(`items.${index}.item_description`, product.name);
    setValue(`items.${index}.unit_price`, product.unit_price);

    // 5. Default Quantity Logic (Using getValues for consistency)
    const currentQty = getValues(`items.${index}.quantity`);
    if (!currentQty || currentQty <= 0) {
        setValue(`items.${index}.quantity`, 1);
    }
};

    return (
        <Paper variant="outlined" sx={{ mt: 3, mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" fontWeight="bold">Line Items</Typography>
                <Button 
                    startIcon={<AddCircleOutlineIcon />} 
                    variant="contained" 
                    size="small"
                    onClick={() => append({ product_id: '', quantity: 0, unit_price: 0, item_description: '' })}
                >
                    Add Item
                </Button>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width="40%">Product Details</TableCell>
                            <TableCell width="15%" align="right">Qty</TableCell>
                            <TableCell width="15%" align="right">Unit Price</TableCell>
                            <TableCell width="15%" align="right">Total</TableCell>
                            <TableCell width="5%" align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fields.map((field, index) => {
                            // Watch for live calculations
                            const qty = watch(`items.${index}.quantity`);
                            const price = watch(`items.${index}.unit_price`);
                            const total = (qty || 0) * (price || 0);

                            return (
                                <TableRow key={field.id} sx={{ '& td': { verticalAlign: 'top', pt: 2 } }}>
                                    <TableCell>
                                        <Autocomplete
                                            options={productOptions}
                                            loading={loadingProducts}
                                            onOpen={loadProducts}
                                            // Define how options look in the dropdown
                                            getOptionLabel={(option) => {
                                                // Handle case where value might be just the name string initially
                                                return typeof option === 'string' ? option : option.name || "";
                                            }}
                                            // Custom rendering for dropdown options (Image + SKU + Name)
                                            renderOption={(props, option) => {
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={option.product_id} {...otherProps}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                            <Avatar 
                                                                src={option.image_url} 
                                                                variant="rounded" 
                                                                sx={{ width: 40, height: 40 }}
                                                            >
                                                                {option.sku?.[0]}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {option.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    SKU: {option.sku} | Cost: ${option.unit_price}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </li>
                                                );
                                            }}
                                            onChange={(_, newValue) => handleProductSelect(index, newValue)}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    {...register(`items.${index}.item_description`, { required: "Required" })}
                                                    placeholder="Search SKU or Name..." 
                                                    variant="standard" 
                                                    fullWidth
                                                    error={!!watch(`items.${index}.item_description`) === false} // Simple validation visual
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <React.Fragment>
                                                                {loadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </React.Fragment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                        {/* Hidden field to store the actual ID */}
                                        <input type="hidden" {...register(`items.${index}.product_id`)} />
                                    </TableCell>
                                    
                                    <TableCell align="right">
                                        <TextField 
                                            type="number"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                                            variant="standard"
                                            inputProps={{ style: { textAlign: 'right' }, min: 1 }} 
                                            placeholder="0"
                                        />
                                    </TableCell>
                                    
                                    <TableCell align="right">
                                        <TextField 
                                            type="number"
                                            {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                            variant="standard"
                                            inputProps={{ style: { textAlign: 'right' }, step: "0.01" }} 
                                            placeholder="0.00"
                                        />
                                    </TableCell>
                                    
                                    <TableCell align="right">
                                        <Typography fontWeight="bold" sx={{ mt: 1 }}>
                                            ${total.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    
                                    <TableCell align="center">
                                        <Tooltip title="Remove Item">
                                            <IconButton 
                                                size="small" 
                                                color="error" 
                                                onClick={() => remove(index)}
                                                sx={{ mt: 0.5 }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary', bgcolor: '#fafafa' }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>No items added yet.</Typography>
                                    <Button 
                                        variant="outlined" 
                                        size="small" 
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={() => append({ product_id: '', quantity: 0, unit_price: 0, item_description: '' })}
                                    >
                                        Add First Item
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Toast Notification for Duplicates */}
            <Snackbar 
                open={duplicateError.open} 
                autoHideDuration={4000} 
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseToast} severity="warning" sx={{ width: '100%' }}>
                    {duplicateError.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default POLineItemsForm;