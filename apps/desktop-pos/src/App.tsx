import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas dentro del Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/pos" element={<Pos />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
