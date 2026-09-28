import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SubscriptionState {
  isActive: boolean;
  plan: 'monthly' | 'yearly' | null;
  nextBillingDate: string | null;
  setSubscription: (plan: 'monthly' | 'yearly') => void;
  cancelSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isActive: false,
      plan: null,
      nextBillingDate: null,
      setSubscription: (plan) => {
        const nextDate = new Date();
        if (plan === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        set({
          isActive: true,
          plan,
          nextBillingDate: nextDate.toISOString(),
        });
      },
      cancelSubscription: () => set({
        isActive: false,
        plan: null,
        nextBillingDate: null,
      }),
    }),
    {
      name: 'peruchos-subscription',
    }
  )
);
