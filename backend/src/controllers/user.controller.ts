import type { Request, Response } from 'express';
import { BookingStatus } from '../generated/prisma/client'; 
import prisma from '../prisma/prisma';
import { EMISSION_FACTORS } from '../utils/co2';

export const userController = {
  /**
   * GET /dashboard - Statistiques et vue d'ensemble
   */
  getDashboard: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' });

      const [stats, upcoming, pending, leaderboard] = await Promise.all([
        getUserCompleteStatsLogic(userId),
        getUpcomingTripsLogic(userId, 3),
        getPendingRequestsStatsLogic(userId),
        getLeaderboardPositionLogic(userId)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          stats,
          upcomingTrips: upcoming,
          pendingRequests: pending,
          leaderboardPosition: leaderboard,
          badges: generateEcoBadges(stats.totalCO2Saved, stats.tripsCompleted)
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Erreur dashboard' });
    }
  },
  

  /**
   * GET /profile - Profil utilisateur et véhicules
   */
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ success: false });

      const [userRecord, stats] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            bio: true,
            rating: true,
            role: true,
            createdAt: true,
            vehicles: true,
            tripsPosted: { orderBy: { departureTime: 'asc' } },
            bookings: { include: { trip: true } }
          }
        }),
        getUserCompleteStatsLogic(userId)
      ]);

return res.status(200).json({ success: true, data: { user: userRecord, stats } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur profil' });
    }
  },

  /**
   * PUT /profile - Mise à jour des infos
   */
  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: req.body
      });
      return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur mise à jour' });
    }
  },

  /**
   * Endpoints granulaires pour tes routes spécifiques
   */
  getPersonalStats: async (req: Request, res: Response) => {
    const stats = await getUserCompleteStatsLogic(req.user!.sub);
    res.json({ success: true, data: stats });
  },

  getUpcomingTrips: async (req: Request, res: Response) => {
    const trips = await getUpcomingTripsLogic(req.user!.sub);
    res.json({ success: true, data: trips });
  },

  getPendingRequests: async (req: Request, res: Response) => {
    const pending = await getPendingRequestsStatsLogic(req.user!.sub);
    res.json({ success: true, data: pending });
  },

  getVehicles: async (req: Request, res: Response) => {
    const vehicles = await prisma.vehicle.findMany({ where: { ownerId: req.user!.sub } });
    res.json({ success: true, data: vehicles });
  },

  getRecentConversations: async (req: Request, res: Response) => {
    const convs = await getRecentConversationsLogic(req.user!.sub);
    res.json({ success: true, data: convs });
  }
};

// --- LOGIQUE INTERNE (Privée) ---

