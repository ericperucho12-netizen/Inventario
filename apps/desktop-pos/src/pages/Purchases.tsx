import React, { useState, useEffect, useRef } from 'react';
import { api, getApiUrl } from '../lib/axios';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, 
  Barcode, Loader2, DollarSign, Building2, TrendingUp, Filter, Printer, ClipboardList, CheckCircle, Edit
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../store/settings.store';
import { useOfflineStore } from '../store/offline.store';
import { fetchProductInfo } from '../lib/globalProductsApi';
import { FastAddModal } from '../components/FastAddModal';
import { CameraScanner } from '../components/CameraScanner';

interface Product {
  id: string;
  barcode: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  category?: { id: string; name: string };
  isBulk?: boolean;
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
  const [activeTab, setActiveTab] = useState<'NEW' | 'LISTS'>('NEW');
  const [pendingLists, setPendingLists] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  const { scannerEnabled, defaultPrinter } = useSettingsStore();
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());
  const location = useLocation();
  const { cachedProducts, setCachedProducts, addPendingPurchase } = useOfflineStore();
  
  // Imprimir Ticket de Entrada
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  
  // Fast Add States
  const [showFastAdd, setShowFastAdd] = useState(false);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);
  const [fastAddData, setFastAddData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  
  // Camera Scanner state
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchCategories();
    fetchPendingLists();

    // Sockets para Tiempo Real
    const user = useAuthStore.getState().user;
    const socket = io(getApiUrl(), {
      query: { companyId: (user as any)?.companyId }
    });

    socket.on('inventory-updated', () => {
      // Cuando otro dispositivo cambia algo
      api.get('/products').then(res => {
        setProducts(res.data);
        setCachedProducts(res.data);
      });
      fetchPendingLists();
      
      setToastMessage('📦 Datos actualizados (Tiempo Real)');
      setTimeout(() => setToastMessage(null), 2500);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchPendingLists = async () => {
    try {
      const res = await api.get('/purchases');
      const pending = res.data.filter((p: any) => p.status === 'PENDING');
      setPendingLists(pending);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceiveList = (list: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Recepción',
      message: '¿Confirmas que ya recibiste esta carga? El stock se sumará al inventario y se generará el comprobante.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsProcessing(true);
          const response = await api.patch(`/purchases/${list.id}/receive`);
          
          setTicketData({
            items: list.details.map((d: any) => ({
               product: d.product,
               quantity: Number(d.quantity) || 0,
               unitCost: Number(d.unitCost) || 0
            })),
            total: Number(list.total) || 0,
            date: new Date(),
            id: response.data.id || list.id,
            supplierName: list.supplier?.name
          });
          setShowTicket(true);
          
          setToastMessage('Inventario actualizado exitosamente');
          setTimeout(() => setToastMessage(null), 3000);
          fetchPendingLists();
          fetchProducts();
        } catch (error: any) {
          alert(error.response?.data?.message || 'Error al recibir carga');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleEditList = async (list: any) => {
    try {
      setCart(list.details.map((d: any) => ({
        product: d.product,
        quantity: d.quantity,
        unitCost: d.unitCost,
        newSellingPrice: d.product.sellingPrice
      })));
      if (list.supplierId) {
         setSelectedSupplierId(list.supplierId);
      }
      await api.delete(`/purchases/${list.id}`);
      setActiveTab('NEW');
      fetchPendingLists();
    } catch (error) {
      console.error(error);
      alert('Error al editar lista');
    }
  };

  const handleDeleteList = (listId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Lista',
      message: '¿Seguro que deseas eliminar esta lista pendiente? No se sumará al stock.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setIsProcessing(true);
          await api.delete(`/purchases/${listId}`);
          fetchPendingLists();
          setToastMessage('Lista eliminada');
          setTimeout(() => setToastMessage(null), 3000);
        } catch (error) {
          alert('Error al eliminar lista');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  useEffect(() => {
    if (products.length > 0 && location.state?.scannedCode) {
      handleBarcodeScan(location.state.scannedCode);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, products]);

  const fetchProducts = () => {
    if (!navigator.onLine && cachedProducts.length > 0) {
      setProducts(cachedProducts);
      return;
    }
    api.get('/products').then(res => {
      setProducts(res.data);
      setCachedProducts(res.data);
    }).catch(e => {
      if (cachedProducts.length > 0) setProducts(cachedProducts);
    });
  };

  const fetchSuppliers = () => {
    api.get('/suppliers').then(res => setSuppliers(res.data)).catch(console.error);
  };

  const fetchCategories = () => {
    api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
  };

  const handleBarcodeScan = async (scannedCode: string) => {
    const product = products.find(p => p.barcode === scannedCode);
    if (product) {
      addToCart(product);
      setSearch('');
    } else {
      setIsFetchingGlobal(true);
      try {
        const info = await fetchProductInfo(scannedCode);
        setFastAddData({
          barcode: scannedCode,
          description: info?.description || '',
          sellingPrice: '',
          costPrice: '',
          stock: '1',
          categoryId: '',
          imageUrl: info?.imageUrl || null
        });
        setShowFastAdd(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsFetchingGlobal(false);
      }
    }
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
        const newQuantity = Math.max(0.001, item.quantity + delta);
        return { ...item, quantity: Number(newQuantity.toFixed(3)) };
      }
      return item;
    }));
  };

  const setAbsoluteQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(0, quantity) };
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

  const subtotal = cart.reduce((acc, item) => acc + (item.unitCost * (item.quantity || 1)), 0);

  const handleFastAddSuccess = async (newProduct: Product, initialStock: number, supplierId?: string) => {
    setProducts(prev => [...prev, newProduct]);
    setShowFastAdd(false);
    setFastAddData(null);
    setSearch('');
    
    if (initialStock > 0) {
      setCart(prev => {
        const existing = prev.find(item => item.product.id === newProduct.id);
        if (existing) {
          return prev.map(item => item.product.id === newProduct.id ? { ...item, quantity: item.quantity + initialStock } : item);
        }
        return [...prev, {
          product: newProduct,
          quantity: initialStock,
          unitCost: newProduct.costPrice || 0,
          newSellingPrice: newProduct.sellingPrice || 0
        }];
      });
      if (supplierId) setSelectedSupplierId(supplierId);
      setToastMessage('Producto agregado a la lista de compra actual');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage('Producto dado de alta sin stock');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const processPurchase = async (status: 'PENDING' | 'COMPLETED' = 'COMPLETED') => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity || 1,
        unitCost: item.unitCost,
        newSellingPrice: item.newSellingPrice
      }));

      const payload = { 
        supplierId: selectedSupplierId || undefined,
        items,
        status
      };

      let responseId = '';
      if (!navigator.onLine) {
        responseId = 'OFFLINE-PURCHASE-' + Date.now();
        addPendingPurchase({
          id: responseId,
          supplierId: payload.supplierId,
          items: payload.items,
          total: subtotal,
          date: new Date().toISOString(),
          status: payload.status
        });
      } else {
        const response = await api.post('/purchases', payload);
        responseId = response.data.id;
      }

      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      
      if (status === 'COMPLETED') {
        setTicketData({
          items: [...cart],
          total: subtotal,
          date: new Date(),
          id: responseId,
          supplierName: supplier?.name
        });
        setShowTicket(true);
        setToastMessage('Inventario actualizado exitosamente');
      } else {
        setToastMessage('Lista de compras guardada exitosamente');
        fetchPendingLists();
      }
      
      setCart([]);
      setSelectedSupplierId('');
      fetchProducts(); // Refrescar inventario
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(search.toLowerCase()) || 
                          p.barcode.includes(search);
    const matchesCategory = filterCategoryId ? p.category?.id === filterCategoryId : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white relative">
      {/* Global Fetch Loading Overlay */}
      {isFetchingGlobal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-white font-medium">Buscando producto en base de datos global...</p>
        </div>
      )}

      {/* Fast Add Modal */}
      {showFastAdd && fastAddData && (
        <FastAddModal 
          fastAddData={fastAddData}
          setFastAddData={setFastAddData}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setShowFastAdd(false)}
          onSuccess={handleFastAddSuccess}
        />
      )}

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

      {/* Header Común (Pestañas) */}
      <div className="w-full bg-slate-900/50 border-b border-white/10 p-4 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          Compras e Inventario
        </h1>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setActiveTab('NEW')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'NEW' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white'}`}
          >
            Nueva Compra
          </button>
          <button 
            onClick={() => setActiveTab('LISTS')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'LISTS' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white'}`}
          >
            Listas Pendientes
            {pendingLists.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingLists.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden custom-scrollbar relative">
      {activeTab === 'NEW' ? (
      <>
      {/* Lado Izquierdo: Buscador y Catálogo */}
      <div className="flex flex-col xl:flex-1 xl:h-full xl:overflow-hidden shrink-0">
        <div className="p-4 md:p-6 border-b border-white/10 shrink-0">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto por código o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim().length > 0) {
                    handleBarcodeScan(search.trim());
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
              />
              <button 
                onClick={() => setShowCameraScanner(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                title="Escanear con Cámara"
              >
                <Barcode className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-3 md:gap-4">
              <div className="relative flex-1 md:w-48 shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="">Todas las Categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <Link 
                to="/suppliers"
                className="flex items-center gap-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-3 font-medium hover:bg-indigo-500 hover:text-white transition-colors shrink-0"
                title="Ir a Proveedores"
              >
                <Building2 className="h-5 w-5" />
                <span className="hidden md:inline">Proveedores</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[50vh] xl:max-h-none custom-scrollbar bg-slate-950">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
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
      <div className="w-full xl:w-[450px] border-t xl:border-t-0 xl:border-l border-white/10 bg-slate-900/50 flex flex-col xl:h-full shadow-2xl z-10 shrink-0">
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            Mercancía Recibida
          </h2>
          <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[40vh] xl:max-h-none p-4 space-y-3 custom-scrollbar">
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
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3">
                  {/* Costo de Compra */}
                  <div>
                    <label className="text-[10px] sm:text-xs text-slate-400 mb-1 block whitespace-nowrap overflow-hidden text-ellipsis">Costo unitario ($)</label>
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
                    <label className="text-[10px] sm:text-xs text-slate-400 mb-1 block whitespace-nowrap overflow-hidden text-ellipsis">Cant. que llegó</label>
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0">
                        <Minus className="h-3 w-3" />
                      </button>
                      <input 
                        type="number"
                        step={item.product.isBulk ? "0.001" : "1"}
                        min={item.product.isBulk ? "0.001" : "1"}
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAbsoluteQuantity(item.product.id, val === '' ? 0 : parseFloat(val));
                        }}
                        onBlur={() => {
                          if (!item.quantity) setAbsoluteQuantity(item.product.id, item.product.isBulk ? 0.001 : 1);
                        }}
                        className="w-full bg-transparent font-semibold text-sm text-center text-white focus:outline-none"
                      />
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Precio de Venta y Margen */}
                <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="text-[10px] sm:text-xs text-slate-400 mb-1 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      <TrendingUp className="h-3 w-3 text-indigo-400" /> 
                      Margen (%)
                    </label>
                    <input 
                      type="number" 
                      step="5"
                      placeholder="Ej. 30"
                      value={(item.unitCost > 0 && item.newSellingPrice > 0) ? (((item.newSellingPrice - item.unitCost) / item.unitCost) * 100).toFixed(0) : ''}
                      onChange={(e) => {
                        const margin = parseFloat(e.target.value);
                        if (!isNaN(margin) && item.unitCost > 0 && e.target.value !== '') {
                           updateSellingPrice(item.product.id, parseFloat((item.unitCost * (1 + margin / 100)).toFixed(2)));
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs text-slate-400 mb-1 block whitespace-nowrap overflow-hidden text-ellipsis">Precio Venta ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={item.newSellingPrice}
                      onChange={(e) => updateSellingPrice(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
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
              <option value="">-- Compra Independiente (Sin Proveedor) --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 font-medium">Total de la Factura</span>
            <span className="text-3xl font-bold text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => {
                e.currentTarget.blur();
                processPurchase('PENDING');
              }}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ClipboardList className="h-5 w-5" />}
              {isProcessing ? 'Procesando...' : 'Guardar Lista Pendiente'}
            </button>
            <button 
              onClick={(e) => {
                e.currentTarget.blur();
                processPurchase('COMPLETED');
              }}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] bg-blue-500 hover:bg-blue-400 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
              {isProcessing ? 'Procesando...' : 'Registrar Compra Inmediata'}
            </button>
          </div>
        </div>
      </div>
      </>
      ) : (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
          {pendingLists.length === 0 ? (
            <div className="text-center text-slate-500 mt-20">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No hay listas de compras pendientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingLists.map(list => (
                <div key={list.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs text-slate-400 block">{new Date(list.createdAt).toLocaleString()}</span>
                      <h3 className="font-bold text-lg text-white truncate max-w-[200px]">{list.supplier?.name || 'Compra Independiente'}</h3>
                    </div>
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-medium">Pendiente</span>
                  </div>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar flex-1">
                    {list.details.map((detail: any) => (
                      <div key={detail.id} className="flex justify-between text-sm items-center border-b border-slate-800/50 pb-2 last:border-0">
                        <span className="text-slate-300 max-w-[150px] truncate">{detail.quantity}x {detail.product?.description}</span>
                        <span className="text-slate-400">${(detail.quantity * detail.unitCost).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">${Number(list.total).toFixed(2)}</span>
                      <button
                        onClick={() => handleReceiveList(list)}
                        disabled={isProcessing}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Recibir Carga"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Recibir
                      </button>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleEditList(list)}
                        disabled={isProcessing}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 border border-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        disabled={isProcessing}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 border border-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modal de Ticket de Compra */}
      {showTicket && ticketData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <h2 className="text-xl font-bold text-white mb-4">Vista Previa de Compra</h2>
            
            {/* Contenedor del Ticket */}
            <div className="flex-1 overflow-y-auto bg-white text-black p-6 rounded-lg text-xs font-mono text-left mb-6 mx-auto w-full max-w-[300px] custom-scrollbar shadow-inner" ref={ticketRef}>
              <div className="text-center mb-4">
                <h1 className="font-bold text-base mb-1">PeruchOS System</h1>
                <p>*** ENTRADA DE ALMACÉN ***</p>
              </div>
              
              <div className="border-y border-dashed border-black my-4 py-2">
                <p>Fecha: {ticketData.date.toLocaleString()}</p>
                <p>Folio Ref: {String(ticketData.id).substring(0, 8)}</p>
                <p>Proveedor: {ticketData.supplierName || 'Compra Independiente'}</p>
              </div>

              <ul className="mb-4 space-y-1">
                {ticketData.items.map((item: any) => (
                  <li key={item.product.id} className="flex justify-between items-start">
                    <span className="flex-1 pr-2">{item.quantity}x {item.product.description}</span>
                    <span className="font-medium whitespace-nowrap">${(item.unitCost * item.quantity).toFixed(2)}</span>
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
            
            <div className="flex gap-4 mt-auto">
              <button 
                onClick={() => setShowTicket(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={printTicket}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Printer className="h-5 w-5" /> Imprimir
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
              <h1 className="font-bold text-base mb-1">PeruchOS System</h1>
              <p>*** ENTRADA DE ALMACÉN ***</p>
            </div>
            
            <div className="border-y border-dashed border-black my-4 py-2">
              <p>Fecha: {ticketData.date.toLocaleString()}</p>
              <p>Folio Ref: {String(ticketData.id).substring(0, 8)}</p>
              <p>Proveedor: {ticketData.supplierName || 'Compra Independiente'}</p>
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

      {/* Confirm Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h2>
            <p className="text-slate-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
