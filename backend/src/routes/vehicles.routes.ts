import {Router} from "express";
import {authenticate} from "../middlewares/auth.middleware";
import {
    createVehicle, 
    deleteMyVehicle, 
    getMyVehicleById, 
    listMyVehicles, 
    updateMyVehicle, 
} from "../controllers/vehicles.controller";

const router = Router();

router.use(authenticate);

router.post("/", createVehicle);
router.get("/", listMyVehicles);
router.get("/:id", getMyVehicleById);
router.patch("/:id", updateMyVehicle);
router.delete("/:id", deleteMyVehicle);

export default router; 