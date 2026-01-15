import express from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Protection globale
router.use(authenticate);

// Dashboard & Stats
router.get('/dashboard', userController.getDashboard);
router.get('/stats', userController.getPersonalStats);

// Profil
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Sections spécifiques
router.get('/upcoming-trips', userController.getUpcomingTrips);
router.get('/pending-requests', userController.getPendingRequests);
router.get('/vehicles', userController.getVehicles);
router.get('/conversations', userController.getRecentConversations);

export default router;