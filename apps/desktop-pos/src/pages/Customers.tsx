import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Users, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

import { useRef } from 'react';
import { useSettingsStore } from '../store/settings.store';

interface Customer {
  id: string;
  name: string;
  debt: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');

  // Payment modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

  const { defaultPrinter } = useSettingsStore();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [paymentTicketData, setPaymentTicketData] = useState<{ customerName: string, amount: number, date: Date, id: string } | null>(null);

  // Accordion states
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<Record<string, any[]>>({});
  const [loadingSales, setLoadingSales] = useState<Record<string, boolean>>({});

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedCustomerId === id) {
      setExpandedCustomerId(null);
      return;
    }
    
    setExpandedCustomerId(id);
    
    if (!customerSales[id]) {
      setLoadingSales(prev => ({ ...prev, [id]: true }));
      try {
        const res = await api.get(`/customers/${id}/credit-sales`);
        setCustomerSales(prev => ({ ...prev, [id]: res.data }));
      } catch (error) {
        console.error('Error fetching credit sales', error);
      } finally {
        setLoadingSales(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setName('');
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { 
        name,
        email: '',
        phone: '',
        address: ''
      };
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error guardando cliente:', error.response?.data || error);
      alert('Error guardando cliente: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      alert('Error eliminando cliente');
    }
  };

  const handleOpenPay = (customer: Customer) => {
    setPayingCustomer(customer);
    setPayAmount('');
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || !payAmount) return;
    
    const amount = Number(payAmount);
    if (amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/customers/${payingCustomer.id}/pay-debt`, { amount });
      
      setPaymentTicketData({
        customerName: payingCustomer.name,
        amount: amount,
        date: new Date(),
        id: Math.random().toString(36).substring(7).toUpperCase() // fake id for ticket
      });

      setIsPayModalOpen(false);
      fetchCustomers();

      // Trigger print after state update
      setTimeout(() => {
        printTicket();
      }, 100);
      
    } catch (error) {
      alert('Error registrando abono');
    } finally {
      setIsSubmitting(false);
    }
  };

  const printTicket = () => {
    if (!ticketRef.current) return;

    const electron = (window as any).require ? (window as any).require('electron') : null;
    if (electron && defaultPrinter) {
      electron.ipcRenderer.send('print-ticket', {
        htmlContent: ticketRef.current.innerHTML,
        deviceName: defaultPrinter
      });
    } else {
      const printContent = ticketRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Comprobante de Abono</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: black; background: white; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-xl { font-size: 16px; }
                .border-y { border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin: 10px 0; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-slate-400 mt-1">Directorio de clientes frecuentes</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </header>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium text-right">Deuda</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((cust) => (
                <React.Fragment key={cust.id}>
                  <tr className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => toggleExpand(cust.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="font-medium text-white">{cust.name}</span>
                        {expandedCustomerId === cust.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 ml-2 transition-colors" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 ml-2 transition-colors" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${Number(cust.debt) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        ${Number(cust.debt).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(cust.debt) > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenPay(cust); }}
                          className="text-amber-400 hover:text-amber-300 font-medium text-sm mr-4"
                        >
                          Abonar
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(cust); }}
                        className="text-emerald-400 hover:text-emerald-300 font-medium text-sm mr-4"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(cust.id); }}
                        className="text-red-400 hover:text-red-300 font-medium text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  
                  {expandedCustomerId === cust.id && (
                    <tr className="bg-slate-900/30">
                      <td colSpan={3} className="px-6 py-4 border-b border-white/5">
                        <div className="pl-11">
                          <h4 className="text-sm font-semibold text-slate-300 mb-2">Historial de Productos Fiados</h4>
                          {loadingSales[cust.id] ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial...
                            </div>
                          ) : customerSales[cust.id]?.length === 0 ? (
                            <p className="text-sm text-slate-500">No hay ventas a crédito registradas.</p>
                          ) : (
                            <div className="space-y-3">
                              {customerSales[cust.id]?.map((sale) => (
                                <div key={sale.id} className="text-sm bg-slate-900/50 rounded-lg p-3 border border-white/5">
                                  <div className="flex justify-between text-slate-400 mb-2 pb-2 border-b border-white/5">
                                    <span>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString()}</span>
                                    <span className="font-bold text-emerald-400">Total Venta: ${Number(sale.total).toFixed(2)}</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {sale.details.map((detail: any) => (
                                      <li key={detail.id} className="flex justify-between items-center text-slate-300">
                                        <span className="flex gap-2">
                                          <span className="text-slate-500">{detail.quantity}x</span>
                                          {detail.product?.description || 'Producto eliminado'}
                                        </span>
                                        <span>${Number(detail.subtotal).toFixed(2)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No hay clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Nombre del Cliente *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-500 focus:outline-none" />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 transition-colors disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayModalOpen && payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/20 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-white">
              Abonar a Deuda
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Cliente: <span className="font-bold text-white">{payingCustomer.name}</span><br />
              Deuda Total: <span className="font-bold text-amber-400">${Number(payingCustomer.debt).toFixed(2)}</span>
            </p>
            
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Monto a Abonar ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max={Number(payingCustomer.debt)}
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-500 focus:outline-none text-2xl font-bold" 
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="rounded-lg px-4 py-2 font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting || !payAmount} className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-400 transition-colors disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Registrar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Ticket for Printing */}
      <div className="hidden">
        {paymentTicketData && (
          <div className="bg-white text-black p-6 w-[300px] text-xs font-mono" ref={ticketRef}>
            <div className="text-center mb-4">
              <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
              <p>Comprobante de Abono</p>
              <p>{paymentTicketData.date.toLocaleString()}</p>
              <p className="text-[10px] mt-1 text-gray-500">Folio: {paymentTicketData.id}</p>
            </div>
            
            <div className="border-y border-dashed border-black my-4 py-2 text-center">
              <p className="font-bold">Cliente:</p>
              <p className="text-sm">{paymentTicketData.customerName}</p>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm font-bold">ABONO RECIBIDO:</p>
              <p className="text-2xl font-bold mt-1">${paymentTicketData.amount.toFixed(2)}</p>
            </div>

            <div className="text-center mt-6 text-xs text-gray-500">
              <p>¡Gracias por tu pago!</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
