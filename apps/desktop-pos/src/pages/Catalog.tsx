import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { PackageOpen, Tags, Plus, Loader2, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { COMMON_PRODUCTS } from '../lib/commonProducts';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  barcode: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  category: Category;
  imageUrl?: string;
  isBulk?: boolean;
  canUnpack?: boolean;
  wholesaleMinQuantity?: number;
  wholesalePrice?: number;
}

export default function Catalog() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Product Form
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('0');
  const [prodCatId, setProdCatId] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsBulk, setProdIsBulk] = useState(false);
  const [prodCanUnpack, setProdCanUnpack] = useState(false);
  const [prodHasWholesale, setProdHasWholesale] = useState(false);
  const [prodWholesaleMinQuantity, setProdWholesaleMinQuantity] = useState('');
  const [prodWholesalePrice, setProdWholesalePrice] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Adjust stock state
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Unpack state
  const [unpackSource, setUnpackSource] = useState<Product | null>(null);
  const [unpackTargetId, setUnpackTargetId] = useState('');
  const [unpackUnits, setUnpackUnits] = useState('');
  const [isUnpacking, setIsUnpacking] = useState(false);

  // Autofill logic for global catalog
  useEffect(() => {
    if (!editingProduct && prodBarcode && COMMON_PRODUCTS[prodBarcode]) {
      // Solo sobreescribir si está vacío o si coincide con otro producto común
      if (!prodDesc || Object.values(COMMON_PRODUCTS).includes(prodDesc)) {
        setProdDesc(COMMON_PRODUCTS[prodBarcode]);
      }
    }
  }, [prodBarcode, editingProduct]);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setEditingCategory(null);
    if (activeTab === 'products') {
      setProdBarcode('');
      setProdDesc('');
      setProdCost('');
      setProdPrice('');
      setProdStock('0');
      setProdCatId('');
      setProdImageUrl('');
      setProdIsBulk(false);
      setProdCanUnpack(false);
      setProdHasWholesale(false);
      setProdWholesaleMinQuantity('');
      setProdWholesalePrice('');
    } else {
      setCatName('');
      setCatDesc('');
    }
    setIsModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdBarcode(prod.barcode);
    setProdDesc(prod.description);
    setProdCost(prod.costPrice?.toString() || '0');
    setProdPrice(prod.sellingPrice?.toString() || '0');
    setProdStock(prod.stock?.toString() || '0');
    setProdCatId(prod.category?.id || '');
    setProdImageUrl(prod.imageUrl || '');
    setProdIsBulk(prod.isBulk || false);
    setProdCanUnpack(prod.canUnpack || false);
    setProdHasWholesale(!!prod.wholesaleMinQuantity);
    setProdWholesaleMinQuantity(prod.wholesaleMinQuantity ? String(prod.wholesaleMinQuantity) : '');
    setProdWholesalePrice(prod.wholesalePrice ? String(prod.wholesalePrice) : '');
    setIsModalOpen(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products')
      ]);
      setCategories(catsRes.data);
      setProducts(prodsRes.data);
    } catch (error) {
      console.error('Error fetching catalog data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/categories', { name: catName, description: catDesc });
      setIsModalOpen(false);
      setCatName('');
      setCatDesc('');
      fetchData();
    } catch (error) {
      alert('Error creando categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        barcode: prodBarcode,
        description: prodDesc,
        costPrice: Number(prodCost),
        sellingPrice: Number(prodPrice),
        stock: Number(prodStock),
        categoryId: prodCatId,
        imageUrl: prodImageUrl || null,
        isBulk: prodIsBulk,
        canUnpack: prodCanUnpack,
        wholesaleMinQuantity: prodHasWholesale ? Number(prodWholesaleMinQuantity) : null,
        wholesalePrice: prodHasWholesale ? Number(prodWholesalePrice) : null
      };
      
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Error guardando producto. Verifique los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    const delta = parseFloat(adjustDelta);
    if (isNaN(delta) || delta === 0) { alert('Ingresa un valor válido (positivo para agregar, negativo para quitar).'); return; }
    setIsAdjusting(true);
    try {
      await api.post(`/products/${adjustProduct.id}/adjust`, { delta, reason: adjustReason || 'Sin motivo' });
      setAdjustProduct(null);
      setAdjustDelta('');
      setAdjustReason('');
      fetchData();
    } catch (error) {
      alert('Error ajustando el inventario.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleUnpackProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unpackSource || !unpackTargetId) return;
    const units = parseFloat(unpackUnits);
    if (isNaN(units) || units <= 0) { alert('Ingresa cantidad válida'); return; }
    
    setIsUnpacking(true);
    try {
      await api.post(`/products/${unpackSource.id}/unpack`, { targetId: unpackTargetId, units });
      setUnpackSource(null);
      setUnpackTargetId('');
      setUnpackUnits('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al abrir caja.');
    } finally {
      setIsUnpacking(false);
    }
  };

  const handleDeleteProduct = async (id: string, description: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto: ${description}?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchData(); // Refresh the list
      } catch (error) {
        alert('Error al eliminar el producto.');
      }
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría: ${name}?`)) {
      try {
        await api.delete(`/categories/${id}`);
        fetchData(); // Refresh the list
      } catch (error) {
        alert('Error al eliminar la categoría. Asegúrate de que no tenga productos asociados.');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategoryId ? p.category?.id === filterCategoryId : true;
    return matchesSearch && matchesCategory;
  });

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Catálogo</h1>
          <p className="text-slate-400 mt-1">Gestiona los productos y familias</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 font-medium hover:bg-purple-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo {activeTab === 'products' ? 'Producto' : 'Categoría'}
        </button>
      </header>

      {/* Tabs y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 border-b border-white/10 pb-4 justify-between md:items-center">
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'products' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PackageOpen className="h-4 w-4" />
            Productos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'categories' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tags className="h-4 w-4" />
            Categorías
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {activeTab === 'products' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="w-full sm:w-48 rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-9 pr-4 text-sm text-slate-300 focus:border-purple-500 focus:outline-none appearance-none"
              >
                <option value="">Todas las Categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-9 pr-4 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-300">
              {activeTab === 'products' ? (
                <tr>
                  <th className="px-6 py-4 font-medium">Código</th>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                  <th className="px-6 py-4 font-medium">Categoría</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Costo</th>
                  <th className="px-6 py-4 font-medium">Precio</th>
                  <th className="px-6 py-4 font-medium">Valor Total</th>
                  <th className="px-6 py-4 font-medium">Ganancia Proy.</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === 'products' && filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono">{prod.barcode}</td>
                  <td className="px-6 py-4">{prod.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block whitespace-nowrap rounded bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400">
                      {prod.category?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${prod.stock <= 5 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                      {prod.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">${prod.costPrice}</td>
                  <td className="px-6 py-4 font-medium">${prod.sellingPrice}</td>
                  <td className="px-6 py-4 text-purple-400 font-medium">
                    ${(prod.sellingPrice * prod.stock).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-teal-400 font-medium">
                    ${((prod.sellingPrice - prod.costPrice) * prod.stock).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditProduct(prod)}
                      className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors mr-4"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => { setAdjustProduct(prod); setAdjustDelta(''); setAdjustReason(''); }}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors mr-4"
                      title="Ajustar Stock"
                    >
                      Ajustar
                    </button>
                    {prod.canUnpack && (
                      <button 
                        onClick={() => { setUnpackSource(prod); setUnpackTargetId(''); setUnpackUnits(''); }}
                        className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors mr-4"
                        title="Abrir Caja / Desarmar"
                      >
                        Abrir Caja
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteProduct(prod.id, prod.description)}
                      className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'categories' && filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-slate-400">{cat.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Reutilizable */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">
              {activeTab === 'products' ? (editingProduct ? 'Editar Producto' : 'Crear Producto') : (editingCategory ? 'Editar Categoría' : 'Crear Categoría')}
            </h2>
            
            <form onSubmit={activeTab === 'products' ? handleCreateProduct : handleCreateCategory} className="space-y-4">
              
              {activeTab === 'categories' ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Nombre</label>
                    <input required type="text" value={catName} onChange={e => setCatName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Descripción</label>
                    <input type="text" value={catDesc} onChange={e => setCatDesc(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Código de Barras</label>
                    <input required type="text" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Descripción</label>
                    <input required type="text" value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="mb-1 block text-sm font-medium text-slate-300">Costo</label>
                      <input required type="number" step="0.01" value={prodCost} onChange={e => setProdCost(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-sm font-medium text-slate-300">Precio Venta</label>
                      <input required type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Stock Actual {prodIsBulk ? '(Kg)' : '(Pzas)'}</label>
                    <input required type="number" step={prodIsBulk ? "0.001" : "1"} value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={prodIsBulk} onChange={e => setProdIsBulk(e.target.checked)} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900" />
                      ¿Se vende a granel/pesado? (Frutas, verduras, carnes)
                    </label>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Categoría</label>
                    <select required value={prodCatId} onChange={e => setProdCatId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none">
                      <option value="">Seleccione una categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mt-4 space-y-3">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={prodHasWholesale} onChange={e => setProdHasWholesale(e.target.checked)} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900" />
                      ¿Tiene precio de mayoreo?
                    </label>
                    {prodHasWholesale && (
                      <div className="flex gap-4 pt-2 border-t border-slate-700/50">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-400">A partir de (cantidad)</label>
                          <input required type="number" step={prodIsBulk ? "0.001" : "1"} value={prodWholesaleMinQuantity} onChange={e => setProdWholesaleMinQuantity(e.target.value)} placeholder="Ej. 3" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 focus:border-purple-500 focus:outline-none text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-400">Precio unitario mayoreo</label>
                          <input required type="number" step="0.01" value={prodWholesalePrice} onChange={e => setProdWholesalePrice(e.target.value)} placeholder="Ej. 15.00" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-emerald-400 focus:border-purple-500 focus:outline-none text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Enlace de Foto (URL opcional)</label>
                    <input type="url" placeholder="https://ejemplo.com/foto.jpg" value={prodImageUrl} onChange={e => setProdImageUrl(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-purple-500 focus:outline-none" />
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mt-4">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={prodCanUnpack} onChange={e => setProdCanUnpack(e.target.checked)} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900" />
                      ¿Se vende por unidades sueltas? (Activa el botón "Abrir Caja")
                    </label>
                  </div>
                </>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-400 transition-colors disabled:opacity-50">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE DE INVENTARIO */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ajuste de Inventario</h2>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">{adjustProduct.description}</p>
              </div>
            </div>
            <div className="mb-4 p-3 rounded-xl bg-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-sm">Stock actual:</span>
              <span className="font-bold text-white text-lg">{adjustProduct.stock} {adjustProduct.isBulk ? 'kg' : 'pzas'}</span>
            </div>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Cantidad a ajustar (+ para agregar, - para quitar)
                </label>
                <input
                  type="number"
                  step={adjustProduct.isBulk ? '0.001' : '1'}
                  required
                  autoFocus
                  placeholder="Ej: -3 (quitar 3) ó +10 (agregar 10)"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(e.target.value)}
                  className="w-full rounded-lg border border-amber-500/30 bg-slate-800 p-2 text-white focus:border-amber-500 focus:outline-none"
                />
                {adjustDelta && !isNaN(parseFloat(adjustDelta)) && (
                  <p className="text-xs text-slate-400 mt-1">
                    Stock nuevo: <strong className="text-white">{Math.max(0, Number(adjustProduct.stock) + parseFloat(adjustDelta))} {adjustProduct.isBulk ? 'kg' : 'pzas'}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Motivo (opcional)</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Selecciona un motivo...</option>
                  <option value="Merma / Pérdida">Merma / Pérdida</option>
                  <option value="Producto Caducado">Producto Caducado</option>
                  <option value="Daño / Rotura">Daño / Rotura</option>
                  <option value="Robo">Robo</option>
                  <option value="Corrección de conteo">Corrección de conteo</option>
                  <option value="Donación">Donación</option>
                  <option value="Consumo interno">Consumo interno</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAdjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ABRIR CAJA (DESARMAR) */}
      {unpackSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                <PackageOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Abrir Caja / Empaque</h2>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">Desarmar: {unpackSource.description}</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-4">
              Esta acción descontará <strong className="text-white">1 unidad</strong> de este empaque y sumará las piezas que indiques al producto destino.
            </p>

            <form onSubmit={handleUnpackProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Producto destino (ej. Cigarro Suelto)</label>
                <select
                  required
                  value={unpackTargetId}
                  onChange={e => setUnpackTargetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Selecciona el producto...</option>
                  {products.filter(p => p.id !== unpackSource.id).map(p => (
                    <option key={p.id} value={p.id}>{p.description}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Piezas obtenidas (al abrir la caja)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="Ej: 20"
                  value={unpackUnits}
                  onChange={e => setUnpackUnits(e.target.value)}
                  className="w-full rounded-lg border border-purple-500/30 bg-slate-800 p-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUnpackSource(null)}
                  className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUnpacking}
                  className="flex-1 rounded-lg bg-purple-500 py-2 text-sm font-bold text-white hover:bg-purple-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUnpacking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
