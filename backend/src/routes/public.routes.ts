import express from "express";
import { userController } from "../controllers/user.controller";

const router = express.Router();

// Profil public (sans authentification)
router.get("/users/:userId", userController.getPublicProfile);

export default router;
