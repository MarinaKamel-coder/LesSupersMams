import prisma from '../prisma/prisma';
import { calculateCO2Saved, EMISSION_FACTORS } from './co2';

/**
 * Créer un nouveau trajet avec calcul CO2
 */
export const createTripLogic = async (driverId: number, tripData: any) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: tripData.vehicleId },
  });

  if (!vehicle || vehicle.ownerId !== driverId) {
    throw new Error("Véhicule invalide ou non autorisé.");
  }

  const co2SavedPerPass = calculateCO2Saved(
    vehicle.consumption,
    tripData.distanceKm,
    vehicle.fuelType as keyof typeof EMISSION_FACTORS,
    tripData.availableSeats
  );

  return await prisma.trip.create({
    data: {
      ...tripData,
      departureTime: new Date(tripData.departureTime),
      driverId,
      co2SavedPerPass,
    },
    include: {
      vehicle: true,
      driver: { select: { id: true, firstName: true, lastName: true, rating: true } }
    }
  });
};

/**
 * Récupérer tous les trajets 
 */
export const getAllTripsService = async (filters: any = {}) => {
  const { departure, arrival, date, timeFrom, timeTo, priceMax, seats } = filters;

  const parsedPriceMax = priceMax != null && String(priceMax).trim() !== "" ? Number(priceMax) : null;
  const parsedSeats = seats != null && String(seats).trim() !== "" ? Number(seats) : null;

  const where: any = {
    departureCity: { contains: departure, mode: 'insensitive' },
    arrivalCity: { contains: arrival, mode: 'insensitive' },
  };

  // Places disponibles
  if (parsedSeats != null && Number.isFinite(parsedSeats) && parsedSeats > 0) {
    where.availableSeats = { gte: parsedSeats };
  } else {
    where.availableSeats = { gt: 0 };
  }

  // Prix max
  if (parsedPriceMax != null && Number.isFinite(parsedPriceMax) && parsedPriceMax >= 0) {
    where.pricePerSeat = { lte: parsedPriceMax };
  }

  // Date (YYYY-MM-DD) + heure (HH:MM)
  if (date) {
    const dateStr = String(date).trim();
    const base = new Date(dateStr);
    if (!Number.isNaN(base.getTime())) {
      let start: Date | null = null;
      let end: Date | null = null;

      // Si on reçoit juste une date, on filtre la journée complète (UTC, car new Date('YYYY-MM-DD') est en UTC)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        start = new Date(base);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
      } else {
        // Sinon, on garde un filtre "à partir de" (compat ISO)
        start = base;
      }

      // Appliquer heure min/max seulement si on a une date au format YYYY-MM-DD
      if (start && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        if (timeFrom && /^\d{2}:\d{2}$/.test(String(timeFrom))) {
          const [h, m] = String(timeFrom).split(":").map((x) => Number(x));
          const dt = new Date(start);
          dt.setUTCHours(h, m, 0, 0);
          start = dt;
        }

        if (timeTo && /^\d{2}:\d{2}$/.test(String(timeTo))) {
          const [h, m] = String(timeTo).split(":").map((x) => Number(x));
          const dt = new Date(start);
          dt.setUTCHours(h, m, 59, 999);
          end = dt;
        }
      }

      where.departureTime = {
        ...(start ? { gte: start } : {}),
        ...(end ? { lt: end } : {}),
      };
    }
  }
  
  return await prisma.trip.findMany({
    where,
    include: {
      driver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, rating: true } },
      vehicle: true
    },
    orderBy: { departureTime: 'asc' }
  });
};

/**
 * Récupérer un trajet par son ID
 */
export const getTripByIdService = async (tripId: number) => {
  return await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      driver: { select: { id: true, firstName: true, lastName: true, rating: true, bio: true, avatarUrl: true } },
      vehicle: true,
      bookings: { include: { passenger: { select: { firstName: true, avatarUrl: true } } } }
    }
  });
};

/**
 * Mettre à jour un trajet et recalculer le CO2 si nécessaire
 */
export const updateTripLogic = async (tripId: number, updateData: any) => {
  const currentTrip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true }
  });

  if (!currentTrip) throw new Error("Trajet non trouvé.");

  let co2SavedPerPass = currentTrip.co2SavedPerPass;

  // Recalcul du CO2 si la distance, le véhicule ou les sièges changent
  if (updateData.distanceKm || updateData.vehicleId || updateData.availableSeats) {
    const vId = updateData.vehicleId || currentTrip.vehicleId;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vId } });

    if (vehicle) {
      co2SavedPerPass = calculateCO2Saved(
        vehicle.consumption,
        updateData.distanceKm || currentTrip.distanceKm,
        vehicle.fuelType as keyof typeof EMISSION_FACTORS,
        updateData.availableSeats || currentTrip.availableSeats
      );
    }
  }

  return await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...updateData,
      ...(updateData.departureTime && { departureTime: new Date(updateData.departureTime) }),
      co2SavedPerPass
    },
    include: { vehicle: true }
  });
};

/**
 * Supprimer un trajet (vérifie l'autorisation au préalable)
 */
export const deleteTripService = async (driverId: number, tripId: number) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });

  if (!trip || trip.driverId !== driverId) {
    return null; // Ou throw Error selon ta préférence de gestion dans le controller
  }

  return await prisma.trip.delete({
    where: { id: tripId }
  });
};