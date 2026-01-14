import type { Request, Response } from "express";
import  prisma  from "../prisma/prisma";

/** ===== reservations ===== */
export async function requestBooking(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { tripId } = req.body as { tripId: number };

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Empêcher le conducteur de réserver son propre trajet
    if (trip.driverId === userId) {
      return res.status(400).json({
        message: "Vous ne pouvez pas réserver votre propre trajet.",
      });
    }

    if (trip.availableSeats <= 0) {
      return res.status(400).json({
        message: "Plus de places disponibles.",
      });
    }

    // Empêcher une double réservation
    const existingBooking = await prisma.booking.findUnique({
      where: {
        tripId_passengerId: {
          tripId,
          passengerId: userId,
        },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Vous avez déjà réservé ce trajet.",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        tripId,
        passengerId: userId,
      },
    });

    return res.status(201).json({ booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ======= Accepter / Refuser une réservation =======
 */
export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const bookingId = Number(req.params.bookingId);
    const { status } = req.body as {
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

if (
  status !== "ACCEPTED" &&
  status !== "REJECTED"
) {
  return res.status(400).json({ message: "Statut invalide" });
}


    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Seul le conducteur peut accepter/refuser
    if (booking.trip.driverId !== userId) {
      return res.status(403).json({
        message: "Action non autorisée.",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        message: "Cette réservation a déjà été traitée.",
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    // Si acceptée → décrémenter les places
    if (status === "ACCEPTED") {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: {
          availableSeats: {
            decrement: 1,
          },
        },
      });
    }

    return res.json({ booking: updatedBooking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * == Mes réservations (passager)==========
 */
export async function getMyBookings(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        passengerId: userId,
      },
      include: {
        trip: {
          include: {
            driver: true,
            vehicle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ bookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
