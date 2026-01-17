import type { Request, Response } from "express";
import { BookingStatus } from "../generated/prisma/client";
import prisma from "../prisma/prisma";
import { EMISSION_FACTORS } from "../utils/co2";

function computeCo2Equivalent(totalCO2SavedKg: number) {
	return {
		treesPlanted: Math.round(totalCO2SavedKg / 25),
		carKmAvoided: Math.round((totalCO2SavedKg / EMISSION_FACTORS.ESSENCE) * (100 / 7)),
	};
}

export async function getGlobalStats(req: Request, res: Response) {
	try {
		const now = new Date();

		const [usersCount, tripsTotal] = await Promise.all([
			prisma.user.count(),
			prisma.trip.count(),
		]);

		const tripsPast = await prisma.trip.findMany({
			where: { departureTime: { lt: now } },
			select: {
				id: true,
				distanceKm: true,
				co2SavedPerPass: true,
				bookings: {
					where: { status: BookingStatus.ACCEPTED },
					select: { id: true },
				},
			},
		});

		let totalPassengers = 0;
		let totalCO2Saved = 0;
		let totalDistanceKm = 0;
		let totalPassengerKm = 0;
		let tripsShared = 0;

		for (const trip of tripsPast) {
			const passengers = trip.bookings.length;
			totalPassengers += passengers;
			if (passengers > 0) {
				tripsShared += 1;
				totalDistanceKm += trip.distanceKm;
				totalPassengerKm += trip.distanceKm * passengers;
				totalCO2Saved += trip.co2SavedPerPass * passengers;
			}
		}

		const totalCO2SavedRounded = Number(totalCO2Saved.toFixed(2));

		return res.status(200).json({
			success: true,
			data: {
				usersCount,
				tripsTotal,
				tripsPast: tripsPast.length,
				tripsShared,
				totalPassengers,
				totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
				totalPassengerKm: Number(totalPassengerKm.toFixed(1)),
				totalCO2Saved: totalCO2SavedRounded,
				co2Equivalent: computeCo2Equivalent(totalCO2SavedRounded),
			},
		});
	} catch {
		return res.status(500).json({ success: false, message: "Erreur stats globales" });
	}
}

export async function listUsers(req: Request, res: Response) {
	try {
		const users = await prisma.user.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				rating: true,
				createdAt: true,
				_count: {
					select: {
						tripsPosted: true,
						bookings: true,
					},
				},
			},
		});

		return res.status(200).json({ success: true, data: users });
	} catch {
		return res.status(500).json({ success: false, message: "Erreur liste utilisateurs" });
	}
}

export async function updateUserRole(req: Request, res: Response) {
	try {
		const userId = Number(req.params.userId);
		const { role } = req.body as { role?: "USER" | "ADMIN" };

		if (!userId || Number.isNaN(userId)) {
			return res.status(400).json({ success: false, message: "ID invalide" });
		}
		if (role !== "USER" && role !== "ADMIN") {
			return res.status(400).json({ success: false, message: "Rôle invalide" });
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: { role },
			select: { id: true, email: true, firstName: true, lastName: true, role: true, rating: true },
		});

		return res.status(200).json({ success: true, data: updated });
	} catch {
		return res.status(500).json({ success: false, message: "Erreur mise à jour rôle" });
	}
}
