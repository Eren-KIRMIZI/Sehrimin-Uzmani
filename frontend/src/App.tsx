import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { authApi } from './services';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './components/ui/Toaster';

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
import StaticPage from './pages/StaticPage';
import NotFoundPage from './pages/NotFoundPage';

// Pages (lazy — code splitting ile yüklenecek)
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DisputesPage = lazy(() => import('./pages/DisputesPage'));
const EarningsPage = lazy(() => import('./pages/EarningsPage'));
const AdsPage = lazy(() => import('./pages/AdsPage'));
const AdDetailPage = lazy(() => import('./pages/AdDetailPage'));
const CreateAdPage = lazy(() => import('./pages/CreateAdPage'));
const MyAdsPage = lazy(() => import('./pages/MyAdsPage'));
const MyRequestsPage = lazy(() => import('./pages/requests/MyRequestsPage'));
const AppointmentsPage = lazy(() => import('./pages/appointments/AppointmentsPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

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
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

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
            <Route path="/forgot-password" element={
              <Suspense fallback={LazyFallback}>
                <ForgotPasswordPage />
              </Suspense>
            } />
            <Route path="/reset-password" element={
              <Suspense fallback={LazyFallback}>
                <ResetPasswordPage />
              </Suspense>
            } />

            {/* Statik içerik sayfaları (Footer yasal linkleri) */}
            <Route path="/sayfa/:slug" element={<StaticPage />} />

            {/* İlanlar (Public) */}
            <Route path="/ads" element={
              <Suspense fallback={LazyFallback}>
                <AdsPage />
              </Suspense>
            } />
            <Route path="/ads/:id" element={
              <Suspense fallback={LazyFallback}>
                <AdDetailPage />
              </Suspense>
            } />

            {/* İlanlar (Protected) */}
            <Route path="/ads/create" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <CreateAdPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/ads/:id/edit" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <CreateAdPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/ads/my" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <MyAdsPage />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Protected Routes (All authenticated users) */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/requests" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <MyRequestsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <AppointmentsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Suspense fallback={LazyFallback}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            } />
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
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
