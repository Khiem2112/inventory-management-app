// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

// We will create the productSlice next
import productReducer from '../slices/ProductsSlice';

const store = configureStore({
    reducer: {
        products: productReducer,
    },
});

export default store;