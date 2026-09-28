import React, { useEffect, useState } from 'react';
import { api } from '../lib/axios';

interface Owner {
  id: string;
  fullName: string;
  username: string;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  nextBillingDate: string | null;
}

interface Company {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  owner: Owner | null;
}

export const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/superadmin/companies?t=${new Date().getTime()}`);
      setCompanies(res.data);
    } catch (error: any) {
      console.error('Fetch error:', error);
      alert(`API Error: ${error.message} - ${api.defaults.baseURL}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/superadmin/companies/${id}/status`, { isActive: !isActive });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al actualizar');
    }
  };

  const approveSubscription = async (id: string, months: number) => {
    const label = months === 1 ? '1 mes extra' : '1 año extra';
    if (!window.confirm(`¿Seguro que deseas registrar un pago manual (${label}) para esta empresa?`)) return;
    try {
      await api.patch(`/superadmin/companies/${id}/approve-subscription`, { months });
      alert(`Pago registrado correctamente. La empresa tiene ${label} de acceso.`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al aprobar suscripción');
    }
  };

  const revokeSubscription = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas revocar la suscripción de esta empresa?')) return;
    try {
      await api.patch(`/superadmin/companies/${id}/revoke-subscription`);
      alert('Suscripción revocada.');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al revocar suscripción');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando panel maestro...</div>;

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-300">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Panel de Súper Administrador</h1>
        <p className="text-slate-400 mb-8">Gestiona todas las empresas (tenants) registradas en PeruchOS.</p>

        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-sm text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Empresa y Dueño</th>
                <th className="p-4 font-medium">Fecha de Registro</th>
                <th className="p-4 font-medium">Estado del Sistema</th>
                <th className="p-4 font-medium">Estado de Suscripción</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0">
                  <td className="p-4">
                    <div className="font-bold text-white">{c.name}</div>
                    {c.owner && (
                      <div className="text-xs text-slate-400">@{c.owner.username} ({c.owner.fullName})</div>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${c.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
                      {c.isActive ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                    </span>
                  </td>
                  <td className="p-4">
                    {c.owner?.isSubscribed ? (
                       <div>
                         <span className="px-2 py-1 rounded-full text-xs font-bold border bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                           Pagado ({c.owner.subscriptionPlan})
                         </span>
                         {c.owner.nextBillingDate && (
                           <div className="text-xs text-slate-400 mt-1">Vence: {new Date(c.owner.nextBillingDate).toLocaleDateString()}</div>
                         )}
                       </div>
                    ) : (
                       <span className="px-2 py-1 rounded-full text-xs font-bold border bg-red-500/20 text-red-400 border-red-500/20">
                         Sin Pago / Expirado
                       </span>
                    )}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => approveSubscription(c.id, 1)}
                      className="text-sm font-bold px-3 py-2 rounded-lg transition-colors border bg-blue-600/20 text-blue-400 hover:text-white hover:bg-blue-600 border-blue-600/30"
                      title="Aprobar pago en efectivo por 1 mes"
                    >
                      + 1 Mes
                    </button>
                    <button
                      onClick={() => approveSubscription(c.id, 12)}
                      className="text-sm font-bold px-3 py-2 rounded-lg transition-colors border bg-indigo-600/20 text-indigo-400 hover:text-white hover:bg-indigo-600 border-indigo-600/30"
                      title="Aprobar pago en efectivo por 1 año"
                    >
                      + 1 Año
                    </button>
                    {c.owner?.isSubscribed && (
                      <button
                        onClick={() => revokeSubscription(c.id)}
                        className="text-sm font-bold px-3 py-2 rounded-lg transition-colors border bg-orange-600/20 text-orange-400 hover:text-white hover:bg-orange-600 border-orange-600/30"
                        title="Revocar suscripción y expirarla"
                      >
                        Revocar Pago
                      </button>
                    )}
                    <button
                      onClick={() => toggleStatus(c.id, c.isActive)}
                      className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors border ${c.isActive ? 'bg-red-600/20 text-red-400 hover:text-white hover:bg-red-600 border-red-600/30' : 'bg-emerald-600/20 text-emerald-400 hover:text-white hover:bg-emerald-600 border-emerald-600/30'}`}
                    >
                      {c.isActive ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No hay empresas registradas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-center text-slate-600 text-xs font-mono">
          DEBUG API: {api.defaults.baseURL}
        </div>
      </div>
    </div>
  );
};
