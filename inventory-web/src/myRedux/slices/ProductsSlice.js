// src/redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api'; // Assuming you have an api service

// 💡 1. Create a thunk to fetch all products
export const fetchProductsAsync = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/all/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// 💡 2. Create a thunk to add a new product
export const addNewProductAsync = createAsyncThunk(
    'products/addNewProduct',
    async (newProductData, { rejectWithValue }) => {
        try {
            const response = await api.post('/products', newProductData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// 💡 3. Create a thunk to update a product
export const updateProductAsync = createAsyncThunk(
    'products/updateProduct',
    async ({ productId, updatedProductData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/products/${productId}`, updatedProductData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// 💡 4. Create a thunk to delete a product
export const deleteProductAsync = createAsyncThunk(
    'products/deleteProduct',
    async (productId, { rejectWithValue }) => {
        try {
            await api.delete(`/products/${productId}`);
            return productId;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    items: [],
    status: 'idle',
    error: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {}, // No reducers needed for async operations
    // 💡 Add extraReducers to handle the lifecycle of our thunks
    extraReducers: (builder) => {
        builder
            // Handle fetchProductsAsync
            .addCase(fetchProductsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProductsAsync.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload; // Update the products array
            })
            .addCase(fetchProductsAsync.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Handle addNewProductAsync
            .addCase(addNewProductAsync.fulfilled, (state, action) => {
                state.items.push(action.payload); // Add the new product to the state
            })
            // Handle updateProductAsync
            .addCase(updateProductAsync.fulfilled, (state, action) => {
                const index = state.items.findIndex(p => p.ProductId === action.payload.ProductId);
                if (index !== -1) {
                    state.items[index] = action.payload; // Update the product in the state
                }
            })
            // Handle deleteProductAsync
            .addCase(deleteProductAsync.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.ProductId !== action.payload); // Remove the deleted product
            });
    },
});

export default productSlice.reducer;