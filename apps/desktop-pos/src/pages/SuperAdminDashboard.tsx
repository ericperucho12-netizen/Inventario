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

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando panel maestro...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Súper Administrador</h1>
        <p className="text-gray-500 mb-8">Gestiona todas las empresas (tenants) registradas en PeruchOS.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Nombre de la Empresa</th>
                <th className="p-4 font-medium">Fecha de Registro</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{c.name}</td>
                  <td className="p-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'Activa' : 'Suspendida'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStatus(c.id, c.isActive)}
                      className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${c.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {c.isActive ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No hay empresas registradas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
