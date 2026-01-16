import { apiFetch } from "./api";

export type TripFilters = {
	departureCity?: string;
	arrivalCity?: string;
	date?: Date;
	passengers?: number;
};

function toTripsQuery(filters?: TripFilters) {
	const params = new URLSearchParams();

	if (filters?.departureCity) params.set("departure", filters.departureCity);
	if (filters?.arrivalCity) params.set("arrival", filters.arrivalCity);
	if (filters?.date) params.set("date", filters.date.toISOString());
	if (filters?.passengers) params.set("passengers", String(filters.passengers));

	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export const tripService = {
	async searchTrips(filters?: TripFilters) {
		// Backend: GET /api/trips?departure=...&arrival=...&date=...
		return apiFetch<unknown[]>(`/api/trips${toTripsQuery(filters)}`);
	},

	async getTripById(id: number) {
		// Backend: GET /api/trips/:id
		return apiFetch<unknown>(`/api/trips/${id}`);
	},
};