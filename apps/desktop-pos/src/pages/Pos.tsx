import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/axios';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Search, Loader2, Printer, X, CheckCircle2, User, FileText, PackageOpen, Filter, Users, Barcode, Scale } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { useOfflineStore } from '../store/offline.store';
import { Link, useNavigate } from 'react-router-dom';
import { fetchProductInfo } from '../lib/globalProductsApi';
import { CameraScanner } from '../components/CameraScanner';

export interface Product {
  id: string;
  barcode: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  category: { id: string; name: string };
  imageUrl?: string;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'VOUCHER' | 'CREDIT'>('CASH');
  const [shiftStatus, setShiftStatus] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFastAdd, setShowFastAdd] = useState(false);
  const [fastAddData, setFastAddData] = useState<any>(null);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [scannedNotFoundCode, setScannedNotFoundCode] = useState<string | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  
  const navigate = useNavigate();

  const ticketRef = useRef<HTMLDivElement>(null);
  
  // Custom Settings
  const { defaultPrinter, scannerEnabled, scaleEnabled, storeName, storeAddress, storePhone, taxRate } = useSettingsStore();
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());
  const { cachedProducts, setCachedProducts, cachedCustomers, setCachedCustomers, addPendingSale } = useOfflineStore();

  const fetchProducts = async () => {
    if (!navigator.onLine && cachedProducts.length > 0) {
      setProducts(cachedProducts);
      return;
    }
    try {
      const res = await api.get('/products');
      setProducts(res.data);
      setCachedProducts(res.data);
    } catch (e) {
      if (cachedProducts.length > 0) setProducts(cachedProducts);
    }
  };

  const fetchCategories = async () => {
    if (!navigator.onLine) return;
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (e) {}
  };

  const fetchCustomers = async () => {
    if (!navigator.onLine && cachedCustomers.length > 0) {
      setCustomers(cachedCustomers);
      return;
    }
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
      setCachedCustomers(res.data);
    } catch (e) {
      if (cachedCustomers.length > 0) setCustomers(cachedCustomers);
    }
  };

  const fetchShiftStatus = async () => {
    if (!navigator.onLine) {
      setShiftStatus('OPEN'); // Assume open if offline to allow sales
      return;
    }
    try {
      const res = await api.get('/cash-shifts/metrics');
      setShiftStatus(res.data.status);
    } catch (e) {
      console.error(e);
      setShiftStatus('OPEN');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
    fetchShiftStatus();
  }, []);

  const handleBarcodeScan = async (scannedCode: string) => {
    const product = products.find(p => p.barcode === scannedCode);
    if (product) {
      addToCart(product);
      setSearchTerm(''); // Clear search if used
    } else {
      setScannedNotFoundCode(scannedCode);
    }
  };

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
          handleBarcodeScan(scannedCode);
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
        // Permitir decimales en caso de productos pesados
        const newQuantity = Math.max(0.001, item.quantity + delta);
        return { ...item, quantity: Number(newQuantity.toFixed(3)) };
      }
      return item;
    }));
  };

  const setExactQuantity = (productId: string, exactQty: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(0.001, exactQty) };
      }
      return item;
    }));
  };

  const handleReadScale = async (productId: string) => {
    // Si tuviéramos Web Bluetooth, aquí iría la lógica.
    // Por ahora, le pedimos al usuario el peso exacto.
    const weight = window.prompt("Ingresa el peso exacto leído por la báscula (ej. 1.250):", "1.000");
    if (weight !== null) {
      const numWeight = parseFloat(weight);
      if (!isNaN(numWeight) && numWeight > 0) {
        setExactQuantity(productId, numWeight);
      } else {
        alert("Peso inválido.");
      }
    }
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

      const payload: any = { 
        items,
        paymentMethod: paymentMethod === 'CREDIT' ? 'CASH' : paymentMethod 
      };

      if (paymentMethod === 'CREDIT') {
        if (!selectedCustomerId) {
          alert('Debes seleccionar un cliente para fiar la venta.');
          setIsProcessing(false);
          return;
        }
        payload.customerId = selectedCustomerId;
        payload.isCredit = true;
      } else if (selectedCustomerId) {
        payload.customerId = selectedCustomerId;
        payload.isCredit = false;
      }

      let responseId = '';
      if (!navigator.onLine) {
        responseId = 'OFFLINE-' + Date.now();
        addPendingSale({
          id: responseId,
          items: payload.items,
          paymentMethod: payload.paymentMethod,
          customerId: payload.customerId,
          isCredit: payload.isCredit,
          total: subtotal,
          date: new Date().toISOString(),
        });
      } else {
        const response = await api.post('/sales', payload);
        responseId = response.data.id;
      }
      
      if (paymentMethod === 'CREDIT') {
        // Venta a crédito: No generar ticket
        setCart([]);
        setSelectedCustomerId('');
        setPaymentMethod('CASH');
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
        id: responseId,
        isCredit: false,
        customerName: customer?.name
      });
      
      setShowTicket(true);
      setCart([]);
      setSelectedCustomerId('');
      setPaymentMethod('CASH');
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
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.includes(searchTerm);
    const matchesCategory = filterCategoryId ? p.category?.id === filterCategoryId : true;
    return matchesSearch && matchesCategory;
  });

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
          <Link to="/dashboard" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-block">
            Ir al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row flex-1 min-h-screen xl:min-h-0 xl:h-full bg-slate-950 font-sans relative">
      
      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <CameraScanner 
          onScan={(decodedText) => {
            setShowCameraScanner(false);
            handleBarcodeScan(decodedText);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* Lado Izquierdo: Catálogo y Búsqueda */}
      <div className="flex-1 flex flex-col p-4 md:p-6 xl:h-full xl:overflow-hidden">
        <div className="mb-4 lg:mb-6 flex flex-col md:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o código de barras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim().length > 0) {
                  handleBarcodeScan(searchTerm.trim());
                }
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
            <button 
              onClick={() => setShowCameraScanner(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"
              title="Escanear con Cámara"
            >
              <Barcode className="h-4 w-4" />
            </button>
          </div>
          
          
          <div className="flex gap-3 lg:gap-4 shrink-0">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            >
              <option value="">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

            <Link 
              to="/customers"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 px-4 py-3 font-medium hover:bg-blue-500 hover:text-white transition-colors shrink-0"
              title="Ir a Clientes"
            >
              <Users className="h-5 w-5" />
              <span className="hidden md:inline">Clientes</span>
            </Link>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto max-h-[55vh] xl:max-h-none pr-2 custom-scrollbar pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
                
                {product.imageUrl && (
                  <div className="w-full flex justify-center mb-3">
                    <img src={product.imageUrl} alt={product.description} className="h-20 object-contain rounded bg-white/5 p-1" />
                  </div>
                )}
                
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
      <div className="w-full xl:w-[400px] xl:h-full border-t xl:border-t-0 xl:border-l border-white/10 bg-slate-900/50 flex flex-col shadow-2xl z-10 shrink-0">
        <div className="p-3 lg:p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            Venta Actual
          </h2>
          <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[40vh] xl:max-h-none p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group flex gap-3">
                {item.product.imageUrl && (
                  <div className="shrink-0 w-12 h-12 rounded bg-white/5 p-1 flex items-center justify-center">
                    <img src={item.product.imageUrl} alt={item.product.description} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-2 overflow-hidden">
                    <h4 className="font-medium text-sm leading-tight pr-2 line-clamp-2 break-words flex-1">{item.product.description}</h4>
                    <p className="font-bold text-emerald-400 shrink-0">${(item.product.sellingPrice * item.quantity).toFixed(2)}</p>
                  </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">${item.product.sellingPrice} c/u</p>
                  <div className="flex items-center gap-3">
                    {scaleEnabled && (
                      <button 
                        onClick={() => handleReadScale(item.product.id)} 
                        className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors text-green-400 mr-2"
                        title="Leer peso desde báscula"
                      >
                        <Scale className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input 
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setExactQuantity(item.product.id, val);
                        }
                      }}
                      className="w-16 bg-slate-950 border border-slate-700 rounded text-center text-sm font-semibold text-white py-1 focus:outline-none focus:border-emerald-500 appearance-none m-0"
                    />
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 lg:p-6 border-t border-white/10 bg-slate-900 mt-auto shrink-0">
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">Método de Pago</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-medium text-sm transition-colors ${paymentMethod === 'CASH' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-medium text-sm transition-colors ${paymentMethod === 'CARD' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  Tarjeta
                </button>
                <button
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-medium text-sm transition-colors ${paymentMethod === 'TRANSFER' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  Transferencia
                </button>
                <button
                  onClick={() => setPaymentMethod('VOUCHER')}
                  className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-medium text-sm transition-colors ${paymentMethod === 'VOUCHER' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  Vales
                </button>
                <button
                  onClick={() => setPaymentMethod('CREDIT')}
                  className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-colors ${paymentMethod === 'CREDIT' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  Fiado
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium mb-1 block">
                {paymentMethod === 'CREDIT' ? 'Cliente a Fiar (Obligatorio)' : 'Asignar a Cliente (Opcional)'}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  e.target.blur();
                }}
                className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-sm text-white focus:outline-none transition-colors ${paymentMethod === 'CREDIT' && !selectedCustomerId ? 'border-amber-500 focus:border-amber-500' : 'border-slate-700 focus:border-emerald-500'}`}
              >
                <option value="">-- Sin Cliente --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
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
            disabled={cart.length === 0 || isProcessing || (paymentMethod === 'CREDIT' && !selectedCustomerId)}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
              paymentMethod === 'CREDIT' 
                ? 'bg-amber-500 hover:bg-amber-400 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                : paymentMethod === 'CARD'
                ? 'bg-indigo-500 hover:bg-indigo-400 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            {isProcessing ? 'Procesando...' : (paymentMethod === 'CREDIT' ? 'Generar Deuda (Fiado)' : paymentMethod === 'CARD' ? 'Cobrar con Tarjeta' : paymentMethod === 'TRANSFER' ? 'Cobrar Transferencia' : paymentMethod === 'VOUCHER' ? 'Cobrar con Vales' : 'Cobrar en Efectivo')}
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
                  <h1 className="font-bold text-base mb-1">{storeName || 'PeruchOS System'}</h1>
                  {storeAddress && <p>{storeAddress}</p>}
                  {storePhone && <p>Tel: {storePhone}</p>}
                  <p className="mt-1 border-t border-dashed border-gray-400 pt-1">Ticket de Venta</p>
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
                  {taxRate > 0 && (
                    <p className="text-[10px] mt-1 text-gray-500">
                      Incluye IVA ({taxRate}%): ${(ticketData.total - (ticketData.total / (1 + (taxRate / 100)))).toFixed(2)}
                    </p>
                  )}
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

      {/* Global Fetch Loading Overlay */}
      {isFetchingGlobal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-white font-medium">Buscando producto en base de datos global...</p>
        </div>
      )}

      {/* Modal Redirección a Compras */}
      {scannedNotFoundCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl relative text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-6">
              <PackageOpen className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Producto Nuevo</h2>
            <p className="text-slate-400 mb-6">
              El código <strong className="text-white">{scannedNotFoundCode}</strong> no existe en tu inventario.
              <br /><br />
              ¿Deseas ir a la sección de <strong className="text-emerald-400">Compras</strong> para agregarlo e ingresar la cantidad correcta al stock?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setScannedNotFoundCode(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => navigate('/purchases', { state: { scannedCode: scannedNotFoundCode } })}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25 flex justify-center items-center gap-2"
              >
                Ir a Compras
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
