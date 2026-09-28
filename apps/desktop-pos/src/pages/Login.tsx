import React, { useState, useEffect } from 'react';
import { UserCircle, KeyRound, Loader2, AlertCircle, ChevronRight, Fingerprint, Settings, Server } from 'lucide-react';
import { getApiUrl } from '../lib/axios';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSession, setKeepSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('peruchos-api-url', apiUrl);
    window.location.reload(); // Recargar para aplicar cambios en axios
  };
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Guardar preferencia antes de inicializar auth store
    localStorage.setItem('peruchos-keep-session', keepSession ? 'true' : 'false');
    
    try {
      const response = await api.post('/auth/login', { username, password });
      setAuth(response.data.user, response.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] font-sans selection:bg-indigo-500/30">
      
      {/* Background Animated Orbs for a premium feel */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="z-10 w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Greeting */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2">PeruchOS</h1>
          <p className="text-base text-slate-400">Ingresa a tu cuenta para continuar</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Inputs Section Container (Mobile iOS style grouped inputs) */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-2 shadow-2xl overflow-hidden relative">
            
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"></div>

            {/* Username Input */}
            <div className={`relative flex items-center rounded-2xl p-1 transition-all duration-300 ${focusedInput === 'username' ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <UserCircle className={`h-5 w-5 transition-colors ${focusedInput === 'username' ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-500 focus:outline-none"
                  placeholder="Usuario"
                  required
                />
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5 ml-12"></div>

            {/* Password Input */}
            <div className={`relative flex items-center rounded-2xl p-1 transition-all duration-300 ${focusedInput === 'password' ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <KeyRound className={`h-5 w-5 transition-colors ${focusedInput === 'password' ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-500 focus:outline-none tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          {/* Mantener sesión iniciada Checkbox */}
          <div className="flex items-center justify-between px-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${keepSession ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600 bg-white/[0.02] group-hover:border-indigo-400'}`}>
                {keepSession && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={keepSession} 
                onChange={(e) => setKeepSession(e.target.checked)}
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Mantener sesión iniciada</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit" 
            disabled={loading || !username || !password}
            className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-4 font-bold text-white transition-all duration-300 hover:bg-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-indigo-500 disabled:hover:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed overflow-hidden mt-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Fingerprint className="h-5 w-5 opacity-80" />
                <span>Ingresar</span>
                <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors bg-slate-900 px-4 py-2 rounded-full border border-slate-800 hover:border-indigo-500/30"
          >
            <Settings className="h-4 w-4" />
            Configurar Conexión
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-slate-600 font-medium tracking-wider">
          PERUCHOS POS v2.0
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Servidor de Base de Datos</h3>
            </div>
            
            <form onSubmit={handleSaveSettings}>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">Dirección IP del Servidor</label>
                <input 
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="ej. http://192.168.1.15:3000"
                  className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">Ejemplo para celular: http://[IP_COMPUTADORA]:3000</p>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Tailwind animation class needed for shimmer */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
