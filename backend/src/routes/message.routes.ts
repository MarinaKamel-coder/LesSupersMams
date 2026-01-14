import {Router} from "express";
import * as messageController from "../controllers/message.controller"
import {authenticate} from "../middlewares/auth.middleware"

const router = Router();

router.use(authenticate);

router.post("/", messageController.sendMessage);
router.get("/trip/:tripId", messageController.getTripMessages);
router.patch("/trip/:tripId/read", messageController.markAsRead);

export default router;