import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineSale {
  id: string; // local id
  items: any[];
  paymentMethod: string;
  customerId?: string;
  isCredit?: boolean;
  total: number;
  date: string;
}

interface OfflineStore {
  cachedProducts: any[];
  cachedCustomers: any[];
  pendingSales: OfflineSale[];
  
  setCachedProducts: (products: any[]) => void;
  setCachedCustomers: (customers: any[]) => void;
  addPendingSale: (sale: OfflineSale) => void;
  removePendingSale: (id: string) => void;
  clearPendingSales: () => void;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set) => ({
      cachedProducts: [],
      cachedCustomers: [],
      pendingSales: [],
      
      setCachedProducts: (products) => set({ cachedProducts: products }),
      setCachedCustomers: (customers) => set({ cachedCustomers: customers }),
      addPendingSale: (sale) => set((state) => ({ pendingSales: [...state.pendingSales, sale] })),
      removePendingSale: (id) => set((state) => ({ 
        pendingSales: state.pendingSales.filter(s => s.id !== id) 
      })),
      clearPendingSales: () => set({ pendingSales: [] }),
    }),
    {
      name: 'peruchos-offline-storage', // saves to localStorage
    }
  )
);
