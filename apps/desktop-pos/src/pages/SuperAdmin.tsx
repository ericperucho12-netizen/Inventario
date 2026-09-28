import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Calendar, RefreshCcw, Search } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  nextBillingDate: string | null;
}

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Contraseña maestra quemada (puedes cambiarla luego)
  const MASTER_PASSWORD = 'peruchos-master';

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const handleActivate = async (userId: string, months: number) => {
    if (!window.confirm(`¿Estás seguro de que quieres activar a este cliente por ${months} mes(es)?`)) return;
    
    setIsLoading(true);
    
    // Calcular nueva fecha
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + months);
    
    try {
      await fetch(`http://localhost:3000/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSubscribed: true,
          subscriptionPlan: months === 12 ? 'yearly' : 'monthly',
          nextBillingDate: newDate.toISOString(),
        })
      });
      alert('Suscripción activada exitosamente');
      fetchUsers(); // Recargar
    } catch (err) {
      alert('Hubo un error al activar');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres REVOCAR el acceso a este cliente?`)) return;
    
    setIsLoading(true);
    try {
      await fetch(`http://localhost:3000/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSubscribed: false,
          subscriptionPlan: null,
          nextBillingDate: null,
        })
      });
      alert('Acceso revocado');
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Panel Super Administrador</h1>
          <p className="text-slate-400 mb-6 text-sm">Área restringida. Ingresa la contraseña maestra para gestionar las suscripciones de los clientes de PeruchOS.</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-center rounded-lg py-3 px-4 text-white focus:outline-none focus:border-red-500 mb-4 font-mono tracking-widest"
            placeholder="••••••••"
          />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-500/20 transition-colors">
            Acceder
          </button>
        </form>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestor de Clientes</h1>
              <p className="text-slate-400">Activa o revoca el acceso a PeruchOS manualmente</p>
            </div>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <input 
                type="text" 
                placeholder="Buscar cliente por nombre o usuario..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-red-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium">Estado de Pago</th>
                  <th className="p-4 font-medium">Vencimiento</th>
                  <th className="p-4 font-medium text-right">Acciones Manuales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white">{user.fullName}</div>
                      <div className="text-xs text-slate-400">@{user.username}</div>
                    </td>
                    <td className="p-4 text-slate-300 capitalize text-sm">{user.role}</td>
                    <td className="p-4">
                      {user.isSubscribed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Activo ({user.subscriptionPlan})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20">
                          <XCircle className="h-3.5 w-3.5" /> Suspendido
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 text-sm">
                      {user.nextBillingDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          {new Date(user.nextBillingDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleActivate(user.id, 1)}
                        className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-blue-600/30"
                      >
                        + 1 Mes
                      </button>
                      <button 
                        onClick={() => handleActivate(user.id, 12)}
                        className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-emerald-600/30"
                      >
                        + 1 Año
                      </button>
                      {user.isSubscribed && (
                        <button 
                          onClick={() => handleDeactivate(user.id)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-red-600/30 ml-2"
                        >
                          Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
