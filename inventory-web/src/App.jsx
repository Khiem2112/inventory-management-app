// src/App.jsx
import { ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.js';
import SignInForm from './components/SignInForm.jsx';
import { Routes, Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet
 } from 'react-router-dom';
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
import DockReceivingPage from './pages/DockReceivingPage.jsx';
import POCreatePage from './pages/POCreatePage.jsx';
import ShipmentManifestCreatePage from './pages/ShipmentManifestCreatePage.jsx';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './context/AuthContext';
// Create new Query Client
const queryClient = new QueryClient()

const AuthorizationGuard = ({ allowedRoles }) => {
    const { userData } = useAuth();
    const userRole = userData?.role?.toLowerCase() || 'staff';
    
    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
};

// Create Router
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/sign-in" element={<SignInForm />} />
      
      {/* AUTHENTICATED ROUTES SHELL */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        
        {/* Pages accessible to EVERYONE */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ADMIN/STAFF ONLY PAGES */}
        <Route element={<AuthorizationGuard allowedRoles={['admin', 'staff']} />}>
            <Route path="/products" element={<ProductsList />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/good-receipt" element={<DockReceivingPage />} />
            <Route path="/purchase-orders" element={<POMasterView />}>
                <Route index element={<div style={{ padding: 20 }}>Select an order from the list</div>} />
                <Route path=":id" element={<PODetailPage />} />
            </Route>
            <Route path="/purchase-orders/create" element={<POCreatePage />} />
            <Route path="/purchase-orders/:id/edit" element={<POCreatePage />} />
        </Route>

        {/* SUPPLIER ONLY PAGES */}
        <Route element={<AuthorizationGuard allowedRoles={['supplier', 'staff']} />}>
            <Route path="/supplier/manifest/create/*" element={<ShipmentManifestCreatePage />} />
        </Route>

      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </>
  )
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <CloudinaryProvider>
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline /> 
              {/* CHANGE: Use RouterProvider instead of <Routes> */}
              <RouterProvider router={router} />
            </ThemeProvider>
          </AuthProvider>
        </CloudinaryProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;