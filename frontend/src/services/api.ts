import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { User, DashboardData, UserStats, Trip, Vehicle } from '../types/user';

// Configuration de base d'Axios
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Service pour les appels liés à l'utilisateur et au dashboard
 */
export const userService = {
  // Récupère toutes les données du dashboard (stats, trajets à venir, etc.)
  getDashboardData: async (): Promise<DashboardData> => {
    const { data } = await api.get('/users/dashboard');
    return data.data;
  },

  // Récupère le profil complet de l'utilisateur
  getProfile: async (): Promise<{ user: User; stats: UserStats }> => {
    const { data } = await api.get('/users/profile');
    return data.data;
  },

  // Met à jour les informations du profil
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const { data } = await api.put('/users/profile', userData);
    return data.data;
  },

  // Récupère la liste des véhicules de l'utilisateur
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data } = await api.get('/users/vehicles');
    return data.data;
  },

  // Récupère les trajets à venir
  getUpcomingTrips: async (): Promise<Trip[]> => {
    const { data } = await api.get('/users/upcoming-trips');
    return data.data;
  }
};

export default api;