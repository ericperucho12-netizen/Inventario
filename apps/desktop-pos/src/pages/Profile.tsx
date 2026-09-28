import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useSubscriptionStore } from '../store/subscription.store';
import { CreditCard, Check, AlertCircle, X, User as UserIcon, Mail, Lock as LockIcon, Save } from 'lucide-react';
import SubscriptionForm from '../components/SubscriptionForm';

export default function Profile() {
  const { user, setAuth, token } = useAuthStore();
  
  const isActive = user?.isSubscribed || false;
  const plan = user?.subscriptionPlan || null;
  const nextBillingDate = user?.nextBillingDate || null;
  
  // They have access if they are actively subscribed OR their billing date is in the future
  const hasAccess = isActive || (nextBillingDate && new Date(nextBillingDate).getTime() > new Date().getTime());
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  
  // Estados para ajustes de usuario
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.username || ''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  
  // Custom Modals / Toasts
  const [notification, setNotification] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const showNotification = (title: string, message: string, type: 'success' | 'error') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 4000); // Auto close after 4s
  };

  const handleSaveUser = async () => {
    if (password && password !== confirmPassword) {
      showNotification('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    setIsSavingUser(true);
    
    try {
      const updateData: any = { fullName, username: email };
      if (password) {
        updateData.passwordHash = password;
      }

      const res = await fetch(`http://localhost:3000/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (!res.ok) throw new Error('Error al actualizar');
      
      const updatedUser = await res.json();
      
      if (token) {
        setAuth({ ...user, ...updatedUser }, token);
      }
      
      setPassword('');
      setConfirmPassword('');
      showNotification('Éxito', 'Tus datos han sido actualizados exitosamente.', 'success');
    } catch (error) {
      showNotification('Error', 'Hubo un error al guardar los datos.', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };
  
  const handleCancelSubscription = () => {
    setShowConfirm(true);
  };
  
  const executeCancelSubscription = async () => {
    if (user) {
      try {
        await fetch(`http://localhost:3000/users/${user.id}/subscription`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isSubscribed: false,
            subscriptionPlan: user.subscriptionPlan,
            nextBillingDate: user.nextBillingDate, 
          })
        });
        
        if (token) {
          setAuth({ ...user, isSubscribed: false }, token);
        }
        showNotification('Suscripción Cancelada', 'Podrás seguir usando la plataforma hasta tu fecha de corte.', 'success');
      } catch (err) {
        showNotification('Error', 'Hubo un error al cancelar tu suscripción.', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-start gap-3 z-50 border max-w-sm transition-all ${
          notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50' : 'bg-red-950/90 border-red-500/50'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-6 w-6 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
          )}
          <div>
            <h4 className={`font-bold ${notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {notification.title}
            </h4>
            <p className="text-slate-300 text-sm mt-0.5">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white ml-2">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Cancelar Suscripción</h3>
            </div>
            <p className="text-slate-300 mb-6">
              ¿Estás seguro de que quieres cancelar tu suscripción? Perderás la renovación automática, pero podrás seguir usando PeruchOS hasta el final de tu ciclo actual.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Conservar Plan
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(false);
                  executeCancelSubscription();
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-500/20"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header Perfil */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-xl flex items-center gap-6">
          <div className="h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white text-4xl shadow-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{user?.fullName || user?.username}</h1>
            <p className="text-emerald-400 font-medium capitalize text-lg">{user?.role}</p>
            <p className="text-slate-400 mt-1">Administrador de la plataforma PeruchOS</p>
          </div>
        </div>

        {/* Mensaje de Bloqueo si no hay suscripción activa */}
        {!hasAccess && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
              <LockIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-red-400 font-bold text-lg">Acceso Restringido</h3>
              <p className="text-red-300 text-sm">
                Actualmente no tienes un plan activo. Para usar el Punto de Venta, Inventario y Reportes, debes agregar tu tarjeta de crédito o débito y suscribirte a uno de nuestros planes a continuación.
              </p>
            </div>
          </div>
        )}

        {/* Ajustes de Usuario */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
            <UserIcon className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Ajustes de Cuenta</h2>
              <p className="text-slate-400 text-sm mt-1">Actualiza tu información personal y credenciales</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Nombre Completo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Correo Electrónico</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dejar en blanco para no cambiar" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Confirmar Contraseña</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma la nueva contraseña" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
            <button 
              onClick={handleSaveUser}
              disabled={isSavingUser}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isSavingUser ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sección de Suscripción */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-emerald-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Suscripción a PeruchOS</h2>
                <p className="text-slate-400 text-sm mt-1">Administra tu plan y método de pago</p>
              </div>
            </div>
            {hasAccess ? (
              isActive ? (
                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Plan Activo
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cancelado (Aún con acceso)
                </span>
              )
            ) : (
              <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Sin Suscripción
              </span>
            )}
          </div>

          {isActive ? (
            <div className="bg-slate-950 rounded-xl border border-emerald-500/30 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Plan {plan === 'yearly' ? 'Anual' : 'Mensual'} (Pro)
                </h3>
                <p className="text-slate-300">
                  Tu suscripción está activa y todas las funciones están desbloqueadas.
                </p>
                {nextBillingDate && (
                  <p className="text-emerald-400 font-medium mt-2">
                    Próximo cobro: {new Date(nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <button 
                onClick={handleCancelSubscription}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shrink-0"
              >
                <X className="h-5 w-5" />
                Cancelar Suscripción
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {hasAccess && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-amber-400 font-bold text-lg">Renovar Suscripción</h3>
                    <p className="text-slate-300">
                      Has cancelado tu suscripción, pero aún tienes acceso hasta el <span className="font-bold text-white">{new Date(nextBillingDate!).toLocaleDateString()}</span>. 
                      Puedes suscribirte de nuevo eligiendo un plan a continuación.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Selección de Planes */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Elige tu plan</h3>
                  
                  <label className={`cursor-pointer block rounded-xl border-2 p-6 transition-all ${selectedPlan === 'monthly' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="plan" 
                          value="monthly" 
                          checked={selectedPlan === 'monthly'} 
                          onChange={() => setSelectedPlan('monthly')}
                          className="w-5 h-5 accent-emerald-500" 
                        />
                        <span className="text-lg font-bold text-white">Mensual</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-400">$99 <span className="text-sm font-normal text-slate-500">MXN</span></span>
                    </div>
                    <p className="text-slate-400 text-sm ml-8">Flexibilidad de pago mes a mes. Cancela cuando quieras.</p>
                  </label>

                  <label className={`cursor-pointer block rounded-xl border-2 p-6 transition-all ${selectedPlan === 'yearly' ? 'border-emerald-500 bg-emerald-500/10 relative overflow-hidden' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                    {selectedPlan === 'yearly' && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                        AHORRA $321
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="plan" 
                          value="yearly" 
                          checked={selectedPlan === 'yearly'} 
                          onChange={() => setSelectedPlan('yearly')}
                          className="w-5 h-5 accent-emerald-500" 
                        />
                        <span className="text-lg font-bold text-white">Anual</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-400">$879 <span className="text-sm font-normal text-slate-500">MXN</span></span>
                    </div>
                    <p className="text-slate-400 text-sm ml-8">Ahorra más de 3 meses al pagar el año completo.</p>
                  </label>
                </div>

                {/* Formulario Stripe */}
                <div className="flex flex-col justify-center">
                  <SubscriptionForm selectedPlan={selectedPlan} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
