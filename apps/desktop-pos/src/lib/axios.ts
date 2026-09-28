import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const getApiUrl = () => {
  // Si estamos accediendo desde un celular (IP), usar el proxy de Vite
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.protocol.startsWith('http')) {
    return window.location.origin + '/api';
  }

  let url = localStorage.getItem('peruchos-api-url') || 'http://localhost:3000';
  url = url.replace(/\/$/, ''); // Quitar slash final si existe
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  return url;
};

export const api = axios.create({
  baseURL: getApiUrl(), // URL del backend NestJS configurable
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token JWT y el baseURL en cada petición
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Actualizar baseURL por si el usuario lo cambió en la configuración
  config.baseURL = getApiUrl();
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
