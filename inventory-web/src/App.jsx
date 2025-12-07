// src/App.jsx
import { ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.js';
import SignInForm from './components/SignInForm.jsx';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/DashBoard.jsx';
import PurchaseOrderList from './pages/POList.jsx';
// import ProductDisplaySimple from './pages/ProductSimple.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './utils/PrivatedRoute.jsx';
import ProductsList from './pages/ProductList.jsx';
// import CloudinaryTest from '../practice/test.jsx';
import { Provider } from 'react-redux';
import store from './myRedux/store/store.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CloudinaryProvider } from './context/CloudinaryContext.jsx';
import WarehousePage from './pages/WarehousePage.jsx';
import POMasterView from './pages/POMasterView.jsx';
import PODetailPage from './pages/PODetailPage.jsx';
import { TestPODetail } from '../test/testPurchaseOrderDetail.jsx';
import POCreatePage from './pages/POCreatePage.jsx';
// Create new Query Client
const queryClient = new QueryClient()
function App() {
  return (
      <QueryClientProvider client ={queryClient}>
      <Provider store = {store}>
      <CloudinaryProvider>
      <AuthProvider>
      <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Resets CSS and applies base Material Design styles */}
        <Routes>
          <Route path = "/sign-in" element = {<SignInForm/>}/>
            <Route path = "/dashboard" element = {<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          <Route path = '/products' element = {<ProtectedRoute><ProductsList/></ProtectedRoute>}/>
          {/* <Route path = '/test' element = {<CloudinaryTest/>}/> */}
          <Route path = '/warehouse' element = {<WarehousePage/>} />
          <Route path ='purchase-orders-single' element ={<PurchaseOrderList isCompact={false}/>} />
          <Route path="purchase-orders-detail" element={<POMasterView/>}/>
          <Route path="test-po-detail" element={<TestPODetail/>}/>
          <Route path="/purchase-orders" element={<POMasterView />}>
          <Route index element={<div style={{padding: 20}}>Select an order from the list</div>} />
              <Route path=":id" element={<PODetailPage />} />
          </Route>
           <Route path="/purchase-orders/create" element={<POCreatePage/>}/>
        </Routes>
    </ThemeProvider>
    </AuthProvider>
      </CloudinaryProvider>
      
    </Provider>
    </QueryClientProvider>    
    
  );
}

export default App;