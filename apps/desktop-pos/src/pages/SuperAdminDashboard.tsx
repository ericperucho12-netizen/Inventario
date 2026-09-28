import React, { useEffect, useState } from 'react';
import { api } from '../lib/axios';

interface Company {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/superadmin/companies');
      setCompanies(res.data);
    } catch (error) {
      console.error(error);
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

  const approveSubscription = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas registrar un pago manual (1 mes extra) para esta empresa?')) return;
    try {
      await api.patch(`/superadmin/companies/${id}/approve-subscription`);
      alert('Pago registrado correctamente. La empresa tiene 1 mes más de acceso.');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al aprobar suscripción');
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
                <th className="p-4 font-medium">Nombre de la Empresa</th>
                <th className="p-4 font-medium">Fecha de Registro</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0">
                  <td className="p-4 font-bold text-white">{c.name}</td>
                  <td className="p-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${c.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
                      {c.isActive ? 'Activa' : 'Suspendida'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => approveSubscription(c.id)}
                      className="text-sm font-bold px-3 py-2 rounded-lg transition-colors border bg-indigo-600/20 text-indigo-400 hover:text-white hover:bg-indigo-600 border-indigo-600/30"
                      title="Aprobar pago en efectivo por 1 mes"
                    >
                      Aprobar Mes
                    </button>
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
      </div>
    </div>
  );
};
