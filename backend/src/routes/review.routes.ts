import { Router } from "express";
import { createReview, getReviewsForUser, getMyReviews } from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// ==================== Routes protégées (Authentification requise) ====================

// Créer un nouvel avis
router.post("/", authenticate, createReview);

// Lister les avis reçus par un utilisateur (profil public)
router.get("/user/:userId", authenticate, getReviewsForUser);

// Lister les avis donnés par l'utilisateur connecté
router.get("/me", authenticate, getMyReviews);

export default router;
