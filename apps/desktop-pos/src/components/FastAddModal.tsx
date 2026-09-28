import React, { useState } from 'react';
import { Loader2, X, PackageOpen } from 'lucide-react';
import { api } from '../lib/axios';

interface FastAddModalProps {
  fastAddData: any;
  setFastAddData: (data: any) => void;
  categories: any[];
  suppliers?: any[];
  onClose: () => void;
  onSuccess: (product: any, initialStock: number, supplierId?: string) => void;
}

export function FastAddModal({ fastAddData, setFastAddData, categories, suppliers = [], onClose, onSuccess }: FastAddModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [localMargin, setLocalMargin] = useState('');

  // Sincronizar localMargin cuando cambia costPrice o sellingPrice externamente
  React.useEffect(() => {
    const cost = Number(fastAddData.costPrice);
    const sell = Number(fastAddData.sellingPrice);
    if (cost > 0 && sell > 0) {
      const m = (((sell - cost) / cost) * 100).toFixed(0);
      setLocalMargin(m);
    } else {
      setLocalMargin('');
    }
  }, [fastAddData.costPrice, fastAddData.sellingPrice]);

  const handleFastAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload = {
        barcode: fastAddData.barcode,
        description: fastAddData.description,
        costPrice: Number(fastAddData.costPrice),
        sellingPrice: Number(fastAddData.sellingPrice),
        stock: 0, // El stock inicial se registrará como una Compra, no directamente en el producto
        categoryId: fastAddData.categoryId,
        imageUrl: fastAddData.imageUrl
      };
      
      const res = await api.post('/products', payload);
      onSuccess(res.data, Number(fastAddData.stock), selectedSupplier);
    } catch (error) {
      alert('Error guardando producto rápido. Verifique los datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </button>
        <h2 className="mb-2 text-xl font-bold flex items-center gap-2 text-emerald-400">
          <PackageOpen className="h-6 w-6" /> Producto Nuevo Detectado
        </h2>
        <p className="text-sm text-slate-400 mb-4">Este producto no está en tu catálogo. Completa los datos para agregarlo y seleccionarlo inmediatamente.</p>
        
        {fastAddData.imageUrl && (
          <div className="flex justify-center mb-4">
            <img src={fastAddData.imageUrl} alt="Vista previa" className="h-32 object-contain rounded-lg bg-white p-2" />
          </div>
        )}

        <form onSubmit={handleFastAddSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Enlace de Foto (URL opcional)</label>
            <input type="url" placeholder="https://ejemplo.com/foto.jpg" value={fastAddData.imageUrl || ''} onChange={e => setFastAddData({...fastAddData, imageUrl: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Código de Barras</label>
            <input disabled type="text" value={fastAddData.barcode} className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Descripción (Autocompletado)</label>
            <input required autoFocus type="text" value={fastAddData.description} onChange={e => setFastAddData({...fastAddData, description: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-300">Costo</label>
              <input required type="number" step="0.01" min="0" value={fastAddData.costPrice} onChange={e => setFastAddData({...fastAddData, costPrice: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-300">Margen (%)</label>
              <input 
                type="number" 
                step="1" 
                placeholder="Ej. 30" 
                value={localMargin}
                onChange={e => {
                  const val = e.target.value;
                  setLocalMargin(val); // Permite borrar libremente
                  
                  const cost = Number(fastAddData.costPrice);
                  if (cost > 0 && val !== '') {
                    const margin = Number(val);
                    setFastAddData({...fastAddData, sellingPrice: (cost * (1 + margin / 100)).toFixed(2)});
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white" 
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-300">Precio Venta</label>
              <input required type="number" step="0.01" min="0" value={fastAddData.sellingPrice} onChange={e => setFastAddData({...fastAddData, sellingPrice: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-300">Stock Inicial</label>
              <input required type="number" min="0" value={fastAddData.stock} onChange={e => setFastAddData({...fastAddData, stock: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-300">Categoría</label>
              <select required value={fastAddData.categoryId} onChange={e => setFastAddData({...fastAddData, categoryId: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white">
                <option value="">Seleccione...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Proveedor (Opcional)</label>
            <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 focus:border-emerald-500 focus:outline-none text-white">
              <option value="">Sin Proveedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full mt-6 rounded-lg bg-emerald-500 px-4 py-3 font-bold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar y Seleccionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
