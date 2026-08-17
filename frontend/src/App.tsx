import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MapSearchPage = lazy(() => import('./pages/MapSearchPage'));
const ProviderProfilePage = lazy(() => import('./pages/ProviderProfilePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ServiceRequestForm = lazy(() => import('./pages/ServiceRequestForm'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const DisputesPage = lazy(() => import('./pages/DisputesPage'));
const EarningsPage = lazy(() => import('./pages/EarningsPage'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<SuspenseWrap><LoginPage /></SuspenseWrap>} />
            <Route path="/register" element={<SuspenseWrap><RegisterPage /></SuspenseWrap>} />
            <Route element={<Layout />}>
              <Route path="/" element={<SuspenseWrap><HomePage /></SuspenseWrap>} />
              <Route path="/search" element={<SuspenseWrap><SearchPage /></SuspenseWrap>} />
              <Route path="/map" element={<SuspenseWrap><MapSearchPage /></SuspenseWrap>} />
              <Route path="/provider/:id" element={<SuspenseWrap><ProviderProfilePage /></SuspenseWrap>} />
              <Route path="/pricing" element={<SuspenseWrap><PricingPage /></SuspenseWrap>} />
              <Route path="/categories" element={<SuspenseWrap><HomePage /></SuspenseWrap>} />
              <Route path="/category/:slug" element={<SuspenseWrap><HomePage /></SuspenseWrap>} />
              <Route path="/how-it-works" element={<SuspenseWrap><HomePage /></SuspenseWrap>} />
              <Route path="/dashboard" element={<ProtectedRoute><SuspenseWrap><DashboardPage /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/request/create" element={<ProtectedRoute><SuspenseWrap><ServiceRequestForm /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><SuspenseWrap><ChatPage /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><SuspenseWrap><ChatPage /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><SuspenseWrap><AdminDashboard /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/disputes" element={<ProtectedRoute><SuspenseWrap><DisputesPage /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/earnings" element={<ProtectedRoute roles={["PROVIDER"]}><SuspenseWrap><EarningsPage /></SuspenseWrap></ProtectedRoute>} />
              <Route path="/promotions" element={<ProtectedRoute roles={["PROVIDER"]}><SuspenseWrap><PromotionsPage /></SuspenseWrap></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
