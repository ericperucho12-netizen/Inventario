import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

// Use the exact publishable test key the user gave me
const stripePromise = loadStripe('pk_test_51UK787FPIGc7tDgq1m1gsXewMcaz3CJWwKcBsEZ5yDMLMq0knuwP3YD4m5wK85LwY2nsZoY7Wl3K5HgCZ1k9GmMg00btTFnDJw');

function SetupForm({ selectedPlan }: { selectedPlan: 'monthly' | 'yearly' }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, setAuth, token } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !user) return;

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    const { error: setupError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });

    if (setupError) {
      setError(setupError.message || 'Hubo un error al guardar la tarjeta.');
    } else {
      // Calcular nueva fecha sin cobrar doble si aún tiene acceso
      let newBillingDate = new Date();
      if (user.nextBillingDate) {
        const currentNext = new Date(user.nextBillingDate);
        if (currentNext.getTime() > new Date().getTime()) {
          newBillingDate = currentNext;
        }
      }
      
      if (selectedPlan === 'monthly') {
        newBillingDate.setMonth(newBillingDate.getMonth() + 1);
      } else {
        newBillingDate.setFullYear(newBillingDate.getFullYear() + 1);
      }

      try {
        await fetch(`http://localhost:3000/users/${user.id}/subscription`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isSubscribed: true,
            subscriptionPlan: selectedPlan,
            nextBillingDate: newBillingDate.toISOString(),
          })
        });
        
        if (token) {
          setAuth({ 
            ...user, 
            isSubscribed: true, 
            subscriptionPlan: selectedPlan, 
            nextBillingDate: newBillingDate.toISOString() 
          }, token);
        }
        setSuccessMsg('¡Tarjeta guardada y suscripción activada exitosamente!');
      } catch (err) {
        setError('Error al actualizar en el servidor.');
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-950/50 p-6 rounded-xl border border-slate-800">
      <PaymentElement options={{ 
        layout: 'tabs',
      }} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 hidden" /> {/* Just to keep spacing consistent if needed or remove */}
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <button 
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        {isProcessing ? 'Procesando...' : `Suscribirse (${selectedPlan === 'monthly' ? '$99/mes' : '$879/año'})`}
      </button>
      <p className="text-center text-xs text-slate-500 mt-2">Pagos procesados de forma segura por Stripe</p>
    </form>
  );
}

export default function SubscriptionForm({ selectedPlan }: { selectedPlan: 'monthly' | 'yearly' }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Pedir al backend que prepare una intención de guardar la tarjeta (SetupIntent)
    fetch('http://localhost:3000/stripe/create-setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => console.error('Error fetching setup intent:', err));
  }, []);

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-xl border border-slate-800">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-2" />
        <p className="text-slate-400 text-sm">Cargando formulario seguro de Stripe...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ 
      clientSecret, 
      appearance: { 
        theme: 'night',
        variables: {
          colorPrimary: '#10b981', // emerald-500
          colorBackground: '#0f172a', // slate-900
          colorText: '#f8fafc', // slate-50
          colorDanger: '#ef4444',
        }
      } 
    }}>
      <SetupForm selectedPlan={selectedPlan} />
    </Elements>
  );
}
