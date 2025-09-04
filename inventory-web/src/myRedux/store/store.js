// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import wsMiddleware from '../middleware/wsMiddleware.js';
import rootReducer from '../slices/rootReducer.js';

// We will create the productSlice next
import productReducer from '../slices/ProductsSlice.js';

const store = configureStore({
  reducer: rootReducer,
  // This is the correct way to add middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(wsMiddleware),
});

export default store;