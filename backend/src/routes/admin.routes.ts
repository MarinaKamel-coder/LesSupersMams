import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/stats", adminController.getGlobalStats);
router.get("/users", adminController.listUsers);
router.patch("/users/:userId/role", adminController.updateUserRole);

export default router;
