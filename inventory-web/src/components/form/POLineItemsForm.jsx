import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    IconButton, TextField, Autocomplete, Box, Button, Typography, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { searchProducts } from '../../services/poService'; // Import the helper

const POLineItemsForm = () => {
    const { control, register, watch, setValue } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items" // Binds to the 'items' array in your form data
    });

    // Helper to handle product selection
    const handleProductSelect = (index, product) => {
        if (!product) return;
        setValue(`items.${index}.product_id`, product.product_id);
        setValue(`items.${index}.item_description`, product.name);
        setValue(`items.${index}.unit_price`, product.unit_price);
        setValue(`items.${index}.quantity`, 1); // Default to 1
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
                            <TableCell width="40%">Product</TableCell>
                            <TableCell width="15%" align="right">Qty</TableCell>
                            <TableCell width="15%" align="right">Unit Price</TableCell>
                            <TableCell width="15%" align="right">Total</TableCell>
                            <TableCell width="5%" align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fields.map((field, index) => {
                            // Watch values for live calculation
                            const qty = watch(`items.${index}.quantity`);
                            const price = watch(`items.${index}.unit_price`);
                            const total = (qty || 0) * (price || 0);

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        {/* Product Lookup */}
                                        <Autocomplete
                                            options={[]} // In real app, load async options here
                                            // For prototype, we mock the behavior:
                                            onOpen={async (e) => {
                                                // Trigger search logic
                                            }}
                                            onChange={(_, newValue) => handleProductSelect(index, newValue)}
                                            getOptionLabel={(option) => option.name || ""}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    {...register(`items.${index}.item_description`)}
                                                    placeholder="Search Product..." 
                                                    variant="standard" 
                                                    fullWidth
                                                />
                                            )}
                                            // Mocking options for demo
                                            options={[
                                                { product_id: 10, name: "Standard Widget A - Blue", unit_price: 12.50 },
                                                { product_id: 22, name: "Bulk Screws", unit_price: 0.99 }
                                            ]}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField 
                                            type="number"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                                            variant="standard"
                                            inputProps={{ style: { textAlign: 'right' } }} 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField 
                                            type="number"
                                            {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                            variant="standard"
                                            inputProps={{ style: { textAlign: 'right' } }} 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold">${total.toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="error" onClick={() => remove(index)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No items added. Click "Add Item" to start.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default POLineItemsForm;