import { useAuthStore } from '../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, Users, Settings, Home } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            PeruchOS
          </h2>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          <button className="w-full flex items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-3 text-emerald-400 transition-colors">
            <Home className="h-5 w-5" />
            <span className="font-medium">Inicio</span>
          </button>
          <button className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Package className="h-5 w-5" />
            <span className="font-medium">Catálogo</span>
          </button>
          <button className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Users className="h-5 w-5" />
            <span className="font-medium">Clientes</span>
          </button>
          <button className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Configuración</span>
          </button>
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

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">Bienvenido de vuelta, {user?.fullName}</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-slate-400">Ventas de Hoy</h3>
            <p className="mt-2 text-3xl font-bold">$0.00</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-slate-400">Tickets</h3>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>
      </main>

    </div>
  );
}
