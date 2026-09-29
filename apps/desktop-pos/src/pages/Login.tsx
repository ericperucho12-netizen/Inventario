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

      <div className="z-10 w-full max-w-md px-6 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700 m-4">
        
        {/* Greeting */}
        <div className="mb-10 flex flex-col items-center text-center">
          <img src={logoImg} alt="Logo" className="h-32 object-contain mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:scale-110 transition-transform animate-[bounce_3s_infinite]" />
          
          <h2 className="text-3xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-none drop-shadow-md tracking-tight animate-pulse">
            PeruchOS
          </h2>
          <span className="text-xs text-orange-400 font-bold uppercase tracking-widest mt-1 mb-4">Operating System</span>

          <p className="text-base text-slate-400">{isRegistering ? 'Crea una nueva cuenta para tu negocio' : 'Ingresa a tu cuenta para continuar'}</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-orange-500 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <div className="bg-[#1a1a24]/90 backdrop-blur-xl rounded-2xl p-2 relative overflow-hidden">
              
              {/* Spiderweb top left */}
              <svg className="absolute top-0 left-0 w-16 h-16 text-white/10 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                <path d="M0,0 L100,0 C100,0 70,10 50,30 C30,50 0,100 0,100 L0,0 Z" />
                <path d="M0,20 Q20,20 40,0 M0,40 Q40,40 60,0 M0,60 Q60,60 80,0" stroke="currentColor" strokeWidth="1" fill="none" />
                <line x1="0" y1="0" x2="80" y2="80" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="0" x2="30" y2="90" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="0" x2="90" y2="30" stroke="currentColor" strokeWidth="1" />
              </svg>

              {/* Spiderweb top right */}
              <svg className="absolute top-0 right-0 w-16 h-16 text-white/10 pointer-events-none" style={{ transform: 'scaleX(-1)' }} viewBox="0 0 100 100" fill="currentColor">
                <path d="M0,0 L100,0 C100,0 70,10 50,30 C30,50 0,100 0,100 L0,0 Z" />
                <path d="M0,20 Q20,20 40,0 M0,40 Q40,40 60,0 M0,60 Q60,60 80,0" stroke="currentColor" strokeWidth="1" fill="none" />
                <line x1="0" y1="0" x2="80" y2="80" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="0" x2="30" y2="90" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="0" x2="90" y2="30" stroke="currentColor" strokeWidth="1" />
              </svg>

              <div className="space-y-1 relative z-10">
                {/* Username Input */}
                <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-transparent`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center text-xl">
                    🧙‍♀️
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedInput('username')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-400 focus:outline-none"
                      placeholder="Usuario (email)"
                      required
                    />
                  </div>
                </div>

              {isRegistering && (
                <>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-transparent`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center text-xl">
                      🧛‍♂️
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => setFocusedInput('fullName')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-400 focus:outline-none"
                        placeholder="Nombre Completo"
                        required={isRegistering}
                      />
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-transparent`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center text-xl">
                      🏪
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        onFocus={() => setFocusedInput('companyName')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-400 focus:outline-none"
                        placeholder="Nombre de tu Negocio/Empresa"
                        required={isRegistering}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

              {/* Password Input */}
              <div className={`relative flex items-center rounded-xl transition-all duration-300 bg-transparent`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center text-xl">
                  🗝️
                </div>
                <div className="flex-1">
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-transparent py-3 text-base text-white placeholder:text-slate-400 focus:outline-none tracking-widest"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Mantener sesión iniciada Checkbox */}
          <div className="flex items-center justify-start px-2 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="flex items-center justify-center text-xl">
                {keepSession ? '🎃' : <span className="w-5 h-5 border border-white/20 rounded"></span>}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={keepSession} 
                onChange={(e) => setKeepSession(e.target.checked)}
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Mantener sesión iniciada</span>
            </label>
          </div>

          {/* Sign In Button */}
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-orange-500 to-purple-600 shadow-[0_0_20px_rgba(249,115,22,0.4)] mt-8 group">
            {/* Bats on corners */}
            <span className="absolute -top-3 -left-3 text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🦇</span>
            <span className="absolute -bottom-3 -right-3 text-2xl animate-bounce" style={{ animationDuration: '2.5s' }}>🦇</span>
            
            <button 
              type="submit" 
              disabled={loading || !username || !password}
              className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5a1c3c] to-[#36154b] py-4 font-bold text-white transition-all duration-300 hover:from-[#6b2247] hover:to-[#461a61] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
              
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
          </div>
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

        <div className="mt-12 flex flex-col items-center justify-center gap-1">
          <span className="text-xs text-white/30 font-medium tracking-widest">PERUCHOS POS v2.0</span>
          <span className="text-xl animate-[bounce_4s_infinite]">🕷️</span>
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
