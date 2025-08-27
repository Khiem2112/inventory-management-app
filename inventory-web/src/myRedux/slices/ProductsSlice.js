// src/redux/slices/productSlice.js

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api.js";

// Async thunks for all API operations
export const fetchAllProductsAsync = createAsyncThunk(
    'products/fetchAllProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/all/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchOneProductAsync = createAsyncThunk(
    'products/fetchOneProductAsync',
    async (productId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/products/${productId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
);

export const addNewProductAsync = createAsyncThunk(
    'products/addNewProduct',
    async (newProductData, { rejectWithValue }) => {
        try {
            const response = await api.post('/products/', newProductData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
);

export const updateProductAsync = createAsyncThunk(
    'products/updateProduct',
    async ({ productId, updatedProductData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/products/${productId}`, updatedProductData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
);

export const deleteProductAsync = createAsyncThunk(
    'products/deleteProduct',
    async (productId, { rejectWithValue }) => {
        try {
            await api.delete(`/products/${productId}`);
            return productId;
        } catch (error) {
            return rejectWithValue(error.response.data || error.message);
        }
    }
);

const initialState = {
    items: [],
    status: {
        getAll: 'idle',
        getOne: 'idle',
        addOne: 'idle',
        updateOne: 'idle',
        deleteOne: 'idle'
    },
    error: {
        getAll: null,
        getOne: null,
        addOne: null,
        updateOne: null,
        deleteOne: null
    },
    selectedProduct: null,
};

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        // Only keep synchronous reducers that are NOT handled by a thunk
        resetStatus: (state) => {
            state.status.getAll = 'idle';
            state.status.getOne = 'idle';
            state.selectedProduct = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handling fetchAllProductsAsync
            .addCase(fetchAllProductsAsync.pending, (state) => {
                state.status.getAll = 'loading';
                state.error.getAll = null;
            })
            .addCase(fetchAllProductsAsync.fulfilled, (state, action) => {
                state.status.getAll = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchAllProductsAsync.rejected, (state, action) => {
                state.status.getAll = 'failed';
                state.error.getAll = action.payload || action.error.message;
            })
            // Handling fetchOneProductAsync
            .addCase(fetchOneProductAsync.pending, (state) => {
                state.status.getOne = 'loading';
                state.error.getOne = null;
            })
            .addCase(fetchOneProductAsync.fulfilled, (state, action) => {
                state.status.getOne = 'succeeded';
                state.selectedProduct = action.payload;
            })
            .addCase(fetchOneProductAsync.rejected, (state, action) => {
                state.status.getOne = 'failed';
                state.error.getOne = action.payload || action.error.message;
            })
            // Handling addNewProductAsync
            .addCase(addNewProductAsync.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            // Handling updateProductAsync
            .addCase(updateProductAsync.fulfilled, (state, action) => {
                const index = state.items.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            // Handling deleteProductAsync
            .addCase(deleteProductAsync.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.id !== action.payload);
            });
    },
});

// Export the synchronous action creators and the main reducer
export const { resetStatus } = productsSlice.actions;
export default productsSlice.reducer;