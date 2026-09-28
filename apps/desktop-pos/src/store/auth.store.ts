import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  role: string;
  fullName: string;
  isSubscribed?: boolean;
  subscriptionPlan?: string | null;
  nextBillingDate?: string | null;
  securityQuestion?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// Storage custom para usar sessionStorage o localStorage dependiendo de "Mantener Sesión"
const customStorage = {
  getItem: (name: string) => {
    return localStorage.getItem(name) || sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    const keepSession = localStorage.getItem('peruchos-keep-session') === 'true';
    if (keepSession) {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'peruchos-auth-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
