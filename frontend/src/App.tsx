import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MapSearchPage from './pages/MapSearchPage';
import ProviderProfilePage from './pages/ProviderProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ServiceRequestForm from './pages/ServiceRequestForm';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PricingPage from './pages/PricingPage';
import DisputesPage from './pages/DisputesPage';
import EarningsPage from './pages/EarningsPage';
import PromotionsPage from './pages/PromotionsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/map" element={<MapSearchPage />} />
            <Route path="/provider/:id" element={<ProviderProfilePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/categories" element={<HomePage />} />
            <Route path="/category/:slug" element={<HomePage />} />
            <Route path="/how-it-works" element={<HomePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/request/create" element={<ProtectedRoute><ServiceRequestForm /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute roles={["PROVIDER"]}><EarningsPage /></ProtectedRoute>} />
            <Route path="/promotions" element={<ProtectedRoute roles={["PROVIDER"]}><PromotionsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
