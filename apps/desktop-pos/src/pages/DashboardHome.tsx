import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/axios';
import { DollarSign, Receipt, Lock, Unlock, Loader2, Printer, X } from 'lucide-react';

interface CashShiftMetrics {
  status: 'OPEN' | 'CLOSED';
  shift?: {
    id: string;
    initialAmount: string;
    openedAt: string;
  };
  salesTotal: number;
  salesCount: number;
}

export default function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const [metrics, setMetrics] = useState<CashShiftMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario Apertura
  const [initialAmount, setInitialAmount] = useState('0.00');
  const [isOpening, setIsOpening] = useState(false);

  // Formulario Cierre
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Z-Report Ticket
  const [showZReport, setShowZReport] = useState(false);
  const [zReportData, setZReportData] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/cash-shifts/metrics');
      setMetrics(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpening(true);
    try {
      await api.post('/cash-shifts/open', { initialAmount: Number(initialAmount) });
      fetchMetrics();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error abriendo la caja');
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClosing(true);
    try {
      const res = await api.post('/cash-shifts/close', { declaredAmount: Number(declaredAmount) });
      
      // Data para el ticket Z
      setZReportData({
        shift: res.data,
        metrics: metrics
      });
      setShowCloseModal(false);
      setShowZReport(true);
      fetchMetrics();
      setDeclaredAmount('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error cerrando la caja');
    } finally {
      setIsClosing(false);
    }
  };

  const handlePrintZ = () => {
    if (!ticketRef.current) return;
    const printContent = ticketRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Corte Z</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: black; background: white; }
              table { width: 100%; }
              th, td { text-align: left; padding: 2px 0; }
              td.right { text-align: right; }
              .divider { border-top: 1px dashed black; margin: 10px 0; }
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
  };

  if (loading) return <div className="p-8 text-white">Cargando dashboard...</div>;

  const isOpen = metrics?.status === 'OPEN';

  return (
    <div className="p-8 bg-slate-950 min-h-full">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Bienvenido de vuelta, {user?.fullName}</p>
        </div>
        <div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {isOpen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isOpen ? 'Turno Abierto' : 'Turno Cerrado'}
          </span>
        </div>
      </header>

      {!isOpen ? (
        <div className="max-w-md mx-auto mt-20 bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Abrir Caja</h2>
            <p className="text-slate-400 text-sm mt-2">Ingresa el fondo inicial de efectivo para comenzar a vender.</p>
          </div>

          <form onSubmit={handleOpenShift} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fondo Inicial ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white text-xl font-bold text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isOpening}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isOpening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Unlock className="h-5 w-5" />}
              Abrir Turno
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-medium text-slate-400">Ventas del Turno</h3>
              </div>
              <p className="text-3xl font-bold text-white">${metrics.salesTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-medium text-slate-400">Tickets Emitidos</h3>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.salesCount}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Cierre de Turno</h3>
            <p className="text-slate-400 text-sm mb-6">Al cerrar el turno se realizará un Corte Z. Deberás declarar el efectivo que tienes en caja.</p>
            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              <Lock className="h-5 w-5" />
              Cerrar Caja
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cierre */}
      {showCloseModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setShowCloseModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Corte de Caja</h2>
            <p className="text-slate-400 text-sm mb-6">Cuenta el dinero físico y decláralo aquí (Corte Ciego).</p>
            
            <form onSubmit={handleCloseShift} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Efectivo en Caja ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={declaredAmount}
                  onChange={(e) => setDeclaredAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white text-xl font-bold text-center focus:outline-none focus:border-red-500"
                  placeholder="0.00"
                />
              </div>
              <button
                type="submit"
                disabled={isClosing}
                className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isClosing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Cierre'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ticket Corte Z */}
      {showZReport && zReportData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <div className="bg-white rounded p-4 mb-6 text-black font-mono text-xs" ref={ticketRef}>
              <div className="text-center mb-4">
                <h1 className="font-bold text-base">CORTE Z</h1>
                <p>{new Date().toLocaleString()}</p>
                <p>Turno: {zReportData.shift.id.split('-')[0]}</p>
              </div>
              
              <div className="divider"></div>
              <table>
                <tbody>
                  <tr><td>Fondo Inicial:</td><td className="right">${Number(zReportData.shift.initialAmount).toFixed(2)}</td></tr>
                  <tr><td>Ventas del Turno:</td><td className="right">${zReportData.metrics.salesTotal.toFixed(2)}</td></tr>
                  <tr><td>Total Esperado:</td><td className="right font-bold">${Number(zReportData.shift.systemAmount).toFixed(2)}</td></tr>
                </tbody>
              </table>
              <div className="divider"></div>
              <table>
                <tbody>
                  <tr><td>Total Declarado:</td><td className="right">${Number(zReportData.shift.declaredAmount).toFixed(2)}</td></tr>
                  <tr>
                    <td>Diferencia:</td>
                    <td className="right font-bold">
                      ${(Number(zReportData.shift.declaredAmount) - Number(zReportData.shift.systemAmount)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="divider"></div>
              <p className="text-center mt-4">Turno Cerrado Correctamente</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handlePrintZ}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Printer className="h-5 w-5" />
                Imprimir
              </button>
              <button 
                onClick={() => setShowZReport(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold"
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
