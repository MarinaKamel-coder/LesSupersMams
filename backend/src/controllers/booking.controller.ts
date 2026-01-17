import type { Request, Response } from "express";
import  prisma  from "../prisma/prisma";
import { emitToUser } from "../realtime/socket";

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
      include: {
        trip: {
          select: {
            id: true,
            driverId: true,
            departureCity: true,
            arrivalCity: true,
            departureTime: true,
          },
        },
      },
    });

		emitToUser(Number(trip.driverId), "booking:created", {
			bookingId: booking.id,
			tripId: booking.trip.id,
			passengerId: Number(userId),
			departureCity: booking.trip.departureCity,
			arrivalCity: booking.trip.arrivalCity,
			departureTime: booking.trip.departureTime,
		});
		emitToUser(Number(userId), "booking:created", {
			bookingId: booking.id,
			tripId: booking.trip.id,
			status: booking.status,
			departureCity: booking.trip.departureCity,
			arrivalCity: booking.trip.arrivalCity,
			departureTime: booking.trip.departureTime,
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

		emitToUser(Number(booking.passengerId), "booking:status", {
			bookingId: updatedBooking.id,
			tripId: booking.tripId,
			status: updatedBooking.status,
		});
		emitToUser(Number(booking.trip.driverId), "booking:status", {
			bookingId: updatedBooking.id,
			tripId: booking.tripId,
			status: updatedBooking.status,
		});

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

/**
 * == Annuler une réservation (passager) ==
 * DELETE /bookings/:bookingId
 */
export async function cancelBooking(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const bookingId = Number(req.params.bookingId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!bookingId || Number.isNaN(bookingId)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.passengerId !== userId) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Cette réservation est déjà annulée." });
    }
    if (booking.status === "REJECTED") {
      return res.status(400).json({ message: "Cette réservation a été refusée." });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Si la réservation était acceptée, libérer une place.
    if (booking.status === "ACCEPTED") {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { availableSeats: { increment: 1 } },
      });
    }

		emitToUser(Number(booking.trip.driverId), "booking:status", {
			bookingId: updatedBooking.id,
			tripId: booking.tripId,
			status: updatedBooking.status,
		});
		emitToUser(Number(booking.passengerId), "booking:status", {
			bookingId: updatedBooking.id,
			tripId: booking.tripId,
			status: updatedBooking.status,
		});

    return res.json({ booking: updatedBooking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
