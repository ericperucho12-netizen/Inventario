import React, { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  TrendingUp, Users, AlertTriangle, Package, Loader2, DollarSign, Calendar, Lock, Unlock, X, Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardSummary {
  todayTotal: number;
  monthTotal: number;
  totalCustomers: number;
  lowStockProducts: number;
  chartData: { date: string; name: string; total: number }[];
  recentSales: any[];
}

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Cash Shift State
  const [shiftMetrics, setShiftMetrics] = useState<any>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [ticketZ, setTicketZ] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const [summaryRes, shiftRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/cash-shifts/metrics')
      ]);
      setSummary(summaryRes.data);
      setShiftMetrics(shiftRes.data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialAmount || isNaN(Number(initialAmount))) return;
    setIsProcessing(true);
    try {
      await api.post('/cash-shifts/open', { initialAmount: Number(initialAmount) });
      setShowOpenModal(false);
      setInitialAmount('');
      fetchSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al abrir caja');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaredAmount || isNaN(Number(declaredAmount))) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/cash-shifts/close', { declaredAmount: Number(declaredAmount) });
      // Guardar ticket Z para imprimir
      setTicketZ({
        ...res.data,
        printDate: new Date(),
        salesTotal: shiftMetrics.salesTotal,
        salesCount: shiftMetrics.salesCount
      });
      setShowCloseModal(false);
      setDeclaredAmount('');
      fetchSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setIsProcessing(false);
    }
  };

  const printTicketZ = () => {
    // Basic print for now
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Corte Z</title>
            <style>
              body { font-family: monospace; font-size: 12px; padding: 10px; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .border-y { border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="text-center font-bold">Abarrotes PeruchOS</div>
            <div class="text-center">*** CORTE Z ***</div>
            <div class="border-y">
              <p>Fecha Cierre: ${new Date(ticketZ.closedAt).toLocaleString()}</p>
              <p>Tickets Cobrados: ${ticketZ.salesCount}</p>
            </div>
            <p>Fondo Inicial: $${Number(ticketZ.initialAmount).toFixed(2)}</p>
            <p>Ventas en Efectivo: $${Number(ticketZ.salesTotal).toFixed(2)}</p>
            <p class="font-bold">Total Esperado (Sistema): $${Number(ticketZ.systemAmount).toFixed(2)}</p>
            <div class="border-y">
              <p>Efectivo Declarado: $${Number(ticketZ.declaredAmount).toFixed(2)}</p>
            </div>
            <p class="font-bold ${ticketZ.declaredAmount - ticketZ.systemAmount >= 0 ? '' : 'color: red'}">
              Diferencia: $${(ticketZ.declaredAmount - ticketZ.systemAmount).toFixed(2)}
            </p>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    setTicketZ(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Resumen de tu Negocio
          </h1>
          <p className="text-slate-400 mt-1">Echa un vistazo rápido a cómo van tus ventas.</p>
        </div>

        {/* Control de Caja Header */}
        {shiftMetrics && (
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-sm shadow-xl ${
            shiftMetrics.status === 'OPEN' 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${shiftMetrics.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {shiftMetrics.status === 'OPEN' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Estado de Caja</p>
                <p className={`font-bold ${shiftMetrics.status === 'OPEN' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {shiftMetrics.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
                </p>
              </div>
            </div>
            
            <div className="h-10 w-px bg-white/10 mx-2"></div>
            
            <button
              onClick={() => shiftMetrics.status === 'OPEN' ? setShowCloseModal(true) : setShowOpenModal(true)}
              className={`font-bold py-2 px-6 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                shiftMetrics.status === 'OPEN'
                  ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25'
              }`}
            >
              {shiftMetrics.status === 'OPEN' ? 'Corte Z (Cerrar)' : 'Abrir Caja'}
            </button>
          </div>
        )}
      </header>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Ventas de Hoy */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Ingresos de Hoy</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ${summary.todayTotal.toFixed(2)}
          </p>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Este Mes</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ${summary.monthTotal.toFixed(2)}
          </p>
        </div>

        {/* Clientes */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Clientes Totales</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {summary.totalCustomers}
          </p>
        </div>

        {/* Bajo Stock */}
        <Link to="/catalog" className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group hover:border-red-500/40 transition-all cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Bajo Stock (≤ 5)</h3>
          </div>
          <p className="text-3xl font-bold text-red-400 mb-1">
            {summary.lowStockProducts}
          </p>
          <span className="text-xs text-red-400/50 mt-auto flex items-center gap-1 group-hover:text-red-400/80">
            Click para revisar inventario <TrendingUp className="h-3 w-3" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Ventas de los últimos 7 días
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff50" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#ffffff50" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {summary.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === summary.chartData.length - 1 ? '#10b981' : '#10b98180'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-500" />
            Actividad Reciente
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {summary.recentSales.map((sale) => (
              <div key={sale.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">
                    {sale.customer ? sale.customer.name : 'Público en Gral.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">
                    ${Number(sale.total).toFixed(2)}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                    sale.isCredit ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {sale.isCredit ? 'FIADO' : 'PAGADO'}
                  </span>
                </div>
              </div>
            ))}
            {summary.recentSales.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-sm">
                Aún no hay ventas registradas.
              </div>
            )}
          </div>
          <Link to="/history" className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
            Ver todo el historial →
          </Link>
        </div>
      </div>

      {/* MODAL ABRIR CAJA */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative">
            <button onClick={() => setShowOpenModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Unlock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Abrir Caja</h2>
                <p className="text-xs text-slate-400">Inicia tu turno de ventas</p>
              </div>
            </div>

            <form onSubmit={handleOpenShift}>
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Fondo de Caja (Efectivo Inicial)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner text-xl font-bold"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">¿Con cuánto efectivo en monedas/billetes estás abriendo la caja para dar cambio?</p>
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Unlock className="h-5 w-5" />}
                Confirmar Apertura
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CERRAR CAJA (CORTE Z) */}
      {showCloseModal && shiftMetrics && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative">
            <button onClick={() => setShowCloseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Corte Z (Cerrar)</h2>
                <p className="text-xs text-slate-400">Finaliza tu turno y haz corte ciego</p>
              </div>
            </div>

            <form onSubmit={handleCloseShift}>
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-slate-300 mb-1">Tickets cobrados: <span className="font-bold text-white">{shiftMetrics.salesCount}</span></p>
                <p className="text-xs text-amber-400">Cuenta tu dinero físico antes de continuar.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Efectivo Físico Declarado</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    value={declaredAmount}
                    onChange={(e) => setDeclaredAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner text-xl font-bold"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">¿Cuánto dinero (fondo inicial + ventas) tienes físicamente en la caja ahora mismo?</p>
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                Cerrar Caja Definitivamente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TICKET Z (VISTA PREVIA) */}
      {ticketZ && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Corte Z Exitoso</h2>
            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar bg-white rounded p-4">
              <div className="text-black font-mono text-xs">
                <div className="text-center mb-4">
                  <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
                  <p>*** CORTE Z ***</p>
                  <p>{new Date(ticketZ.closedAt).toLocaleString()}</p>
                </div>
                <div className="border-y border-dashed border-gray-400 py-2 mb-2">
                  <p>Fondo Inicial: ${Number(ticketZ.initialAmount).toFixed(2)}</p>
                  <p>Ventas en Efectivo: ${Number(ticketZ.salesTotal).toFixed(2)}</p>
                  <p>Tickets Emitidos: {ticketZ.salesCount}</p>
                </div>
                <div className="mb-2">
                  <p className="font-bold">TOTAL SISTEMA: ${Number(ticketZ.systemAmount).toFixed(2)}</p>
                  <p className="font-bold">TOTAL FÍSICO: ${Number(ticketZ.declaredAmount).toFixed(2)}</p>
                </div>
                <div className={`border-t border-dashed border-gray-400 pt-2 font-bold text-sm ${ticketZ.declaredAmount - ticketZ.systemAmount < 0 ? 'text-red-600' : 'text-black'}`}>
                  DIFERENCIA: ${(ticketZ.declaredAmount - ticketZ.systemAmount).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={printTicketZ}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="h-5 w-5" /> Imprimir
              </button>
              <button 
                onClick={() => setTicketZ(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
