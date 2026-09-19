import React, { useState } from 'react';
import { api } from '../lib/axios';
import { 
  BarChart3, Calendar, Download, Loader2, DollarSign, Package, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportData {
  summary: {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    salesCount: number;
  };
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
  }[];
  rawTickets: any[];
}

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  const setQuickDate = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    if (type === 'today') {
      setStartDate(formatDate(today));
      setEndDate(formatDate(today));
    } else if (type === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setStartDate(formatDate(yesterday));
      setEndDate(formatDate(yesterday));
    } else if (type === 'week') {
      const firstDay = new Date(today);
      const day = firstDay.getDay() || 7; // Get current day number, converting Sun(0) to 7
      if (day !== 1) firstDay.setHours(-24 * (day - 1)); // adjust when day is not monday
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    }
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      alert('Por favor selecciona ambas fechas');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/reports', {
        params: { startDate, endDate }
      });
      setData(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;

    // Pestaña 1: Resumen General
    const summaryData = [
      { Métrica: 'Ventas Totales', Valor: `$${data.summary.totalRevenue.toFixed(2)}` },
      { Métrica: 'Costo Total de Ventas', Valor: `$${data.summary.totalCost.toFixed(2)}` },
      { Métrica: 'Utilidad Neta (Ganancia Libre)', Valor: `$${data.summary.netProfit.toFixed(2)}` },
      { Métrica: 'Cantidad de Tickets Cobrados', Valor: data.summary.salesCount.toString() },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);

    // Pestaña 2: Productos Más Vendidos
    const topProductsData = data.topProducts.map((p, i) => ({
      Ranking: i + 1,
      Producto: p.name,
      'Cantidad Vendida': p.quantity,
      'Ingreso Generado': `$${p.revenue.toFixed(2)}`,
      'Costo Generado': `$${p.cost.toFixed(2)}`,
      'Utilidad Generada': `$${(p.revenue - p.cost).toFixed(2)}`
    }));
    const wsTopProducts = XLSX.utils.json_to_sheet(topProductsData);

    // Pestaña 3: Detalle de Tickets
    const ticketsData = data.rawTickets.map(t => ({
      Folio: t.id.substring(0, 8),
      Fecha: new Date(t.date).toLocaleString(),
      Cliente: t.customer,
      Tipo: t.isCredit ? 'FIADO' : 'PAGADO',
      'Ingreso (Cobrado)': `$${t.total.toFixed(2)}`,
      'Costo (Inventario)': `$${t.cost.toFixed(2)}`,
      'Utilidad (Ganancia)': `$${t.profit.toFixed(2)}`
    }));
    const wsTickets = XLSX.utils.json_to_sheet(ticketsData);

    // Crear Libro de Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen General');
    XLSX.utils.book_append_sheet(wb, wsTopProducts, 'Top Productos');
    XLSX.utils.book_append_sheet(wb, wsTickets, 'Desglose de Tickets');

    // Descargar
    XLSX.writeFile(wb, `Reporte_PeruchOS_${startDate}_al_${endDate}.xlsx`);
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-auto custom-scrollbar">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-500" />
            Reportes Financieros
          </h1>
          <p className="text-slate-400 mt-1">Calcula tus utilidades reales y exporta a Excel.</p>
        </div>
      </header>

      {/* Selectores de Fecha */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
        
        {/* Filtros Rápidos */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-white/5">
          <span className="text-sm font-medium text-slate-400 py-1.5">Filtros Rápidos:</span>
          <button onClick={() => setQuickDate('today')} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">Hoy</button>
          <button onClick={() => setQuickDate('yesterday')} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">Ayer</button>
          <button onClick={() => setQuickDate('week')} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">Esta Semana</button>
          <button onClick={() => setQuickDate('month')} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">Este Mes</button>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Desde:
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Hasta:
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BarChart3 className="h-5 w-5" />}
            Generar Reporte
          </button>
        </div>
      </div>

      {data && (
        <div className="animate-fade-in space-y-8">
          
          <div className="flex justify-end">
            <button 
              onClick={exportToExcel}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
            >
              <Download className="h-5 w-5" />
              Descargar Reporte en Excel (.xlsx)
            </button>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <DollarSign className="h-5 w-5 text-blue-400" />
                <span>Ingresos Totales (Cobrado)</span>
              </div>
              <p className="text-3xl font-bold text-white">${data.summary.totalRevenue.toFixed(2)}</p>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <Package className="h-5 w-5 text-amber-400" />
                <span>Costo de Mercancía Vendida</span>
              </div>
              <p className="text-3xl font-bold text-white">${data.summary.totalCost.toFixed(2)}</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/40 transition-all"></div>
              <div className="flex items-center gap-3 mb-2 text-emerald-400 font-bold">
                <TrendingUp className="h-5 w-5" />
                <span>Utilidad Neta (Ganancia Libre)</span>
              </div>
              <p className="text-4xl font-bold text-emerald-400">${data.summary.netProfit.toFixed(2)}</p>
            </div>
          </div>

          {/* Top 10 Productos */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-400" />
              Top 10 Productos Más Vendidos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">#</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Cantidad Vendida</th>
                    <th className="px-4 py-3 text-right">Ingreso Bruto</th>
                    <th className="px-4 py-3 text-right text-emerald-400 rounded-r-lg">Utilidad Generada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-full text-xs font-bold">{p.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">${p.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">${(p.revenue - p.cost).toFixed(2)}</td>
                    </tr>
                  ))}
                  {data.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No hay ventas en este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
