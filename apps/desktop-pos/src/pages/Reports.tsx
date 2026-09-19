import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Receipt, Calendar, DollarSign, XCircle } from 'lucide-react';

interface Sale {
  id: string;
  total: string | number;
  status: 'COMPLETED' | 'REFUNDED';
  createdAt: string;
  details: {
    id: string;
    quantity: number;
    subtotal: string | number;
    unitCost: string | number;
    product: {
      description: string;
    };
  }[];
}

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSales = () => {
    api.get('/sales')
      .then(res => setSales(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleRefund = async (id: string) => {
    if (confirm('¿Estás seguro de cancelar este ticket? Los productos regresarán al inventario.')) {
      try {
        await api.post(`/sales/${id}/refund`);
        alert('Ticket cancelado correctamente.');
        fetchSales();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error cancelando el ticket');
      }
    }
  };

  // Solo contabilizar ventas completadas para métricas
  const validSales = sales.filter(s => s.status === 'COMPLETED');
  
  const totalRevenue = validSales.reduce((acc, sale) => acc + Number(sale.total), 0);
  const totalSales = validSales.length;
  
  // Calcular Costo Total de lo vendido
  const totalCost = validSales.reduce((acc, sale) => {
    const saleCost = sale.details.reduce((sum, d) => sum + (Number(d.unitCost) * d.quantity), 0);
    return acc + saleCost;
  }, 0);

  const grossProfit = totalRevenue - totalCost;

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Reportes de Ventas</h1>
        <p className="text-slate-400">Resumen histórico de ingresos y tickets generados.</p>
      </div>

      {/* Tarjetas de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Ingresos Totales</p>
            <h2 className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</h2>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-lg shadow-emerald-500/10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <DollarSign className="h-24 w-24" />
          </div>
          <div className="p-4 bg-emerald-500 text-white rounded-xl z-10">
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="z-10">
            <p className="text-emerald-400 text-sm font-medium">Utilidad Bruta</p>
            <h2 className="text-2xl font-bold text-white">${grossProfit.toFixed(2)}</h2>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-400 rounded-xl">
            <Receipt className="h-8 w-8" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Tickets Válidos</p>
            <h2 className="text-2xl font-bold text-white">{totalSales}</h2>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 text-purple-400 rounded-xl">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Ticket Promedio</p>
            <h2 className="text-2xl font-bold text-white">
              ${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}
            </h2>
          </div>
        </div>
      </div>

      {/* Historial de Tickets */}
      <div className="flex-1 bg-slate-900 border border-white/10 rounded-2xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Historial de Transacciones</h2>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="text-center text-slate-500 py-10">Cargando reportes...</div>
          ) : sales.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No hay ventas registradas todavía.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Folio / ID Ticket</th>
                  <th className="pb-3 font-medium">Fecha y Hora</th>
                  <th className="pb-3 font-medium">Artículos</th>
                  <th className="pb-3 font-medium text-right">Monto Total</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className={`border-b border-white/5 transition-colors group ${sale.status === 'REFUNDED' ? 'opacity-50' : 'hover:bg-white/5'}`}>
                    <td className="py-4">
                      {sale.status === 'COMPLETED' ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">OK</span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">DEVUELTO</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`font-mono text-xs px-2 py-1 rounded ${sale.status === 'REFUNDED' ? 'text-slate-500' : 'text-slate-300 bg-slate-800'}`}>
                        {sale.id.split('-')[0]}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300 text-sm">
                      {format(new Date(sale.createdAt), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1">
                        {sale.details.map((d) => (
                          <span key={d.id} className="text-xs text-slate-400">
                            {d.quantity}x {d.product?.description || 'Producto Eliminado'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`font-bold ${sale.status === 'REFUNDED' ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                        ${Number(sale.total).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {sale.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleRefund(sale.id)}
                          className="text-red-400 hover:text-white hover:bg-red-500 px-3 py-1 rounded transition-colors text-sm font-medium flex items-center gap-1 ml-auto"
                        >
                          <XCircle className="h-4 w-4" /> Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
