import express from "express";
import { userController } from "../controllers/user.controller";
import { getPublicStats } from "../controllers/public.controller";

const router = express.Router();

// Profil public (sans authentification)
router.get("/users/:userId", userController.getPublicProfile);

// Stats publiques d'impact (sans authentification)
router.get("/stats", getPublicStats);

export default router;
