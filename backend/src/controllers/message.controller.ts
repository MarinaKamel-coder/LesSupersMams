import type { Request, Response } from "express";
import prisma from "../prisma/prisma";
import { emitToTrip, emitToUser } from "../realtime/socket";

/**
 * Envoyer un message dans le cadre d'un Trip
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const senderId = req.user?.sub;
    const { tripId, content } = req.body;

    if (!senderId) return res.status(401).json({ message: "Non authentifié" });

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Le contenu du message est vide" });
    }

    // Vérifier si le Trip existe
    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip) return res.status(404).json({ message: "Trip non trouvé" });

    const newMessage = await prisma.message.create({
      data: {
        content: content.trim(),
        tripId: Number(tripId),
        senderId: Number(senderId),
      },
      include: {
        sender: {
          select: { firstName: true, avatarUrl: true }
        }
      }
    });

		emitToTrip(Number(tripId), "message:new", {
			tripId: Number(tripId),
			message: newMessage,
		});
		emitToUser(Number(trip.driverId), "message:new", {
			tripId: Number(tripId),
			message: newMessage,
		});

    return res.status(201).json(newMessage);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de l'envoi du message" });
  }
}
/**
 * Récupérer la conversation pour un Trip spécifique
 */
export async function getTripMessages(req: Request, res: Response) {
  try {
    const tripId = Number(req.params.tripId);

    const messages = await prisma.message.findMany({
      where: { tripId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      },
      orderBy: { sentAt: "asc" } // Ordre chronologique
    });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la récupération des messages" });
  }
}

/**
 * Marquer les messages d'un Trip comme lus
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const tripId = Number(req.params.tripId);

    await prisma.message.updateMany({
      where: {
        tripId: tripId,
        senderId: { not: userId }, 
        isRead: false
      },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}