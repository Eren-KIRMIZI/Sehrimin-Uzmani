import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { authApi } from './services';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MapSearchPage from './pages/MapSearchPage';
import ProviderProfilePage from './pages/ProviderProfilePage';
import ServiceRequestForm from './pages/ServiceRequestForm';
import ChatPage from './pages/ChatPage';
import PricingPage from './pages/PricingPage';
import EarningsPage from './pages/EarningsPage';
import PromotionsPage from './pages/PromotionsPage';
import DisputesPage from './pages/DisputesPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminPage from './pages/admin/AdminPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const { setUser, setInitializing } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const user = await authApi.me();
          setUser(user);
        }
      } catch (err) {
        // Token invalid or expired, interceptor might have failed to refresh
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setInitializing(false);
      }
    };
    initAuth();
  }, [setUser, setInitializing]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/map-search" element={<MapSearchPage />} />
            <Route path="/provider/:id" element={<ProviderProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes (All authenticated users) */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/request/create" element={<ProtectedRoute><ServiceRequestForm /></ProtectedRoute>} />
            <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
            
            {/* Protected Routes (Providers only) */}
            <Route path="/pricing" element={<ProtectedRoute requiredRole="PROVIDER"><PricingPage /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute requiredRole="PROVIDER"><EarningsPage /></ProtectedRoute>} />
            <Route path="/promotions" element={<ProtectedRoute requiredRole="PROVIDER"><PromotionsPage /></ProtectedRoute>} />

            {/* Protected Routes (Admin only) */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
