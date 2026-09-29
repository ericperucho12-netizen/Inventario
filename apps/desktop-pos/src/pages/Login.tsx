import React, { useState, useEffect } from 'react';
import { UserCircle, KeyRound, Loader2, AlertCircle, ChevronRight, Fingerprint, Settings, Server, Check } from 'lucide-react';
import { getApiUrl } from '../lib/axios';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSession, setKeepSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [focusedInput, setFocusedInput] = useState<'username' | 'password' | 'fullName' | 'companyName' | null>(null);

  // Recuperación de contraseña
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotUsername, setForgotUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
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
      if (isRegistering) {
        const response = await api.post('/auth/register', { username, password, fullName, companyName });
        setAuth(response.data.user, response.data.access_token);
        navigate('/dashboard');
      } else {
        const response = await api.post('/auth/login', { username, password });
        setAuth(response.data.user, response.data.access_token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setLoading(true);

    try {
      if (forgotStep === 1) {
        // Fetch question
        const res = await api.get(`/auth/security-question?username=${forgotUsername}`);
        setSecurityQuestion(res.data.question);
        setForgotStep(2);
      } else if (forgotStep === 2) {
        // Enviar repuesta y nueva contra
        await api.post('/auth/reset-password', {
          username: forgotUsername,
          securityAnswer,
          newPassword
        });
        setForgotSuccess(true);
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Error en la recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] bg-[url('https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?q=80&w=2070')] bg-cover bg-center font-sans selection:bg-orange-500/30">
      
      {/* Background Animated Orbs for a premium feel */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-orange-600/30 blur-[120px] animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-700/30 blur-[150px] animate-[pulse_5s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
      
      {/* Overlay to ensure contrast */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

      <div className="z-10 w-full max-w-md px-8 py-10 rounded-2xl backdrop-blur-md bg-black/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700 m-4">
        
        {/* Greeting */}
        <div className="mb-10 flex flex-col items-center text-center">
          <img src={logoImg} alt="Logo" className="h-32 object-contain mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:scale-110 transition-transform animate-[bounce_3s_infinite]" />
          
          <h2 className="text-3xl font-black bg-gradient-to-r from-orange-500 via-amber-500 to-purple-500 bg-clip-text text-transparent leading-none drop-shadow-md tracking-tight animate-pulse">
            PeruchOS
          </h2>
          <span className="text-xs text-orange-400/80 font-bold uppercase tracking-widest mt-1 mb-4">Operating System</span>

          <p className="text-base text-slate-400">{isRegistering ? 'Crea una nueva cuenta para tu negocio' : 'Ingresa a tu cuenta para continuar'}</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4 relative">
            {/* Username Input */}
            <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-gray-900 border ${focusedInput === 'username' ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-white/10'}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                {/* Sombrero de bruja SVG */}
                <svg className={`h-5 w-5 transition-colors ${focusedInput === 'username' ? 'text-orange-500' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L7 17H17L12 2Z" />
                  <path d="M3 17C3 17 8 20 12 20C16 20 21 17 21 17" />
                </svg>
              </div>
              <div className="flex-1">
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-500 focus:outline-none"
                  placeholder="Usuario (email)"
                  required
                />
              </div>
            </div>

            {isRegistering && (
              <>
                <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-gray-900 border ${focusedInput === 'fullName' ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-white/10'}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    <UserCircle className={`h-5 w-5 transition-colors ${focusedInput === 'fullName' ? 'text-orange-500' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocusedInput('fullName')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="Nombre Completo"
                      required={isRegistering}
                    />
                  </div>
                </div>
                <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-gray-900 border ${focusedInput === 'companyName' ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-white/10'}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    <Server className={`h-5 w-5 transition-colors ${focusedInput === 'companyName' ? 'text-orange-500' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onFocus={() => setFocusedInput('companyName')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-500 focus:outline-none"
                      placeholder="Nombre de tu Negocio/Empresa"
                      required={isRegistering}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Input */}
            <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-gray-900 border ${focusedInput === 'password' ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-white/10'}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                {/* Llave antigua SVG */}
                <svg className={`h-5 w-5 transition-colors ${focusedInput === 'password' ? 'text-orange-500' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="15" r="4" />
                  <path d="M10.5 11.5L20 2v4l-3 3v3l-3 3" />
                </svg>
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
              <div className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${keepSession ? 'border-orange-500 bg-orange-500' : 'border-slate-600 bg-white/[0.02] group-hover:border-orange-400'}`}>
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
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 py-4 font-bold text-white transition-all duration-300 hover:from-orange-400 hover:to-purple-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] active:scale-[0.98] disabled:opacity-50 disabled:hover:from-orange-500 disabled:hover:to-purple-600 disabled:hover:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed overflow-hidden mt-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Fingerprint className="h-5 w-5 opacity-80" />
                <span>{isRegistering ? 'Crear Cuenta' : 'Ingresar'}</span>
                <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="block w-full text-orange-400 text-sm font-medium hover:text-orange-500 transition-colors"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registra tu empresa'}
          </button>
          
          {!isRegistering && (
            <button
              type="button"
              onClick={() => { setShowForgotPwd(true); setForgotStep(1); setForgotUsername(''); setForgotError(null); setForgotSuccess(false); }}
              className="block w-full text-slate-500 text-sm font-medium hover:text-slate-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-orange-500 transition-colors bg-slate-900 px-4 py-2 rounded-full border border-slate-800 hover:border-indigo-500/30"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-orange-400">
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

      {/* Forgot Password Modal */}
      {showForgotPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Recuperar Contraseña</h3>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full mb-4">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-white font-bold mb-2">¡Contraseña Actualizada!</h4>
                <p className="text-slate-400 text-sm mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <button onClick={() => setShowForgotPwd(false)} className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400">
                  Volver al Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotNext}>
                {forgotStep === 1 && (
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-slate-300">¿Cuál es tu usuario (email)?</label>
                    <input 
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                )}

                {forgotStep === 2 && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Pregunta de Seguridad:</p>
                      <p className="font-medium text-white mb-2">{securityQuestion}</p>
                      <input 
                        type="text"
                        placeholder="Tu respuesta..."
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">Nueva Contraseña</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowForgotPwd(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (forgotStep === 1 ? 'Siguiente' : 'Restablecer')}
                  </button>
                </div>
              </form>
            )}
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
