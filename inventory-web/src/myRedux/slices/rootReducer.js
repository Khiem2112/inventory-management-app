import { combineReducers } from '@reduxjs/toolkit';
import productsReducer from './ProductsSlice';

const rootReducer = combineReducers({
  // The 'products' key here corresponds to 'state.products' in your useSelector hook.
  products: productsReducer,
  // You would add other reducers here as you create them, e.g.,
  // user: userReducer,
});

export default rootReducer;