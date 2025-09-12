// src/App.jsx
import React from 'react';
import { ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.js';
import SignInForm from './components/SignInForm.jsx';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/DashBoard.jsx';
import ProductDisplayPromise from './pages/ProductPromise.jsx';
// import ProductDisplaySimple from './pages/ProductSimple.jsx';
import ProductDisplayFetch from './pages/ProductFetch.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './utils/PrivatedRoute.jsx';
import ProductsList from './pages/ProductList.jsx';
import { Provider } from 'react-redux';
import store from './myRedux/store/store.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create new Query Client
const queryClient = new QueryClient()
function App() {
  return (
    <QueryClientProvider client ={queryClient}>
      <Provider store = {store}>
      <AuthProvider>
      <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Resets CSS and applies base Material Design styles */}
        <Routes>
          <Route path = "/sign-in" element = {<SignInForm/>}/>
            <Route path = "/dashboard" element = {<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          {/* <Route path = "/products-simple" element = {<ProductDisplaySimple/>}/> */}
          {/* <Route path = "/products-optimized" element = {<ProductDisplayPromise/>}/>
          <Route path = "/products-fetch" element = {<ProductDisplayFetch/>}/> */}
          <Route path = '/products' element = {<ProtectedRoute><ProductsList/></ProtectedRoute>}/>
        </Routes>
    </ThemeProvider>
    </AuthProvider>
    </Provider>
    </QueryClientProvider>
    
  );
}

export default App;