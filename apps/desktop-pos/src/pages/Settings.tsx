import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Printer, ScanLine, Save, Check, AlertCircle, Palette, Scale, Users as UsersIcon, Plus, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/auth.store';

export default function Settings() {
  const { 
    defaultPrinter, scannerEnabled, scaleEnabled, theme, 
    storeName, storeAddress, storePhone, taxRate,
    setDefaultPrinter, setScannerEnabled, setScaleEnabled, setTheme,
    setStoreInfo, setTaxRate 
  } = useSettingsStore();
  const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [saved, setSaved] = useState(false);
  
  const { user } = useAuthStore();
  const [myUsers, setMyUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'CAJERO' });

  // Local state for text inputs so we don't cause renders on every keystroke
  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [localStoreAddress, setLocalStoreAddress] = useState(storeAddress);
  const [localStorePhone, setLocalStorePhone] = useState(storePhone);
  const [localTaxRate, setLocalTaxRate] = useState(taxRate.toString());

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
    if (user?.role !== 'CAJERO') {
      fetchMyUsers();
    }
  }, [user]);

  const fetchMyUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/users/my-users');
      setMyUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/my-users', newUser);
      setNewUser({ username: '', password: '', fullName: '', role: 'CAJERO' });
      fetchMyUsers();
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${name}?`)) return;
    try {
      await api.delete(`/users/my-users/${id}`);
      fetchMyUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const handleSave = () => {
    setStoreInfo({ storeName: localStoreName, storeAddress: localStoreAddress, storePhone: localStorePhone });
    setTaxRate(Number(localTaxRate) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleWipeData = async () => {
    const code = window.prompt('ATENCIÓN: Esto eliminará TODAS las ventas, gastos, cortes de caja y cuentas por cobrar de tu negocio (Tus productos y categorías NO se borrarán).\n\nEscribe "BORRAR" para confirmar:');
    if (code !== 'BORRAR') {
      if (code !== null) alert('Código incorrecto. No se borró nada.');
      return;
    }
    
    try {
      const res = await api.delete('/dashboard/wipe-data');
      alert(res.data.message || 'Datos borrados correctamente');
      window.location.reload();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al borrar los datos');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-slate-500" />
          Ajustes del Sistema
        </h1>
        <p className="text-slate-400 mt-1">Configura tus dispositivos y preferencias</p>
      </header>

      <div className="space-y-8 pb-20">
        {/* Sección de Datos de la Tienda */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <SettingsIcon className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Datos de la Tienda y Ticket</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Nombre del Negocio</label>
              <input
                type="text"
                value={localStoreName}
                onChange={(e) => setLocalStoreName(e.target.value)}
                placeholder="Ej. Abarrotes Don Pepe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Teléfono (Opcional)</label>
              <input
                type="text"
                value={localStorePhone}
                onChange={(e) => setLocalStorePhone(e.target.value)}
                placeholder="Ej. 555-123-4567"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Dirección o Mensaje en el Ticket</label>
              <input
                type="text"
                value={localStoreAddress}
                onChange={(e) => setLocalStoreAddress(e.target.value)}
                placeholder="Ej. Av. Principal #123, ¡Gracias por su compra!"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Sección de Impuestos */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <SettingsIcon className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Impuestos y Finanzas</h2>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Tasa de Impuesto / IVA (%)</label>
            <div className="relative max-w-xs">
              <input
                type="number"
                value={localTaxRate}
                onChange={(e) => setLocalTaxRate(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
            <p className="text-slate-500 text-sm mt-2">Este porcentaje se usará para calcular el desglose de impuestos en reportes y tickets futuros.</p>
          </div>
        </section>
        {/* Sección de Impresoras */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Printer className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configuración de Impresora</h2>
          </div>

          {!isDesktop ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-400 mb-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Las impresiones desde navegadores web (PC, Tablet, o Celular) utilizan el diálogo nativo de tu dispositivo. 
                Si tienes una impresora conectada por <b>Bluetooth, USB, o WiFi</b>, el sistema la detectará y podrás enviar el ticket normalmente.
              </p>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                <div className={`w-14 h-7 rounded-full transition-colors flex items-center ${scannerEnabled ? 'bg-slate-500' : 'bg-slate-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${scannerEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </div>
              </div>
              <div>
                <span className="text-white font-medium block mb-1 group-hover:text-slate-400 transition-colors">Habilitar Escaneo Automático (Recomendado)</span>
                <p className="text-slate-400 text-sm">Permite que el sistema detecte disparos rápidos del lector (USB, Bluetooth, integrado) en cualquier momento y procese el código de inmediato.</p>
              </div>
            </label>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Prueba tu lector aquí:</h3>
              <input 
                type="text" 
                placeholder="Haz clic aquí y escanea un producto para probar..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-400 font-mono text-center focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    alert(`¡Lectura exitosa! Código: ${e.currentTarget.value}`);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        </section>

        {/* Sección de Básculas */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Scale className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Conexión de Básculas</h2>
          </div>

          <div className="space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={scaleEnabled}
                  onChange={(e) => setScaleEnabled(e.target.checked)}
                />
                <div className={`w-14 h-7 rounded-full transition-colors flex items-center ${scaleEnabled ? 'bg-slate-500' : 'bg-slate-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${scaleEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </div>
              </div>
              <div>
                <span className="text-white font-medium block mb-1 group-hover:text-slate-400 transition-colors">Integración con Báscula</span>
                <p className="text-slate-400 text-sm">Activa la interfaz para leer el peso de básculas conectadas (Bluetooth o USB). Al activarlo, aparecerá el botón de "Obtener Peso" en los productos que se venden a granel.</p>
              </div>
            </label>
            
            {scaleEnabled && !isDesktop && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-blue-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  <b>Nota para versión web/móvil:</b> Si usas una báscula Bluetooth moderna compatible con Web Bluetooth, el sistema podrá conectarse. Si tienes una báscula antigua con cable serial (COM), necesitarás usar la aplicación de escritorio de PeruchOS para leer el peso automáticamente.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Sección de Apariencia */}
        <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Palette className="h-6 w-6 text-pink-400" />
            <h2 className="text-xl font-bold text-white">Apariencia del Sistema</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-slate-500 bg-slate-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}
            >
              <div className="w-full h-16 bg-slate-900 rounded-md border border-slate-700 flex items-center justify-center text-white font-medium">Oscuro</div>
              <span className="font-bold text-white">Modo Nocturno</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-slate-500 bg-slate-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}
            >
              <div className="w-full h-16 bg-[#f1f5f9] rounded-md border border-slate-300 flex items-center justify-center text-slate-900 font-medium">Claro</div>
              <span className="font-bold text-white">Modo Claro</span>
            </button>
            <button
              onClick={() => setTheme('halloween')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'halloween' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-950 hover:border-orange-500/50'}`}
            >
              <div className="w-full h-16 bg-purple-950 rounded-md border border-orange-500/50 flex items-center justify-center text-orange-400 font-bold">🎃 Hallow</div>
              <span className="font-bold text-white">Halloween</span>
            </button>
          </div>
        </section>

        {/* Sección de Usuarios (Solo Propietarios y Administradores) */}
        {user?.role !== 'CAJERO' && (
          <section className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <UsersIcon className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Gestión de Usuarios (Cajeros)</h2>
            </div>
            
            <p className="text-slate-400 text-sm mb-6">Agrega cuentas para tus empleados. Los cajeros solo podrán vender y hacer corte Z, pero no verán tus reportes ni ganancias totales.</p>

            <form onSubmit={handleCreateUser} className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
              <h3 className="text-sm font-bold text-white mb-4">Agregar Nuevo Empleado</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Usuario"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500"
                  />
                </div>
                <div>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500"
                  >
                    <option value="CAJERO">Cajero (Restringido)</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm w-full md:w-auto">
                <Plus className="h-4 w-4" /> Crear Usuario
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg font-medium">Empleado</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 rounded-tr-lg font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{u.fullName}</td>
                      <td className="px-4 py-3 text-indigo-400">@{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          u.role === 'PROPIETARIO' ? 'bg-purple-500/20 text-purple-400' :
                          u.role === 'ADMINISTRADOR' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'PROPIETARIO' && user?.id !== u.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loadingUsers && (
                    <tr><td colSpan={4} className="text-center py-4">Cargando usuarios...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Sección de Peligro (Limpiar Datos) */}
        {user?.role === 'PROPIETARIO' && (
          <section className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-red-500">Zona de Peligro</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="font-bold text-white mb-1">Limpiar Datos de Prueba (Dejar en Cero)</h3>
                <p className="text-sm text-red-200/60 max-w-lg">
                  Si estuviste haciendo pruebas, usa este botón para eliminar todas las ventas, gastos y cortes de caja. 
                  <strong className="text-red-400"> Tus productos y clientes seguirán intactos.</strong>
                </p>
              </div>
              <button
                onClick={handleWipeData}
                className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-5 w-5" /> Dejar en Cero
              </button>
            </div>
          </section>
        )}

        {/* Botón de Guardado (Visual, ya que Zustand guarda automáticamente) */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="bg-slate-500 hover:bg-slate-400 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-slate-500/20 transition-all flex items-center gap-2"
          >
            {saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            {saved ? 'Guardado' : 'Guardar Preferencias'}
          </button>
        </div>

      </div>
    </div>
  );
}
