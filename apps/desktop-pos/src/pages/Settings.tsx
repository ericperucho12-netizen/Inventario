import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Printer, ScanLine, Save, Check, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';

export default function Settings() {
  const { defaultPrinter, scannerEnabled, setDefaultPrinter, setScannerEnabled } = useSettingsStore();
  const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Check if we are in Electron
    const electron = (window as any).require ? (window as any).require('electron') : null;
    if (!electron) {
      setIsDesktop(false);
      return;
    }

    const fetchPrinters = async () => {
      setLoadingPrinters(true);
      try {
        const list = await electron.ipcRenderer.invoke('get-printers');
        setPrinters(list || []);
      } catch (e) {
        console.error('Error fetching printers', e);
      } finally {
        setLoadingPrinters(false);
      }
    };

    fetchPrinters();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-emerald-500" />
          Ajustes del Sistema
        </h1>
        <p className="text-slate-400 mt-1">Configura tus dispositivos y preferencias</p>
      </header>

      <div className="space-y-8">
        {/* Sección de Impresoras */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Printer className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configuración de Impresora</h2>
          </div>

          {!isDesktop ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-400 mb-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">La configuración avanzada de impresoras solo está disponible en la versión de escritorio. Usando la versión web, las impresiones mostrarán el diálogo estándar del navegador.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="text-slate-300 font-medium mb-2 block">Impresora de Tickets (Predeterminada)</span>
                {loadingPrinters ? (
                  <p className="text-slate-500 text-sm">Buscando impresoras...</p>
                ) : (
                  <select 
                    value={defaultPrinter} 
                    onChange={(e) => setDefaultPrinter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Usar diálogo de impresión estándar --</option>
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name} {p.isDefault ? '(Predeterminada del OS)' : ''}</option>
                    ))}
                  </select>
                )}
              </label>
              <p className="text-slate-500 text-sm">Al seleccionar una impresora, los tickets se imprimirán de forma silenciosa y directa sin abrir cuadros de diálogo molestos.</p>
            </div>
          )}
        </section>

        {/* Sección de Lector de Códigos */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <ScanLine className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Lector de Códigos de Barras</h2>
          </div>

          <div className="space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={scannerEnabled}
                  onChange={(e) => setScannerEnabled(e.target.checked)}
                />
                <div className={`w-14 h-7 rounded-full transition-colors flex items-center ${scannerEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${scannerEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </div>
              </div>
              <div>
                <span className="text-white font-medium block mb-1 group-hover:text-emerald-400 transition-colors">Habilitar Escaneo Automático (Recomendado)</span>
                <p className="text-slate-400 text-sm">Permite que el sistema detecte disparos rápidos del lector en cualquier momento (Punto de Venta o Compras) y procese el código de inmediato, sin importar dónde esté el cursor.</p>
              </div>
            </label>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Prueba tu lector aquí:</h3>
              <input 
                type="text" 
                placeholder="Haz clic aquí y escanea un producto para probar..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-emerald-400 font-mono text-center focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    alert(`¡Lectura exitosa! Código: ${e.currentTarget.value}`);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <p className="text-xs text-slate-500 text-center mt-2">Al escanear, el código debería aparecer y disparar una alerta de éxito automáticamente.</p>
            </div>
          </div>
        </section>

        {/* Botón de Guardado (Visual, ya que Zustand guarda automáticamente) */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            {saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            {saved ? 'Guardado' : 'Guardar Preferencias'}
          </button>
        </div>

      </div>
    </div>
  );
}
