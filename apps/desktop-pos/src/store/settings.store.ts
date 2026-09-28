import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  defaultPrinter: string;
  scannerEnabled: boolean;
  scaleEnabled: boolean;
  theme: 'dark' | 'light' | 'blue';
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  setDefaultPrinter: (printerName: string) => void;
  setScannerEnabled: (enabled: boolean) => void;
  setScaleEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'blue') => void;
  setStoreInfo: (info: { storeName: string; storeAddress: string; storePhone: string }) => void;
  setTaxRate: (rate: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultPrinter: '',
      scannerEnabled: true,
      scaleEnabled: false,
      theme: 'dark',
      storeName: 'PeruchOS Store',
      storeAddress: '',
      storePhone: '',
      taxRate: 0,
      setDefaultPrinter: (printerName) => set({ defaultPrinter: printerName }),
      setScannerEnabled: (enabled) => set({ scannerEnabled: enabled }),
      setScaleEnabled: (enabled) => set({ scaleEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setStoreInfo: (info) => set(info),
      setTaxRate: (rate) => set({ taxRate: rate }),
    }),
    {
      name: 'peruchos-settings-storage',
    }
  )
);
