import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/axios';
import { History as HistoryIcon, Loader2, Printer, X, ShoppingCart } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';

export default function History() {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');

  const { defaultPrinter } = useSettingsStore();
  const ticketRef = useRef<HTMLDivElement>(null);
  const purchaseTicketRef = useRef<HTMLDivElement>(null);
  const [printTicketData, setPrintTicketData] = useState<any>(null);
  const [printPurchaseData, setPrintPurchaseData] = useState<any>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales?days=7');
      setSales(res.data);
    } catch (error) {
      console.error('Error fetching sales history', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases');
      // Filtramos compras del último mes en frontend para simplicidad o asumimos que son recientes
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const recentPurchases = res.data.filter((p: any) => new Date(p.createdAt) >= oneMonthAgo);
      setPurchases(recentPurchases);
    } catch (error) {
      console.error('Error fetching purchases history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSales();
    } else {
      fetchPurchases();
    }
  }, [activeTab]);

  const handlePrint = (sale: any) => {
    setPrintTicketData({
      ...sale,
      printDate: new Date()
    });
    setShowSalesModal(true);
  };

  const handlePrintPurchase = (purchase: any) => {
    setPrintPurchaseData({
      ...purchase,
      printDate: new Date()
    });
    setShowPurchaseModal(true);
  };

  const printPurchaseTicket = () => {
    if (!purchaseTicketRef.current) return;
    const electron = (window as any).require ? (window as any).require('electron') : null;
    if (electron && defaultPrinter) {
      electron.ipcRenderer.send('print-ticket', {
        htmlContent: purchaseTicketRef.current.innerHTML,
        deviceName: defaultPrinter
      });
      setShowPurchaseModal(false);
    } else {
      const printContent = purchaseTicketRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket Compra (Copia)</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: black; background: white; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-y { border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
                ul { list-style: none; padding: 0; margin: 0; }
                li { display: flex; justify-content: space-between; margin-bottom: 5px; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      setShowPurchaseModal(false);
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
      setShowSalesModal(false);
    } else {
      const printContent = ticketRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket (Copia)</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: black; background: white; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-y { border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
                ul { list-style: none; padding: 0; margin: 0; }
                li { display: flex; justify-content: space-between; margin-bottom: 5px; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      setShowSalesModal(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial</h1>
          <p className="text-slate-400 mt-1">Consulta los tickets de los últimos 7 días</p>
        </div>
      </header>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'sales' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Ventas (Últimos 7 días)
        </button>
        <button 
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'purchases' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Compras a Proveedores
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : activeTab === 'sales' ? (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-300 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                  <th className="px-6 py-4 font-medium text-center">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-white">{new Date(sale.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sale.customer ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-amber-400">{sale.customer.name}</span>
                          <span className="text-xs text-slate-400">Fiado (Crédito)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Público en General</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {sale.status === 'COMPLETED' ? 'COMPLETADA' : 'DEVUELTA'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ${Number(sale.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handlePrint(sale)}
                        className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Reimprimir Ticket"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No hay ventas en los últimos 7 días.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-300 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium text-right">Total Invertido</th>
                  <th className="px-6 py-4 font-medium text-center">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-white">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{new Date(purchase.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-400">{purchase.supplier?.name || 'Proveedor Eliminado'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ${Number(purchase.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handlePrintPurchase(purchase)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:text-white hover:bg-blue-500 transition-colors"
                        title="Reimprimir Ticket de Compra"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No hay compras a proveedores registradas en el último mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden Ticket for Printing */}
      <div className="hidden">
        {printTicketData && (
          <div className="bg-white text-black p-6 w-[300px] text-xs font-mono" ref={ticketRef}>
            <div className="text-center mb-4">
              <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
              <p>*** COPIA DE TICKET ***</p>
              {printTicketData.isCredit && <p className="font-bold mt-1">*** VENTA A CRÉDITO ***</p>}
            </div>
            
            <div className="border-y border-dashed border-black my-4 py-2">
              <p>Fecha Original: {new Date(printTicketData.createdAt).toLocaleString()}</p>
              <p>Fecha Impresión: {printTicketData.printDate.toLocaleString()}</p>
              <p>Folio: {printTicketData.id.substring(0, 8)}</p>
              {printTicketData.customer && <p>Cliente: {printTicketData.customer.name}</p>}
            </div>

            <ul className="mb-4">
              {printTicketData.details?.map((item: any) => (
                <li key={item.id}>
                  <span>{item.quantity}x {item.product?.description}</span>
                  <span>${Number(item.subtotal).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-dashed border-black pt-2 text-right">
              <p className="text-sm font-bold">TOTAL: ${Number(printTicketData.total).toFixed(2)}</p>
            </div>
            
            {printTicketData.status === 'REFUNDED' && (
              <div className="text-center mt-4 border border-black p-2 font-bold">
                ESTA VENTA FUE DEVUELTA
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Ticket de Venta */}
      {showSalesModal && printTicketData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowSalesModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Vista Previa de Ticket</h2>
            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar bg-white rounded p-4" ref={ticketRef}>
              <div className="text-black font-mono text-xs">
                <div className="text-center mb-4">
                  <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
                  <p>Ticket (Copia)</p>
                  <p>{new Date(printTicketData.createdAt).toLocaleString()}</p>
                </div>
                <table className="w-full mb-4 border-collapse">
                  <thead>
                    <tr className="border-b border-dashed border-gray-400">
                      <th className="text-left pb-1 font-normal">Cant.</th>
                      <th className="text-left pb-1 font-normal">Desc.</th>
                      <th className="text-right pb-1 font-normal">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printTicketData.details?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="pt-2 align-top">{item.quantity}</td>
                        <td className="pt-2 align-top break-words pr-2">{item.product?.description}</td>
                        <td className="pt-2 align-top text-right">${Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-dashed border-gray-400 pt-2 text-right">
                  <p className="text-sm font-bold">TOTAL: ${Number(printTicketData.total).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={printTicket}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25"
            >
              <Printer className="h-5 w-5" /> Imprimir Copia
            </button>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Compra */}
      {showPurchaseModal && printPurchaseData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Vista Previa de Recepción</h2>
            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar bg-white rounded p-4" ref={purchaseTicketRef}>
              <div className="text-black font-mono text-xs">
                <div className="text-center mb-4">
                  <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
                  <p>*** COPIA TICKET DE ENTRADA ***</p>
                  <p>Fecha Original: {new Date(printPurchaseData.createdAt).toLocaleString()}</p>
                  <p>Proveedor: {printPurchaseData.supplier?.name}</p>
                </div>
                <table className="w-full mb-4 border-collapse">
                  <thead>
                    <tr className="border-b border-dashed border-gray-400">
                      <th className="text-left pb-1 font-normal">Cant.</th>
                      <th className="text-left pb-1 font-normal">Desc.</th>
                      <th className="text-right pb-1 font-normal">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printPurchaseData.details?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="pt-2 align-top">{item.quantity}</td>
                        <td className="pt-2 align-top break-words pr-2">{item.product?.description}</td>
                        <td className="pt-2 align-top text-right">${Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-dashed border-gray-400 pt-2 text-right">
                  <p className="text-sm font-bold">TOTAL COMPRA: ${Number(printPurchaseData.total).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={printPurchaseTicket}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25"
            >
              <Printer className="h-5 w-5" /> Imprimir Copia
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