async function getUserCompleteStatsLogic(userId: number) {
  const now = new Date();
  const [tripsAsDriver, bookingsAsPassenger, user, vehiclesCount, pending, ecoData, finances] = await Promise.all([
    prisma.trip.count({ where: { driverId: userId, departureTime: { lt: now } } }),
    prisma.booking.count({ where: { passengerId: userId, status: BookingStatus.ACCEPTED, trip: { departureTime: { lt: now } } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { rating: true } }),
    prisma.vehicle.count({ where: { ownerId: userId } }),
    getPendingRequestsStatsLogic(userId),
    calculateEcoStats(userId),
    calculateFinancialStats(userId)
  ]);

  const co2Saved = ecoData.totalCO2Saved;

  return {
    tripsCompleted: tripsAsDriver + bookingsAsPassenger,
    tripsAsDriver,
    tripsAsPassenger: bookingsAsPassenger,
    totalCO2Saved: co2Saved,
    co2Equivalent: {
        treesPlanted: Math.round(co2Saved / 25), // 25kg/an/arbre
        carKmAvoided: Math.round((co2Saved / EMISSION_FACTORS.ESSENCE) * (100 / 7)) // 7L/100km avg
    },
    moneySaved: finances.moneySaved,
    moneyEarned: finances.moneyEarned,
    totalSpent: finances.totalSpent,
    pendingRequests: pending,
    vehiclesCount,
    averageRating: user?.rating || 0,
    totalDistance: ecoData.totalDistance,
    totalPassengers: ecoData.totalPassengers
  };
}

async function calculateEcoStats(userId: number) {
  const trips = await prisma.trip.findMany({
    where: { driverId: userId, departureTime: { lt: new Date() } },
    include: { bookings: { where: { status: BookingStatus.ACCEPTED } } }
  });
  let totalCO2Saved = 0, totalDistance = 0, totalPassengers = 0;
  trips.forEach(trip => {
    const count = trip.bookings.length;
    totalCO2Saved += (trip.co2SavedPerPass * count);
    totalDistance += trip.distanceKm;
    totalPassengers += count;
  });
  return { totalCO2Saved: Number(totalCO2Saved.toFixed(2)), totalDistance, totalPassengers };
}

async function calculateFinancialStats(userId: number) {
  const [driverTrips, passengerBookings] = await Promise.all([
    prisma.trip.findMany({
      where: { driverId: userId, departureTime: { lt: new Date() } },
      include: { bookings: { where: { status: BookingStatus.ACCEPTED } } }
    }),
    prisma.booking.findMany({
      where: { passengerId: userId, status: BookingStatus.ACCEPTED, trip: { departureTime: { lt: new Date() } } },
      include: { trip: true }
    })
  ]);
  const moneyEarned = driverTrips.reduce((acc, t) => acc + (t.pricePerSeat * t.bookings.length), 0);
  const totalSpent = passengerBookings.reduce((acc, b) => acc + b.trip.pricePerSeat, 0);
  return { moneyEarned, totalSpent, moneySaved: Number((moneyEarned * 0.5).toFixed(2)) };
}

async function getUpcomingTripsLogic(userId: number, limit: number = 5) {
  return await prisma.trip.findMany({
    where: {
      OR: [{ driverId: userId }, { bookings: { some: { passengerId: userId, status: BookingStatus.ACCEPTED } } }],
      departureTime: { gt: new Date() }
    },
    include: { driver: { select: { firstName: true, lastName: true, avatarUrl: true } }, vehicle: true },
    orderBy: { departureTime: 'asc' },
    take: limit
  });
}

async function getPendingRequestsStatsLogic(userId: number) {
  const [received, sent] = await Promise.all([
    prisma.booking.count({ where: { trip: { driverId: userId }, status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { passengerId: userId, status: BookingStatus.PENDING } })
  ]);
  return { received, sent };
}

async function getRecentConversationsLogic(userId: number, limit: number = 5) {
  return await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { trip: { driverId: userId } }] },
    orderBy: { sentAt: 'desc' },
    distinct: ['tripId'],
    take: limit,
    include: { trip: true }
  });
}

async function getLeaderboardPositionLogic(userId: number) {
  // 1. On récupère d'abord le nombre de trajets de l'utilisateur actuel
  const userStats = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: {
        select: { tripsPosted: true }
      }
    }
  });

  if (!userStats) return 0;

  const myTripsCount = userStats._count.tripsPosted;

  // 2. On compte combien d'utilisateurs ont strictement plus de trajets que nous
  // Note: On filtre par le nombre de trajets via une sous-requête ou agrégation
  const rank = await prisma.user.count({
    where: {
      tripsPosted: {
        some: {} // On s'assure qu'ils ont des trajets
      },
      // On utilise une approche par filtrage sur l'agrégation si supportée, 
      // sinon on compare le total via une logique simple :
    },
  });  
  const leadersCount = await prisma.trip.groupBy({
    by: ['driverId'],
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: myTripsCount
        }
      }
    }
  });

  return leadersCount.length + 1;
}

function generateEcoBadges(co2: number, trips: number): string[] {
  const badges = [];
  if (co2 > 100) badges.push("🌱 Éco-Débutant");
  if (co2 > 500) badges.push("🌳 Protecteur du Québec");
  if (trips > 10) badges.push("🚗 Partageur de Route");
  return badges;
}