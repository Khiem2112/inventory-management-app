// src/redux/slices/productSlice.js

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api.js";
import { wsConnectStart, 
         wsConnectSuccess, 
         wsConnectError, 
         wsDisconnect,
         wsMessageReceive } from "../action/wsActions.js";
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
export const fetchSomeProductsAsync = createAsyncThunk(
    'products/fetchSomeProducts',
    async (params = {page : 1, limit : 10}, {rejectWithValue}) => {
        try {
            console.log('toi dang duoc goi nef ba con oi')
            const response = await api.get(`/products/`, {params})
            return response.data
        }
        catch (error) {
            return rejectWithValue(error.message)
        }
    }
)

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
            console.log(`Called ProId is: ${productId}`)
            const response = await api.put(`products/${productId}`, updatedProductData);
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
    pagination : {
        currentPage: 1,
        totalPage: null,
        limit: 10
    },
    status: {
        getAll: 'idle',
        getSome: 'idle',
        getOne: 'idle',
        addOne: 'idle',
        updateOne: 'idle',
        deleteOne: 'idle'
    },
    error: {
        getAll: null,
        getSome: 'idle',
        getOne: null,
        addOne: null,
        updateOne: null,
        deleteOne: null
    },
    selectedProduct: null,
    wsStatus: 'uninstantiated'
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
        },
        setSelectedProduct: (state,action) => {
            state.selectedProduct = action.payload
        },
        productUpdated: (state, action) => {
      // Find the product and update it or add it if it's new
            const index = state.items.findIndex(
                (product) => product.ProductId === action.payload.ProductId
            );
            if (index !== -1) {
                state.items[index] = action.payload; // Update existing product
            } else {
                state.items.push(action.payload); // Add new product
            }
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
            // Handling fetchSomeProductsAsync
            .addCase(fetchSomeProductsAsync.pending, (state) => {
                state.status.getSome = 'loading';
                state.error.getSome = null;
            })
            .addCase(fetchSomeProductsAsync.fulfilled, (state, action) => {
                state.status.getSome = 'succeeded';
                state.items = action.payload.items;
                // Set pagination state
                state.pagination.currentPage = action.payload.current_page
                state.pagination.limit = action.payload.limit
                state.pagination.totalPage = action.payload.total_page
            })
            .addCase(fetchSomeProductsAsync.rejected, (state, action) => {
                state.status.getSome = 'failed';
                state.error.getSome = action.payload || action.error.message;
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
                state.items = [...state.items, action.payload];
            })
            // Handling updateProductAsync
            .addCase(updateProductAsync.fulfilled, (state, action) => {
                const index = state.items.findIndex(
                (product) => product.ProductId === action.payload.ProductId
            );

            // If the product is found, update it
            if (index !== -1) {
                state.items[index] = action.payload;
            }
                state.error.updateOne =null
                state.status.updateOne = 'idle'
            })
            .addCase(updateProductAsync.pending, (state) => {
                state.status.updateOne = 'pending'
                state.error.updateOne = null
                
            })
            .addCase(updateProductAsync.rejected, (state,action) => {
                state.status.updateOne = 'failed'
                state.error.updateOne = action.payload || action.error.message
                
            })
            // Handling deleteProductAsync
            .addCase(deleteProductAsync.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.id !== action.payload);
            })
            .addCase(wsMessageReceive, (state, action) => { // Use the action creator's `type`
                const message = action.payload;
                console.log(`We receive socket message: ${message}`)
                // The rest of your logic remains the same
                if (message.type === 'product_added' || message.type === 'product_updated') {
                    const updatedProduct = message.payload;
                    const index = state.items.findIndex((p) => p.ProductId === updatedProduct.ProductId);
                    if (index !== -1) {
                    state.items[index] = updatedProduct;
                    } else {
                    state.items.push(updatedProduct);
                    }
                }
            })
            .addCase(wsConnectStart, (state) => {
                state.wsStatus = 'connecting';
            })
            .addCase(wsConnectSuccess, (state) => {
                state.wsStatus = 'open';
            })
            .addCase(wsConnectError, (state) => {
                state.wsStatus = 'closed';
            })
            .addCase(wsDisconnect, (state) => {
                state.wsStatus = 'closed';
            })
    },
});

// Export the synchronous action creators and the main reducer
export const { resetStatus,setSelectedProduct, productUpdated } = productsSlice.actions;
export default productsSlice.reducer;