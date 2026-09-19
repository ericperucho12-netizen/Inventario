import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { LogOut, Package, Users, Settings, Home, BarChart3, LayoutDashboard, Building2, ShoppingCart } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Drag Region for Electron Window */}
      <div 
        className="h-8 w-full bg-slate-900 flex-shrink-0 z-50 border-b border-white/5" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Lateral */}
        <aside className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            PeruchOS
          </h2>
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <NavLink
            to="/pos"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span>Caja (Vender)</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Package className="h-5 w-5" />
            <span>Productos y Categorías</span>
          </NavLink>



          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Users className="h-5 w-5" />
            <span>Clientes</span>
          </NavLink>

          <NavLink
            to="/suppliers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Building2 className="h-5 w-5" />
            <span>Proveedores</span>
          </NavLink>

          <NavLink
            to="/purchases"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Compras</span>
          </NavLink>



          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <BarChart3 className="h-5 w-5" />
            <span>Reportes</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </NavLink>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content (Dinámico según la ruta) */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <Outlet />
      </main>
      </div>

    </div>
  );
}
