import type { Request, Response } from "express";
import prisma from "../prisma/prisma";

// ==================== Créer un nouvel avis ====================
export async function createReview(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub; // <-- cast any
    const { tripId, revieweeId, rating, comment } = req.body as {
      tripId: number;
      revieweeId: number;
      rating: number;
      comment?: string;
    };

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Vérifier que l'utilisateur ne peut pas laisser un avis sur lui-même
    if (userId === revieweeId) {
      return res.status(400).json({ message: "Vous ne pouvez pas vous évaluer vous-même." });
    }

    // Vérifier que le trajet existe
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });
    if (!trip) return res.status(404).json({ message: "Trajet non trouvé" });

    // Vérifier que l'utilisateur a participé au trajet
    const participation = await prisma.booking.findFirst({
      where: {
        tripId: tripId,
        passengerId: userId,
        status: "ACCEPTED",
      },
    });

    if (!participation) {
      return res.status(403).json({
        message: "Vous ne pouvez pas évaluer ce trajet car vous n'y avez pas participé.",
      });
    }

    // Créer l'avis
    const newReview = await prisma.review.create({
      data: {
        tripId,
        reviewerId: userId,
        revieweeId,
        rating,
        comment,
      },
    });

    return res.status(201).json({ review: newReview });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ==================== Lister les avis reçus par un utilisateur ====================
export async function getReviewsForUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { revieweeId: Number(userId) },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true, rating: true },
        },
        trip: {
          select: { id: true, departureCity: true, arrivalCity: true, departureTime: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ==================== Lister les avis donnés par l'utilisateur connecté ====================
export async function getMyReviews(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub; // <-- cast any
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const reviews = await prisma.review.findMany({
      where: { reviewerId: userId },
      include: {
        reviewee: {
          select: { id: true, firstName: true, lastName: true, rating: true },
        },
        trip: {
          select: { id: true, departureCity: true, arrivalCity: true, departureTime: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
