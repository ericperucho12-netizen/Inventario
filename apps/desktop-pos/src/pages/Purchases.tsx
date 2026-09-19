import { useRef, useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Truck, Plus, Check, Loader2, Search, X, Printer, History, FileText } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import type { Product } from './Pos';

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseItem {
  product: Product;
  quantity: number;
  unitCost: number;
  newSellingPrice?: number;
}

export default function Purchases() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<{ items: any[], total: number, date: Date, id: string, supplierName: string } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const ticketRef = useRef<HTMLDivElement>(null);
  
  // Custom Settings
  const { defaultPrinter, scannerEnabled } = useSettingsStore();
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    Promise.all([
      api.get('/suppliers'),
      api.get('/products')
    ]).then(([suppRes, prodRes]) => {
      setSuppliers(suppRes.data);
      setProducts(prodRes.data);
      if (suppRes.data.length > 0) setSelectedSupplierId(suppRes.data[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/purchases');
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Global scanner listener
  useEffect(() => {
    if (!scannerEnabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      // If time between keystrokes is > 50ms, probably not a scanner
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          const scannedCode = barcodeBuffer.current;
          barcodeBuffer.current = '';
          
          // Auto add to items if product found
          const product = products.find(p => p.barcode === scannedCode);
          if (product) {
            addItem(product);
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [scannerEnabled, products]);

  const filteredProducts = products.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  const addItem = (product: Product) => {
    const exists = items.find(i => i.product.id === product.id);
    if (exists) {
      setItems(items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([{ product, quantity: 1, unitCost: Number(product.costPrice), newSellingPrice: Number(product.sellingPrice) }, ...items]);
    }
    setSearchTerm('');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product.id !== productId));
  };

  const updateItem = (productId: string, field: keyof PurchaseItem, value: number) => {
    setItems(items.map(i => i.product.id === productId ? { ...i, [field]: value } : i));
  };

  const total = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

  const handleSavePurchase = async () => {
    if (!selectedSupplierId) return alert('Selecciona un proveedor');
    if (items.length === 0) return alert('Agrega productos a la recepción');

    setIsSaving(true);
    try {
      const response = await api.post('/purchases', {
        supplierId: selectedSupplierId,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitCost: i.unitCost,
          newSellingPrice: i.newSellingPrice !== Number(i.product.sellingPrice) ? i.newSellingPrice : undefined
        }))
      });
      
      const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || 'Desconocido';
      
      setTicketData({
        items: [...items],
        total,
        date: new Date(),
        id: response.data.id,
        supplierName
      });
      
      setShowTicket(true);
      setItems([]);
      // Recargar productos para tener el nuevo stock y costo
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      alert('Error guardando recepción');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!ticketRef.current) return;

    const electron = (window as any).require ? (window as any).require('electron') : null;
    if (electron && defaultPrinter) {
      // Silent print using Electron
      electron.ipcRenderer.send('print-ticket', {
        htmlContent: ticketRef.current.innerHTML,
        deviceName: defaultPrinter
      });
    } else {
      // Standard browser print
      const printContent = ticketRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket de Recepción</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: black; background: white; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                th, td { text-align: left; padding: 2px 0; }
                .right { text-align: right; }
                .ticket-header { text-align: center; margin-bottom: 10px; }
                .ticket-header h1 { font-size: 16px; margin: 0; }
                .ticket-items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .ticket-items th, .ticket-items td { text-align: left; padding: 2px 0; }
                .ticket-items th.right, .ticket-items td.right { text-align: right; }
                .ticket-total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px dashed black; padding-top: 10px; }
                .ticket-footer { text-align: center; margin-top: 20px; font-size: 10px; }
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

  if (loading) return <div className="p-8 text-white"><Loader2 className="animate-spin" /></div>;

  const viewPastTicket = (purchase: any) => {
    setTicketData({
      items: purchase.details,
      total: purchase.total,
      date: new Date(purchase.createdAt),
      id: purchase.id,
      supplierName: purchase.supplier?.name || 'Desconocido'
    });
    setShowTicket(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans">
      <header className="p-6 border-b border-white/10 bg-slate-900 flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Truck className="h-6 w-6 text-emerald-500" />
          Recepción de Mercancía
        </h1>
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setActiveTab('new')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'new' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>Nueva Entrada</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <History className="h-4 w-4" /> Historial
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'new' ? (
          <>
            {/* Columna Izquierda: Buscador */}
            <div className="flex-1 flex flex-col border-r border-white/10">
              <div className="p-6 border-b border-white/10 bg-slate-900/50">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Escanear código o buscar producto para ingresar..."
                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="bg-slate-900 border border-white/10 rounded-xl p-4 text-left hover:border-emerald-500/50 hover:bg-slate-800 transition-all group"
              >
                <p className="text-xs text-slate-500 mb-1 font-mono">{p.barcode}</p>
                <p className="text-sm font-bold text-white mb-2 line-clamp-2">{p.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Stock: {p.stock}</span>
                  <span className="text-emerald-400 font-bold">Costo: ${Number(p.costPrice).toFixed(2)}</span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center p-8 text-slate-500 flex flex-col items-center justify-center">
                <Truck className="h-16 w-16 opacity-20 mb-4" />
                <p>No se encontraron productos.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Detalle de Recepción */}
      <div className="w-[450px] bg-slate-900 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-white/10">
          <label className="block text-sm font-medium text-slate-400 mb-2">Proveedor</label>
          <select 
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="" disabled>Seleccione un proveedor...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.map(item => (
            <div key={item.product.id} className="bg-slate-950 border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-bold text-white line-clamp-1">{item.product.description}</p>
                  <p className="text-xs text-slate-500">{item.product.barcode}</p>
                </div>
                <button onClick={() => removeItem(item.product.id)} className="text-red-500/50 hover:text-red-400 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Cantidad</label>
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.product.id, 'quantity', Number(e.target.value))} className="w-full bg-slate-900 border border-white/10 rounded py-1 px-2 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-emerald-500/70 mb-1 block">Costo Unit.</label>
                  <input type="number" step="0.01" value={item.unitCost} onChange={e => updateItem(item.product.id, 'unitCost', Number(e.target.value))} className="w-full bg-slate-900 border border-white/10 rounded py-1 px-2 text-emerald-400 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-blue-400/70 mb-1 block">Nuevo Precio Venta al Público (Opcional)</label>
                  <input type="number" step="0.01" value={item.newSellingPrice} onChange={e => updateItem(item.product.id, 'newSellingPrice', Number(e.target.value))} className="w-full bg-slate-900 border border-white/10 rounded py-1 px-2 text-blue-400 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-slate-500 p-8 text-sm">
              Lista vacía
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-950 border-t border-white/10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-medium">Total de la Nota</span>
            <span className="text-3xl font-bold text-white">${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleSavePurchase}
            disabled={items.length === 0 || !selectedSupplierId || isSaving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : <Check className="h-6 w-6" />}
            {isSaving ? 'Guardando...' : 'Registrar Compra'}
          </button>
        </div>
      </div>
        </>
      ) : (
        <div className="flex-1 overflow-auto p-8 bg-slate-950">
          {loadingHistory ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-400 text-sm">
                  <tr>
                    <th className="p-4 font-medium">Folio</th>
                    <th className="p-4 font-medium">Fecha</th>
                    <th className="p-4 font-medium">Proveedor</th>
                    <th className="p-4 font-medium">Monto</th>
                    <th className="p-4 font-medium text-right">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-white">
                  {history.map(h => (
                    <tr key={h.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-slate-400">{h.id.split('-')[0]}</td>
                      <td className="p-4">{new Date(h.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-bold">{h.supplier?.name || 'Desconocido'}</td>
                      <td className="p-4 font-medium text-emerald-400">${Number(h.total).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => viewPastTicket(h)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors inline-flex">
                          <FileText className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay compras registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modal de Ticket de Recepción */}
      {showTicket && ticketData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowTicket(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar bg-white rounded p-4" ref={ticketRef}>
              <div className="text-black font-mono text-xs">
                <div className="text-center mb-4">
                  <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
                  <p>Comprobante de Recepción</p>
                  <p className="font-bold mt-1">{ticketData.supplierName}</p>
                  <p>{ticketData.date.toLocaleString()}</p>
                  <p className="text-[10px] mt-1 text-gray-500">Folio: {ticketData.id.split('-')[0]}</p>
                </div>
                
                <table className="w-full mb-4 border-collapse">
                  <thead>
                    <tr className="border-b border-dashed border-gray-400">
                      <th className="text-left pb-1 font-normal">Cant.</th>
                      <th className="text-left pb-1 font-normal">Desc.</th>
                      <th className="text-right pb-1 font-normal">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketData.items.map((item, idx) => {
                      const desc = item.product?.description || (item as any).description || 'Desconocido';
                      return (
                      <tr key={idx}>
                        <td className="pt-2 align-top">{item.quantity}</td>
                        <td className="pt-2 align-top break-words pr-2">{desc}</td>
                        <td className="pt-2 align-top text-right">${(item.quantity * item.unitCost).toFixed(2)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
                
                <div className="border-t border-dashed border-gray-400 pt-2 text-right">
                  <p className="font-bold text-sm">TOTAL NOTA: ${ticketData.total.toFixed(2)}</p>
                </div>
                
                <div className="text-center mt-6 text-gray-500 text-[10px]">
                  <p>Copia de almacén</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handlePrint}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="h-5 w-5" />
                Imprimir
              </button>
              <button 
                onClick={() => setShowTicket(false)}
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
