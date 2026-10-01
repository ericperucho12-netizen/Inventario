import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/auth.store';
import { Wallet, Plus, Trash2, Calendar, FileText, DollarSign, Loader2 } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Expense form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        description,
        amount: Number(amount),
        category: category || 'General'
      };
      await api.post('/expenses', payload);
      setDescription('');
      setAmount('');
      setCategory('');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error al registrar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error al eliminar el gasto');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white font-sans">
      <header className="p-4 lg:p-8 lg:pb-4 shrink-0">
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
          Gastos Hormiga
        </h1>
        <p className="text-slate-400 mt-1 text-sm lg:text-base">Registra gastos menores como desayunos, limpieza, papelería, etc.</p>
      </header>

      <div className="flex-1 p-4 lg:p-8 lg:pt-4 flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-8">
        {/* Formulario */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 lg:overflow-y-auto custom-scrollbar">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-500" /> Nuevo Gasto
              </h2>
              
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Descripción del gasto</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej. Desayuno personal, Escobas..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Monto ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Categoría (Opcional)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                  >
                    <option value="">General</option>
                    <option value="Alimentos">Alimentos / Desayuno</option>
                    <option value="Limpieza">Artículos de Limpieza</option>
                    <option value="Papeleria">Papelería</option>
                    <option value="Transporte">Transporte / Viáticos</option>
                    <option value="Servicios">Servicios (Agua, Luz)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Registrar Gasto'}
                </button>
              </form>
            </div>
            
            {/* Resumen */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/5 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
               <h3 className="text-sm font-medium text-orange-400 mb-2">Total Gastos (Histórico)</h3>
               <p className="text-4xl font-bold text-white">
                 ${expenses.reduce((acc, exp) => acc + Number(exp.amount), 0).toFixed(2)}
               </p>
            </div>
          </div>

          {/* Lista de Gastos */}
          <div className="flex-1 min-h-[500px] lg:min-h-0 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900">
              <h2 className="font-bold text-slate-300">Historial de Gastos</h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{expenses.length} registros</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                </div>
              ) : expenses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Wallet className="h-12 w-12 opacity-20" />
                  <p>No hay gastos registrados aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{exp.description}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(exp.createdAt).toLocaleString()}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{exp.category || 'General'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-orange-400">-${Number(exp.amount).toFixed(2)}</span>
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Eliminar Gasto"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
