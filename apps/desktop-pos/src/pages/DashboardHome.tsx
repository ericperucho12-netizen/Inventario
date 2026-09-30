import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, AlertTriangle, Package, Loader2, DollarSign, Calendar, Lock, Unlock, X, Printer, CreditCard, ShoppingCart, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../store/settings.store';

interface DashboardSummary {
  todayTotal: number;
  monthTotal: number;
  monthPurchases: number;
  monthExpenses: number;
  monthProfit: number;
  totalCustomers: number;
  lowStockProducts: number;
  accountsReceivable: number;
  inventoryValue: number;
  chartData: { date: string; name: string; ventas: number; compras: number; gastos: number }[];
  recentSales: any[];
  recentExpenses: any[];
  topProducts: { name: string; totalSold: number; profit: number }[];
}

export default function DashboardHome() {
  const { theme } = useSettingsStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  // Cash Shift State
  const [shiftMetrics, setShiftMetrics] = useState<any>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [ticketZ, setTicketZ] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Computed reactively whenever products or threshold change
  const lowStockList = useMemo(() =>
    allProducts.filter(p => Number(p.stock) <= lowStockThreshold)
  , [allProducts, lowStockThreshold]);

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const fetchSummary = async () => {
    try {
      const [summaryRes, shiftRes] = await Promise.all([
        api.get(`/dashboard/summary?period=${period}`),
        api.get('/cash-shifts/metrics')
      ]);
      setSummary(summaryRes.data);
      setShiftMetrics(shiftRes.data);
      // Fetch all products for low stock monitoring
      const lowRes = await api.get('/products');
      setAllProducts(lowRes.data);
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
            <div class="text-center font-bold">PeruchOS System</div>
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
          <div className={`flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-sm shadow-xl ${
            shiftMetrics.status === 'OPEN' 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
              <div className={`p-2 rounded-full ${shiftMetrics.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {shiftMetrics.status === 'OPEN' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm text-slate-400 font-medium">Estado de Caja</p>
                <p className={`font-bold ${shiftMetrics.status === 'OPEN' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {shiftMetrics.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block h-10 w-px bg-white/10 mx-2"></div>
            
            <button
              onClick={() => shiftMetrics.status === 'OPEN' ? setShowCloseModal(true) : setShowOpenModal(true)}
              className={`w-full sm:w-auto font-bold py-3 sm:py-2 px-6 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
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

      {/* ALERTA DE STOCK BAJO */}
      {lowStockList.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg animate-pulse shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-400 leading-tight">¡Alerta! {lowStockList.length} producto(s) con stock bajo (≤ {lowStockThreshold})</h3>
                <p className="text-xs text-slate-400 mt-1">Considera reabastecer pronto.</p>
              </div>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0 bg-slate-950/50 p-2 rounded-xl">
              <label className="text-xs text-slate-400 whitespace-nowrap">Límite de alerta:</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0) setLowStockThreshold(val);
                }}
                className="w-16 bg-slate-950 border border-red-500/30 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-red-500"
              />
              <Link to="/purchases" className="bg-red-500 hover:bg-red-400 text-white text-sm font-bold py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap ml-auto sm:ml-0">
                + Reponer
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {lowStockList.map((prod: any) => (
              <div key={prod.id} className="flex items-center justify-between gap-2 bg-slate-900/80 border border-red-500/20 rounded-xl px-3 py-2">
                <span className="text-sm text-white truncate flex-1" title={prod.description}>{prod.description}</span>
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                  Number(prod.stock) <= 0 ? 'bg-red-600/30 text-red-300' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {Number(prod.stock) <= 0 ? 'AGOTADO' : `${prod.stock} ${prod.isBulk ? 'kg' : 'pzas'}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Ventas de Hoy */}
        <div className="bg-slate-900/50 border border-emerald-500/20 hover:border-emerald-500/40 transition-all rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
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
        <div className="bg-slate-900/50 border border-teal-500/20 hover:border-teal-500/40 transition-all rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
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
        <div className="bg-slate-900/50 border border-blue-500/20 hover:border-blue-500/40 transition-all rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
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
            <div className={`p-3 bg-red-500/20 text-red-400 rounded-xl ${lowStockList.length > 0 ? 'animate-pulse' : ''}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Bajo Stock (≤ {lowStockThreshold})</h3>
          </div>
          <p className="text-3xl font-bold text-red-400 mb-1">
            {lowStockList.length}
          </p>
          <span className="text-xs text-red-400/50 mt-auto flex items-center gap-1 group-hover:text-red-400/80">
            Click para revisar inventario <TrendingUp className="h-3 w-3" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        
        {/* Inversión (Compras) */}
        <div className="bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Inversión (Compras)</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-400 mb-1">
            ${(summary.monthPurchases || 0).toFixed(2)}
          </p>
          <span className="text-xs text-indigo-400/50 mt-auto">Mercancía este mes</span>
        </div>

        {/* Gastos Hormiga */}
        <Link to="/expenses" className="bg-slate-900/50 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group cursor-pointer hover:border-orange-500/40 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Gastos</h3>
          </div>
          <p className="text-3xl font-bold text-orange-400 mb-1">
            ${(summary.monthExpenses || 0).toFixed(2)}
          </p>
          <span className="text-xs text-orange-400/50 mt-auto flex items-center gap-1 group-hover:text-orange-400/80">
            Ver Detalles <TrendingUp className="h-3 w-3" />
          </span>
        </Link>

        {/* Utilidades (Ganancias Reales) */}
        <div className={`bg-slate-900/50 border rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group ${
          (summary.monthProfit || 0) - (summary.monthExpenses || 0) < 0 
            ? 'border-red-500/30 hover:border-red-500/50' 
            : 'border-emerald-500/20 hover:border-emerald-500/40'
        } transition-all`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl transition-all ${
            (summary.monthProfit || 0) - (summary.monthExpenses || 0) < 0 
              ? 'bg-red-500/10 group-hover:bg-red-500/20' 
              : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
          }`}></div>
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-xl ${
              (summary.monthProfit || 0) - (summary.monthExpenses || 0) < 0 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Utilidad Neta Real</h3>
          </div>
          <p className={`text-3xl font-bold mb-1 ${
            (summary.monthProfit || 0) - (summary.monthExpenses || 0) < 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {((summary.monthProfit || 0) - (summary.monthExpenses || 0)) < 0 ? '-' : ''}${Math.abs((summary.monthProfit || 0) - (summary.monthExpenses || 0)).toFixed(2)}
          </p>
          <span className={`text-xs mt-auto ${
             (summary.monthProfit || 0) - (summary.monthExpenses || 0) < 0 ? 'text-red-400/70' : 'text-emerald-400/50'
          }`}>
            {(summary.monthProfit || 0) - (summary.monthExpenses || 0) < 0 ? '¡Estás en pérdidas!' : 'Ganancia - Gastos'}
          </span>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-slate-900/50 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Cuentas por Cobrar</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400 mb-1">
            ${(summary.accountsReceivable || 0).toFixed(2)}
          </p>
          <span className="text-xs text-amber-400/50 mt-auto">Dinero en la calle</span>
        </div>

        {/* Valor de Inventario */}
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-slate-400 font-medium">Valor del Inventario</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400 mb-1">
            ${(summary.inventoryValue || 0).toFixed(2)}
          </p>
          <span className="text-xs text-purple-400/50 mt-auto">Costo de mercancía en stock</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Ventas y Compras
            </h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="week">Últimos 7 días</option>
              <option value="month">Últimos 30 días</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={summary.chartData.map(d => ({
                  ...d,
                  compras: d.compras > 0 ? -d.compras : d.compras,
                  gastos: d.gastos > 0 ? -d.gastos : d.gastos
                }))} 
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#00000010' : '#ffffff10'} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={theme === 'light' ? '#64748b' : '#ffffff50'} 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke={theme === 'light' ? '#64748b' : '#ffffff50'} 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: theme === 'light' ? '#00000005' : '#ffffff05' }}
                  contentStyle={{ backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#ffffff10'}`, borderRadius: '12px' }}
                  labelStyle={{ color: theme === 'light' ? '#475569' : '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number, name: string) => {
                    const isNegative = value < 0;
                    const absValue = Math.abs(value).toFixed(2);
                    return [isNegative ? `-$${absValue}` : `$${absValue}`, name.charAt(0).toUpperCase() + name.slice(1)];
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="compras" name="Compras" fill="#6366f1" radius={[0, 0, 6, 6]} maxBarSize={40} />
                <Bar dataKey="gastos" name="Gastos" fill="#f97316" radius={[0, 0, 6, 6]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-slate-900/50 border border-teal-500/20 hover:border-teal-500/40 transition-all rounded-2xl p-6 backdrop-blur-sm flex flex-col">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Top Products */}
        <div className="bg-slate-900/50 border border-purple-500/20 hover:border-purple-500/40 transition-all rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Productos más vendidos y Ganancias
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium text-right">Cant. Vendida</th>
                  <th className="px-4 py-3 font-medium text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.topProducts?.map((product, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{product.totalSold}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      ${product.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!summary.topProducts || summary.topProducts.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Aún no hay datos de productos más vendidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos Gastos */}
        <div className="bg-slate-900/50 border border-orange-500/20 hover:border-orange-500/40 transition-all rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            Gastos Operativos
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {summary.recentExpenses?.map((expense: any) => (
              <div key={expense.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">
                    {expense.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(expense.createdAt).toLocaleDateString()} {new Date(expense.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-400">
                    -${Number(expense.amount).toFixed(2)}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block bg-red-500/20 text-red-400">
                    SALIDA
                  </span>
                </div>
              </div>
            ))}
            {(!summary.recentExpenses || summary.recentExpenses.length === 0) && (
              <div className="text-center text-slate-500 py-8 text-sm">
                No hay gastos registrados.
              </div>
            )}
          </div>
          <Link to="/expenses" className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-orange-400 font-medium hover:text-orange-300 transition-colors">
            Registrar o ver todos los gastos →
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
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-sm text-slate-300">Tickets cobrados: <span className="font-bold text-white">{shiftMetrics.salesCount}</span></p>
                {shiftMetrics.extraIncome > 0 && (
                  <p className="text-sm text-emerald-400">Abonos recibidos: <span className="font-bold">+${shiftMetrics.extraIncome.toFixed(2)}</span></p>
                )}
                <p className="text-xs text-amber-400 pt-2 border-t border-white/10 mt-2">Cuenta tu dinero físico antes de continuar.</p>
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
                  <h1 className="font-bold text-base mb-1">PeruchOS System</h1>
                  <p>*** CORTE Z ***</p>
                  <p>{new Date(ticketZ.closedAt).toLocaleString()}</p>
                </div>
                <div className="border-y border-dashed border-gray-400 py-2 mb-2">
                  <p>Fondo Inicial: ${Number(ticketZ.initialAmount).toFixed(2)}</p>
                  <p>Ventas en Efectivo: ${Number(ticketZ.salesTotal).toFixed(2)}</p>
                  <p>Abonos de Deudas: ${Number(ticketZ.extraIncome || 0).toFixed(2)}</p>
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
