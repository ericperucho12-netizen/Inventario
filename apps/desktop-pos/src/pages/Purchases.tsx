import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/axios';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, 
  Barcode, Loader2, DollarSign, Building2, TrendingUp
} from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';

interface Product {
  id: string;
  barcode: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  category?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitCost: number;
  newSellingPrice?: number;
}

export default function Purchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { scannerEnabled, defaultPrinter } = useSettingsStore();
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());
  
  // Imprimir Ticket de Entrada
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = () => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
  };

  const fetchSuppliers = () => {
    api.get('/suppliers').then(res => setSuppliers(res.data)).catch(console.error);
  };

  useEffect(() => {
    if (!scannerEnabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const now = Date.now();
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          const scannedCode = barcodeBuffer.current;
          barcodeBuffer.current = '';
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
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        product, 
        quantity: 1, 
        unitCost: product.costPrice || 0,
        newSellingPrice: product.sellingPrice || 0
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const updateCost = (productId: string, cost: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, unitCost: Math.max(0, cost) } : item
    ));
  };

  const updateSellingPrice = (productId: string, price: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, newSellingPrice: Math.max(0, price) } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);

  const processPurchase = async () => {
    if (cart.length === 0 || !selectedSupplierId) return;
    
    setIsProcessing(true);
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitCost: item.unitCost,
        newSellingPrice: item.newSellingPrice
      }));

      const payload = { 
        supplierId: selectedSupplierId,
        items 
      };

      const response = await api.post('/purchases', payload);
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      
      setTicketData({
        items: [...cart],
        total: subtotal,
        date: new Date(),
        id: response.data.id,
        supplierName: supplier?.name
      });
      
      setShowTicket(true);
      setCart([]);
      setSelectedSupplierId('');
      fetchProducts(); // Refrescar inventario
      setToastMessage('Inventario actualizado exitosamente');
      setTimeout(() => setToastMessage(null), 3000);

    } catch (error: any) {
      console.error('Error procesando compra:', error);
      alert(error.response?.data?.message || 'Hubo un error al procesar la compra');
    } finally {
      setIsProcessing(false);
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
              <title>Ticket Recepción</title>
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
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    setShowTicket(false);
  };

  const filteredProducts = products.filter(p => 
    p.description.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search)
  );

  return (
    <div className="flex h-full bg-slate-950 text-white relative">
      {/* Lado Izquierdo: Buscador y Catálogo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              Ingresar Compra (Proveedor)
            </h1>
            <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg font-medium border border-blue-500/20">
              <Barcode className="h-5 w-5" />
              {scannerEnabled ? 'Escáner Activo' : 'Escáner Desactivado'}
            </div>
          </div>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-950">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-slate-900 border border-white/5 rounded-xl p-4 text-left hover:bg-slate-800 hover:border-blue-500/50 transition-all flex flex-col h-32 group"
              >
                <h3 className="font-semibold text-white mb-2 line-clamp-2 w-full break-words">{product.description}</h3>
                <div className="mt-auto w-full flex justify-between items-end gap-2">
                  <p className="text-xl font-bold text-blue-400 shrink-0">Stock: {product.stock}</p>
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

      {/* Lado Derecho: Carrito de Compra */}
      <div className="w-[450px] border-l border-white/10 bg-slate-900/50 flex flex-col h-full shadow-2xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            Mercancía Recibida
          </h2>
          <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>El carrito de compra está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex justify-between items-start mb-3 gap-2 overflow-hidden">
                  <h4 className="font-medium text-sm leading-tight pr-2 line-clamp-2 break-words flex-1">{item.product.description}</h4>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  {/* Costo de Compra */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Costo unitario ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => updateCost(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {/* Cantidad */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Cantidad que llegó</label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-semibold text-sm w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Precio de Venta (Opcional Actualizar) */}
                <div className="border-t border-white/10 pt-3">
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" /> 
                    Actualizar Precio de Venta (Opcional)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={item.newSellingPrice}
                    onChange={(e) => updateSellingPrice(item.product.id, parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-slate-900 mt-auto">
          {/* Proveedor */}
          <div className="mb-4 space-y-3">
            <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Proveedor
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => {
                setSelectedSupplierId(e.target.value);
                e.target.blur();
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Selecciona un proveedor --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-medium">Total de la Factura</span>
            <span className="text-3xl font-bold text-white">${subtotal.toFixed(2)}</span>
          </div>
          <button 
            onClick={(e) => {
              e.currentTarget.blur();
              processPurchase();
            }}
            disabled={cart.length === 0 || !selectedSupplierId || isProcessing}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] bg-blue-500 hover:bg-blue-400 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
            {isProcessing ? 'Procesando...' : 'Registrar Compra y Stock'}
          </button>
        </div>
      </div>

      {/* Modal de Ticket de Compra */}
      {showTicket && ticketData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Inventario Actualizado!</h2>
            <p className="text-slate-400 mb-6">La mercancía se sumó a tus existencias.</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowTicket(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={printTicket}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/25"
              >
                Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Ticket for Printing */}
      <div className="hidden">
        {ticketData && (
          <div className="bg-white text-black p-6 w-[300px] text-xs font-mono" ref={ticketRef}>
            <div className="text-center mb-4">
              <h1 className="font-bold text-base mb-1">Abarrotes PeruchOS</h1>
              <p>*** ENTRADA DE ALMACÉN ***</p>
            </div>
            
            <div className="border-y border-dashed border-black my-4 py-2">
              <p>Fecha: {ticketData.date.toLocaleString()}</p>
              <p>Folio Ref: {ticketData.id.substring(0, 8)}</p>
              <p>Proveedor: {ticketData.supplierName}</p>
            </div>

            <ul className="mb-4">
              {ticketData.items.map((item: any) => (
                <li key={item.product.id}>
                  <span>{item.quantity}x {item.product.description}</span>
                  <span>${(item.unitCost * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-dashed border-black pt-2 text-right">
              <p className="text-sm font-bold">TOTAL COMPRA: ${ticketData.total.toFixed(2)}</p>
            </div>
            
            <div className="text-center mt-6 text-xs text-gray-500">
              Inventario actualizado automáticamente
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
