import { Router } from 'express';
import * as tripController from '../controllers/trip.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// --- Routes Publiques ---
// Tout le monde peut voir la liste des trajets et les détails d'un trajet
router.get('/', tripController.getTrips);
router.get('/:id', tripController.getTripById);

// --- Routes Protégées (Authentification requise) ---
// Seul un utilisateur connecté peut publier, modifier ou supprimer un trajet
router.post('/', authenticate, tripController.createTrip);
router.patch('/:id', authenticate, tripController.updateTrip);
router.delete('/:id', authenticate, tripController.deleteTrip);

export default router;