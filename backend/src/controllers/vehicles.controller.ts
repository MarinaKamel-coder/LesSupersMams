import type {Request, Response} from "express";
import prisma from "../prisma/prisma";

const ALLOWED_FUEL_TYPES = ["ESSENCE", "DIESEL", "ELECTRIQUE", "HYBRIDE"] as const;
type FuelType = (typeof ALLOWED_FUEL_TYPES)[number];

function isFuelType(value: unknown): value is FuelType {
    return typeof value === "string" && (ALLOWED_FUEL_TYPES as readonly string[]).includes(value);
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
        return Number(value);
    }
    return null;
}

function toInt(value: unknown): number | null {
    const n = toNumber(value);
    if(n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
}

function getAuthUserId(req: Request): number | null {
    const raw = (req as any).user?.sub;
    if (typeof raw === "number"&& Number.isInteger(raw)) return raw;
    if (typeof raw === "string" && raw.trim()!== "" && Number.isInteger(Number(raw))) return Number(raw);
    return null;
}

/**
 * Post/ vehicles
*/
export async function createVehicle(req: Request, res: Response) {
    const ownerId =  getAuthUserId(req);
    if (ownerId === null) return res.status(401).json({message: "Unauthorized:"}); 

    const {brand, model, color, plate, seats, consumption: consumptionRaw, fuelType} = req.body ?? {};
 
    if (typeof brand !== "string" || brand.trim().length < 1) {
        return res.status(400).json({message: "brand is required"});        
    }
    if (typeof model !== "string" || model.trim().length < 1) {
        return res.status(400).json({message: "model is required"});                
    }
    if (typeof color !== "string" || color.trim().length < 1) {
        return res.status(400).json({message: "color is required"});
    }
    if (typeof plate !== "string" || plate.trim().length < 1) {
        return res.status(400).json({message: "plate is required"});
    }

    const seatsInt = toInt(seats);
    if (seatsInt === null || seatsInt < 1 || seatsInt > 8) {
        return res.status(400).json({message: "seats must be an integer between 1 and 8"});
    }

    const consumption = toNumber(consumptionRaw);
    if (consumption === null || consumption <= 0) {
        return res.status(400).json({message: "consommation must be a positive number"});
    }

    if (!isFuelType(fuelType)) {
        return res
        .status(400)
        .json({message: `fuelType must be one of: ${ALLOWED_FUEL_TYPES.join(", ")}` });
    }
    
    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                brand: brand.trim(), 
                model: model.trim(), 
                color: color.trim(), 
                plate: plate.trim(), 
                seats: seatsInt, 
                consumption: consumption, 
                fuelType, 
                ownerId, 
            }, 
        });

        return res.status(201).json(vehicle);
    } catch (err: any) {
        // plate @unique => Prisma error code P2002
        if (err?.code === "P2002") {
            return res.status(409).json({message: "plate already exists"});
        }
        throw err;
    } 
}
/**
 * GET / Vehicles
 */
export async function listMyVehicles(req: Request, res: Response) {
    const ownerId = getAuthUserId(req);
    if (ownerId === null) return res.status(401).json({message: "Unauthorized"});

    const vehicles = await prisma.vehicle.findMany({
        where: {ownerId}, 
        orderBy: {id: "desc"}, 
    });

    return res.json({data: vehicles});
}

/**
 * GET / Vehicles/:id
 */
export async function getMyVehicleById(req: Request, res: Response) {
    const ownerId = getAuthUserId(req);
    if (ownerId === null) return res.status(401).json({message: "Unauthorized"}); 

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({message: "Invalid vehicle"});

    const vehicle = await prisma.vehicle.findFirst({
        where: {id, ownerId}, 
    }); 

    if (!vehicle) return res.status(404).json({ message: "Vehicle not found"});
    return res.json(vehicle);
}

/**
 * PATCH / Vehicles/:id
 */
export async function updateMyVehicle(req: Request, res: Response) {
    const ownerId = getAuthUserId(req);
    if (ownerId === null) return res.status(401).json({message: "Unauthorized"});
    
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({message: "Invalid vehicle id"});

    const existing = await prisma.vehicle.findFirst({where: {id, ownerId}, select: {id: true} });
    if (!existing) return res.status(404).json({message: "Vehicle not found"});

    const body = req.body ?? {};
    const data: any = {};

    if (body.brand !== undefined) {
        if (typeof body.brand !== "string" || body.brand.trim().length < 1) {
            return res.status(400).json({message: "brand must be a non-empty string"});
        }
        data.brand = body.brand.trim();
    }

    if (body.model !== undefined) {
        if (typeof body.model !== "string" || body.model.trim().length < 1) {
            return res.status(400).json({message: "model must be a non-empty string"});
        }
        data.model = body.model.trim();
    }

    if (body.color !== undefined) {
        if (typeof body.color !== "string" || body.color.trim().length < 1) {
            return res.status(400).json({message: "color must be a non-empty string"});
        }
        data.color = body.color.trim();
    }

    if (body.plate !== undefined) {
        if (typeof body.plate !== "string" || body.plate.trim().length < 1) {
            return res.status(400).json({message: "plate must be a non-empty string"}); 
        }
        data.plate = body.plate.trim();
    }

    if (body.seats !== undefined) {
        const seatsInt = toInt(body.seats);
        if (seatsInt === null || seatsInt < 1 || seatsInt > 8) {
            return res.status(400).json({message: "seats must be an integer between 1 and 8"});
        }
        data.seats = seatsInt;
    }

    if (body.consumption !== undefined) {
        const consumptionNum = toNumber(body.consumption);
        if (consumptionNum === null || consumptionNum <= 0 ){
            return res.status(400).json({message: "le nombre doit etre positif"});
        }
        data.consumption = consumptionNum;
    }

    if (body.fuelType !== undefined) {
        if (!isFuelType(body.fuelType)) {
            return res
            .status(400)
            .json({message: `fuelType must be one of: ${ALLOWED_FUEL_TYPES.join(", ")}`});
        }
        data.fuelType = body.fuelType;
    }

    try {
        const vehicle = await prisma.vehicle.update({
            where: {id}, 
            data, 
        });

        return res.json(vehicle);
    } catch (err: any) {
        if (err?.code === "P2002") {
            return res.status(409).json({message: "plate already exists"});
        }
        throw err;        
    }
}

/**
 * DELETE /vehicles/:id
 */
export async function deleteMyVehicle(req: Request, res: Response) {
    const ownerId = getAuthUserId(req);
    if (ownerId === null) return res.status(401).json({message: "Unauthorized"});

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({message: "Invalid vehicle Id"});

    const existing = await prisma.vehicle.findFirst({where: {id, ownerId}, select: {id: true}});
    if (!existing) return res.status(404).json({message: "Vehicle not found"});

    await prisma.vehicle.delete({where: {id} });
    return res.status(204).send();
}