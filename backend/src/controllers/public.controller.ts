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

export async function getPublicStats(req: Request, res: Response) {
  try {
    const now = new Date();

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

    const tripsTotal = await prisma.trip.count();

    return res.status(200).json({
      success: true,
      data: {
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
    return res.status(500).json({ success: false, message: "Erreur stats publiques" });
  }
}
