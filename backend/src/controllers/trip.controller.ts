import type { Request, Response } from 'express';
import * as tripService from '../utils/trip.service';

/**
 * Publier un nouveau trajet
 */
export const createTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ message: 'Authentification requise' });

        const newTrip = await tripService.createTripLogic(Number(userId), req.body);

        return res.status(201).json({ success: true, data: newTrip });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

/**
 * Rechercher des trajets avec filtres 
 */
export const getTrips = async (req: Request, res: Response) => {
    try {
        const filters = {
            departure: req.query.departure as string,
            arrival: req.query.arrival as string,
            date: req.query.date as string,
			timeFrom: req.query.timeFrom as string,
			timeTo: req.query.timeTo as string,
			priceMax: req.query.priceMax as string,
			seats: (req.query.seats as string) ?? (req.query.passengers as string)
        };

        const trips = await tripService.getAllTripsService(filters);
        return res.status(200).json(trips);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la recherche' });
    }
};

/**
 * Détails d'un trajet par ID
 */
export const getTripById = async (req: Request, res: Response) => {
    try {
        const tripId = parseInt(req.params.id as string, 10);
        if (isNaN(tripId)) return res.status(400).json({ message: "ID invalide" });

        const trip = await tripService.getTripByIdService(tripId);
        if (!trip) return res.status(404).json({ message: 'Trajet non trouvé' });

        return res.status(200).json(trip);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Modifier un trajet
 */
export const updateTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.sub;
        const tripId = parseInt(req.params.id as string, 10);

        if (!userId || isNaN(tripId)) return res.status(400).json({ message: "Paramètres invalides" });

        const updatedTrip = await tripService.updateTripLogic(tripId, req.body);
        return res.status(200).json({ success: true, data: updatedTrip });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

/**
 * Supprimer un trajet
 */
export const deleteTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.sub;
        const tripId = parseInt(req.params.id as string, 10);

        if (!userId || isNaN(tripId)) return res.status(400).json({ message: "Paramètres invalides" });

        const deleted = await tripService.deleteTripService(Number(userId), tripId);
        
        if (!deleted) {
            return res.status(404).json({ message: 'Trajet non trouvé ou non autorisé' });
        }

        return res.status(200).json({ message: 'Trajet supprimé avec succès' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};