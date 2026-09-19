import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { PackageOpen, Tags, Plus, Loader2, Search } from 'lucide-react';

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
}

export default function Catalog() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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
        categoryId: prodCatId
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

  const filteredProducts = products.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo</h1>
          <p className="text-slate-400 mt-1">Gestiona los productos y familias</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo {activeTab === 'products' ? 'Producto' : 'Categoría'}
        </button>
      </header>

      {/* Tabs y Búsqueda */}
      <div className="mb-6 flex gap-4 border-b border-white/10 pb-4 justify-between items-center">
        <div className="flex gap-4">
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-9 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === 'products' && filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono">{prod.barcode}</td>
                  <td className="px-6 py-4">{prod.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block whitespace-nowrap rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
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
                  <td className="px-6 py-4 text-emerald-400 font-medium">
                    ${(prod.sellingPrice * prod.stock).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-teal-400 font-medium">
                    ${((prod.sellingPrice - prod.costPrice) * prod.stock).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditProduct(prod)}
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'categories' && filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-slate-400">{cat.description}</td>
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
                    <input required type="text" value={catName} onChange={e => setCatName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Descripción</label>
                    <input type="text" value={catDesc} onChange={e => setCatDesc(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Código de Barras</label>
                    <input required type="text" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Descripción</label>
                    <input required type="text" value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="mb-1 block text-sm font-medium text-slate-300">Costo</label>
                      <input required type="number" step="0.01" value={prodCost} onChange={e => setProdCost(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-sm font-medium text-slate-300">Precio Venta</label>
                      <input required type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Stock Actual</label>
                    <input required type="number" step="1" value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Categoría</label>
                    <select required value={prodCatId} onChange={e => setProdCatId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none">
                      <option value="">Seleccione una categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 font-medium text-slate-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 transition-colors disabled:opacity-50">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
