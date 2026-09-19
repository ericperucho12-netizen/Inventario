import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/axios';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, Loader2, Printer, X, CheckCircle2, User, FileText } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';

export interface Product {
  id: string;
  barcode: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  category: { id: string; name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
}

export default function Pos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<{ items: CartItem[], total: number, date: Date, id: string, isCredit?: boolean, customerName?: string } | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [shiftStatus, setShiftStatus] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);
  
  // Custom Settings
  const { defaultPrinter, scannerEnabled } = useSettingsStore();
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  const fetchProducts = () => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
  };

  const fetchCustomers = () => {
    api.get('/customers').then(res => setCustomers(res.data)).catch(console.error);
  };

  const fetchShiftStatus = async () => {
    try {
      const res = await api.get('/cash-shifts/metrics');
      setShiftStatus(res.data.status);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchShiftStatus();
  }, []);

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
          
          // Auto add to cart if product found
          const product = products.find(p => p.barcode === scannedCode);
          if (product) {
            addToCart(product);
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [scannerEnabled, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      
      const currentQuantity = existing ? existing.quantity : 0;
      // Eliminamos la restricción estricta de stock para permitir ventas en negativo
      // if (currentQuantity + 1 > product.stock) {
      //   alert(`No hay suficiente stock de ${product.description}`);
      //   return prev;
      // }

      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        // if (newQuantity > item.product.stock) {
        //   alert(`No hay suficiente stock`);
        //   return item;
        // }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);

  const processSale = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice
      }));

      const payload: any = { items };
      if (selectedCustomerId) {
        payload.customerId = selectedCustomerId;
        payload.isCredit = true; // Auto-assign as credit if a customer is selected
      }

      const response = await api.post('/sales', payload);
      
      if (selectedCustomerId) {
        // Venta a crédito: No generar ticket
        setCart([]);
        setSelectedCustomerId('');
        fetchProducts();
        setIsProcessing(false);
        setToastMessage('Deuda asignada al cliente exitosamente.');
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      setTicketData({
        items: [...cart],
        total: subtotal,
        date: new Date(),
        id: response.data.id,
        isCredit: !!selectedCustomerId,
        customerName: customer?.name
      });
      
      setShowTicket(true);
      setCart([]);
      setSelectedCustomerId('');
      fetchProducts();
    } catch (error: any) {
      console.error('Error procesando venta:', error);
      alert(error.response?.data?.message || 'Hubo un error al procesar la venta');
    } finally {
      setIsProcessing(false);
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
              <title>Ticket de Venta</title>
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
  
  const filteredProducts = products.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  if (shiftStatus === 'CLOSED') {
    return (
      <div className="flex h-full bg-slate-950 items-center justify-center p-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Caja Cerrada</h2>
          <p className="text-slate-400 mb-6">
            No puedes realizar ventas en este momento. Debes iniciar tu turno y declarar un fondo inicial desde el Dashboard.
          </p>
          <a href="/dashboard" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-block">
            Ir al Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-950 font-sans relative">
      
      {/* Lado Izquierdo: Catálogo y Búsqueda */}
      <div className="flex-1 flex flex-col p-6 h-full overflow-hidden">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar producto por nombre o código de barras..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="group flex flex-col items-start p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-full flex justify-between items-start mb-2 gap-2 overflow-hidden">
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded truncate min-w-0 flex-1" title={product.barcode}>{product.barcode}</span>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${product.stock > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2 line-clamp-2 w-full break-words">{product.description}</h3>
                <div className="mt-auto w-full flex justify-between items-end gap-2 overflow-hidden">
                  <p className="text-xl font-bold text-emerald-400 shrink-0">${product.sellingPrice}</p>
                  <span className="text-xs text-slate-500 text-right line-clamp-2 leading-tight" title={product.category?.name}>{product.category?.name}</span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No se encontraron productos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lado Derecho: Carrito (Ticket) */}
      <div className="w-[400px] border-l border-white/10 bg-slate-900/50 flex flex-col h-full shadow-2xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            Venta Actual
          </h2>
          <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex justify-between items-start mb-3 gap-2 overflow-hidden">
                  <h4 className="font-medium text-sm leading-tight pr-2 line-clamp-2 break-words flex-1">{item.product.description}</h4>
                  <p className="font-bold text-emerald-400 shrink-0">${(item.product.sellingPrice * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">${item.product.sellingPrice} c/u</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-slate-900 mt-auto">
          {/* Cliente y Crédito */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300 font-medium">Asignar a cliente (Fiado)</label>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                e.target.blur();
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Cobro en Efectivo (Sin Cliente) --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-medium">Total a Cobrar</span>
            <span className="text-3xl font-bold text-white">${subtotal.toFixed(2)}</span>
          </div>
          <button 
            onClick={(e) => {
              e.currentTarget.blur();
              processSale();
            }}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
              selectedCustomerId 
                ? 'bg-amber-500 hover:bg-amber-400 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            {isProcessing ? 'Procesando...' : (selectedCustomerId ? 'Asignar Deuda (Fiado)' : 'Cobrar Venta')}
          </button>
        </div>
      </div>

      {/* Modal de Ticket */}
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
                  <p>Ticket de Compra</p>
                  {ticketData.isCredit && (
                    <p className="font-bold border-y border-dashed border-black my-1 py-1">*** VENTA A CRÉDITO ***</p>
                  )}
                  {ticketData.customerName && (
                    <p>Cliente: {ticketData.customerName}</p>
                  )}
                  <p>{ticketData.date.toLocaleString()}</p>
                  <p className="text-[10px] mt-1 text-gray-500">Folio: {ticketData.id.split('-')[0]}</p>
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
                    {ticketData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="pt-2 align-top">{item.quantity}</td>
                        <td className="pt-2 align-top break-words pr-2">{item.product.description}</td>
                        <td className="pt-2 align-top text-right">${(item.quantity * item.product.sellingPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="border-t border-dashed border-gray-400 pt-2 text-right">
                  <p className="font-bold text-sm">TOTAL: ${ticketData.total.toFixed(2)}</p>
                </div>
                
                <div className="text-center mt-6 text-gray-500 text-[10px]">
                  <p>¡Gracias por su compra!</p>
                  <p>Vuelva pronto</p>
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
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
