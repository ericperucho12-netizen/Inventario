import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  defaultPrinter: string;
  scannerEnabled: boolean;
  scaleEnabled: boolean;
  theme: 'dark' | 'light' | 'halloween';
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  transferClabe: string;
  transferPhone: string;
  transferAlias: string;
  setDefaultPrinter: (printerName: string) => void;
  setScannerEnabled: (enabled: boolean) => void;
  setScaleEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'halloween') => void;
  setStoreInfo: (info: { storeName: string; storeAddress: string; storePhone: string }) => void;
  setTaxRate: (rate: number) => void;
  setTransferInfo: (info: { transferClabe: string; transferPhone: string; transferAlias: string }) => void;
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
      transferClabe: '',
      transferPhone: '',
      transferAlias: '',
      setDefaultPrinter: (printerName) => set({ defaultPrinter: printerName }),
      setScannerEnabled: (enabled) => set({ scannerEnabled: enabled }),
      setScaleEnabled: (enabled) => set({ scaleEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setStoreInfo: (info) => set(info),
      setTaxRate: (rate) => set({ taxRate: rate }),
      setTransferInfo: (info) => set(info),
    }),
    {
      name: 'peruchos-settings-storage',
    }
  )
);
