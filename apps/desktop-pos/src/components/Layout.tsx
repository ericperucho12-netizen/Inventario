import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { LogOut, Package, Users, Settings, Home, BarChart3, LayoutDashboard, Building2, ShoppingCart, History, Wallet, Menu, X } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { useEffect, useState } from 'react';
import { useOfflineStore } from '../store/offline.store';
import { api } from '../lib/axios';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { theme } = useSettingsStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { pendingSales, clearPendingSales } = useOfflineStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine && pendingSales.length > 0) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSales]);

  const syncOfflineData = async () => {
    if (pendingSales.length === 0) return;
    setIsSyncing(true);
    try {
      for (const sale of pendingSales) {
        // Enviar cada venta pendiente
        await api.post('/sales', {
          customerId: sale.customerId,
          items: sale.items,
          paymentMethod: sale.paymentMethod,
          isCredit: sale.isCredit
        });
      }
      clearPendingSales();
      console.log('Sincronización completada exitosamente');
    } catch (error) {
      console.error('Error sincronizando datos offline:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Drag Region for Electron Window */}
      <div 
        className="h-8 w-full bg-slate-900 flex-shrink-0 z-50 border-b border-white/5 flex items-center px-4" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Offline Banner Interno */}
        {isOffline && (
          <div className="flex items-center gap-2 text-xs text-amber-500 font-bold ml-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <WifiOff className="h-3 w-3" />
            Sin Conexión (Modo Offline activo)
            {pendingSales.length > 0 && ` - ${pendingSales.length} venta(s) pendiente(s)`}
          </div>
        )}
        {isSyncing && (
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold ml-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <Loader2 className="h-3 w-3 animate-spin" />
            Sincronizando {pendingSales.length} venta(s)...
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-slate-900">
              P
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              PeruchOS
            </h2>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={closeMenu}
          />
        )}

        {/* Sidebar Lateral */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 md:w-20 lg:w-64 
          md:relative md:translate-x-0
          border-r border-white/10 bg-slate-900 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
        <div className="p-4 lg:p-6 flex items-center justify-between lg:justify-start">
          <h2 className="hidden lg:block text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            PeruchOS
          </h2>
          <div className="lg:hidden h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-slate-900">
            P
          </div>
          <button onClick={closeMenu} className="md:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          <NavLink
            to="/pos"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Home className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Caja (Vender)</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-teal-500 text-white font-bold shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Dashboard</span>
          </NavLink>

          <NavLink
            to="/catalog"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Package className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Productos y Categorías</span>
          </NavLink>

          <NavLink
            to="/purchases"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <ShoppingCart className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Compras</span>
          </NavLink>

          <NavLink
            to="/expenses"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Wallet className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Gastos</span>
          </NavLink>

          <NavLink
            to="/history"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <History className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Historial</span>
          </NavLink>

          <NavLink
            to="/reports"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <BarChart3 className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Reportes</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={closeMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-slate-700 text-white font-bold shadow-lg shadow-slate-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings className="h-6 w-6 lg:h-5 lg:w-5 shrink-0" />
            <span className="md:hidden lg:inline">Configuración</span>
          </NavLink>
        </nav>

        <div className="border-t border-white/10 p-4 flex flex-col gap-4 bg-slate-900/80">
          <NavLink to="/profile" onClick={closeMenu} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="h-12 w-12 lg:h-10 lg:w-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="md:hidden lg:block overflow-hidden flex-1">
              <p className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">{user?.fullName || user?.username}</p>
              <p className="text-xs text-emerald-400 capitalize truncate">{user?.role}</p>
            </div>
          </NavLink>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 py-3 lg:px-4 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors group"
            title="Cerrar Sesión"
          >
            <LogOut className="h-6 w-6 lg:h-5 lg:w-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="md:hidden lg:inline">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content (Dinámico según la ruta) */}
      <main className="flex-1 overflow-y-auto xl:overflow-hidden flex flex-col bg-slate-950 pt-14 md:pt-0">
        <Outlet />
      </main>
      </div>

    </div>
  );
}
