import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Users, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', contactName: '', email: '', phone: '' });

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        await api.patch(`/suppliers/${editingId}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      alert('Error guardando proveedor');
    }
  };

  const openEdit = (s: Supplier) => {
    setFormData({ name: s.name, contactName: s.contactName || '', email: s.email || '', phone: s.phone || '' });
    setEditingId(s.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const openNew = () => {
    setFormData({ name: '', contactName: '', email: '', phone: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este proveedor?')) {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    }
  };

  if (loading) return <div className="p-8 text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando proveedores...</div>;

  return (
    <div className="p-8 bg-slate-950 min-h-full">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-500" />
            Proveedores
          </h1>
          <p className="text-slate-400 mt-1">Directorio de contactos comerciales.</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" /> Nuevo Proveedor
        </button>
      </header>

      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-sm border-b border-white/10">
              <th className="p-4 font-medium">Empresa</th>
              <th className="p-4 font-medium">Contacto</th>
              <th className="p-4 font-medium">Teléfono</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-white text-sm divide-y divide-white/5">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold">{s.name}</td>
                <td className="p-4">{s.contactName || '-'}</td>
                <td className="p-4">{s.phone || '-'}</td>
                <td className="p-4 text-slate-400">{s.email || '-'}</td>
                <td className="p-4 flex gap-2 justify-end">
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No hay proveedores registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">{isEditing ? 'Editar' : 'Nuevo'} Proveedor</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Empresa / Razón Social *</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de Contacto</label>
                <input value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              
              <button type="submit" className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors">
                Guardar Proveedor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
