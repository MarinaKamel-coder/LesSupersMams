// Définition des rôles et types de carburant 
export type Role = 'USER' | 'ADMIN';
export type FuelType = 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE';

// Interface principale Utilisateur
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  rating: number;
  role: Role;
  createdAt: string;
  vehicles?: Vehicle[];
  tripsPosted?: Trip[];
}

// Interface Véhicule
export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
  consumption: number;
  fuelType: FuelType;
  ownerId: number;
}

// Statistiques pour le Dashboard
export interface UserStats {
  tripsCompleted: number;
  totalCO2Saved: number;
  co2Equivalent: {
    treesPlanted: number;
    carKmAvoided: number;
  };
  moneyEarned: number;
  averageRating: number;
}

// Trajet (Trip) simplifié pour l'affichage
export interface Trip {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  driver?: Partial<User>; // Permet d'afficher le nom/avatar du conducteur
}

// Structure globale retournée par /users/dashboard
export interface DashboardData {
  stats: UserStats;
  upcomingTrips: Trip[];
  pendingRequests: {
    received: number;
    sent: number;
  };
  leaderboardPosition: number;
  badges: string[];
}