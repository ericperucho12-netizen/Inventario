import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  defaultPrinter: string;
  scannerEnabled: boolean;
  setDefaultPrinter: (printerName: string) => void;
  setScannerEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultPrinter: '',
      scannerEnabled: true,
      setDefaultPrinter: (printerName) => set({ defaultPrinter: printerName }),
      setScannerEnabled: (enabled) => set({ scannerEnabled: enabled }),
    }),
    {
      name: 'peruchos-settings-storage',
    }
  )
);
