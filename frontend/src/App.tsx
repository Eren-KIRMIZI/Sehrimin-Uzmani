import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { authApi } from './services';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages (eager — kritik rotalar)
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MapSearchPage from './pages/MapSearchPage';
import ProviderProfilePage from './pages/ProviderProfilePage';
import ServiceRequestForm from './pages/ServiceRequestForm';
import PricingPage from './pages/PricingPage';
import PromotionsPage from './pages/PromotionsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminPage from './pages/admin/AdminPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Pages (lazy — code splitting ile yüklenecek)
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DisputesPage = lazy(() => import('./pages/DisputesPage'));
const EarningsPage = lazy(() => import('./pages/EarningsPage'));

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

  // Lazy sayfalari icin ortak yukleme gostergesi
  const LazyFallback = (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="spinner" />
    </div>
  );

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
            <Route path="/chat" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <ChatPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/request/create" element={<ProtectedRoute><ServiceRequestForm /></ProtectedRoute>} />
            <Route path="/disputes" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <DisputesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            
            {/* Protected Routes (Providers only) */}
            <Route path="/pricing" element={<ProtectedRoute requiredRole="PROVIDER"><PricingPage /></ProtectedRoute>} />
            <Route path="/earnings" element={
              <ProtectedRoute requiredRole="PROVIDER">
                <Suspense fallback={LazyFallback}>
                  <EarningsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/promotions" element={<ProtectedRoute requiredRole="PROVIDER"><PromotionsPage /></ProtectedRoute>} />

            {/* Protected Routes (Admin only) */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminPage /></ProtectedRoute>} />

            {/* 404 — Bilinmeyen URL */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
