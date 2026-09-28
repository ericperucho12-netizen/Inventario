import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useSubscriptionStore } from './store/subscription.store';
import Login from './pages/Login';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import Catalog from './pages/Catalog';
import Pos from './pages/Pos';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import History from './pages/History';
import Expenses from './pages/Expenses';
import Profile from './pages/Profile';
import SuperAdmin from './pages/SuperAdmin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Validación de Suscripción usando el usuario
  const isProfilePage = location.pathname === '/profile';
  
  let isExpired = false;
  if (user?.nextBillingDate) {
    isExpired = new Date(user.nextBillingDate).getTime() < new Date().getTime();
  }
  const hasValidSubscription = user?.isSubscribed && !isExpired;

  if (!hasValidSubscription && !isProfilePage) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Ruta oculta para el Super Admin */}
        <Route path="/master-panel" element={<SuperAdmin />} />
        
        {/* Rutas protegidas dentro del Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/pos" element={<Pos />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/history" element={<History />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
