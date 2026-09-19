import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setName(supplier.name);
      setContactName(supplier.contactName || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
    } else {
      setEditingSupplier(null);
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { 
        name,
        contactName,
        phone,
        email
      };
      
      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }
      await fetchSuppliers();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Hubo un error al guardar el proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await api.delete(`/suppliers/${id}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error al eliminar proveedor');
      }
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-500" />
            Proveedores
          </h1>
          <p className="text-slate-400 mt-1">Administra las empresas que te surten mercancía</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </header>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-6 relative group hover:border-blue-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(supplier)} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1" title={supplier.name}>{supplier.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{supplier.contactName || 'Sin contacto'}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Tel:</span>
                      <span className="text-slate-300 font-mono">{supplier.phone || '---'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-300 line-clamp-1" title={supplier.email}>{supplier.email || '---'}</span>
                    </div>
                  </div>
                </div>
              ))}

              {suppliers.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay proveedores registrados.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre de la Empresa *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Contacto (Agente)</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
