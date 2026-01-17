import { apiFetch } from "./api";

export type TripFilters = {
	departureCity?: string;
	arrivalCity?: string;
	date?: Date;
	// Heure (utilisée surtout avec une date)
	timeFrom?: string; // HH:MM
	timeTo?: string; // HH:MM
	priceMax?: number;
	seats?: number;
};

function toTripsQuery(filters?: TripFilters) {
	const params = new URLSearchParams();

	if (filters?.departureCity) params.set("departure", filters.departureCity);
	if (filters?.arrivalCity) params.set("arrival", filters.arrivalCity);
	if (filters?.date) params.set("date", filters.date.toISOString().slice(0, 10));
	if (filters?.timeFrom) params.set("timeFrom", filters.timeFrom);
	if (filters?.timeTo) params.set("timeTo", filters.timeTo);
	if (typeof filters?.priceMax === "number" && Number.isFinite(filters.priceMax)) {
		params.set("priceMax", String(filters.priceMax));
	}
	if (typeof filters?.seats === "number" && Number.isFinite(filters.seats)) {
		params.set("seats", String(filters.seats));
	}

	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export const tripService = {
	async searchTrips(filters?: TripFilters) {
		// Backend: GET /api/trips?departure=...&arrival=...&date=...&timeFrom=HH:MM&priceMax=...&seats=...
		return apiFetch<unknown[]>(`/api/trips${toTripsQuery(filters)}`);
	},

	async getTripById(id: number) {
		// Backend: GET /api/trips/:id
		return apiFetch<unknown>(`/api/trips/${id}`);
	},
};