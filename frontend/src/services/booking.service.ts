import { apiFetch } from "./api";

export const bookingService = {
	async requestBooking(tripId: number, token: string) {
		// Backend: POST /api/bookings { tripId }
		return apiFetch<{ booking: unknown }>("/api/bookings", {
			method: "POST",
			token,
			body: { tripId },
		});
	},

	async getMyBookings(token: string) {
		// Backend: GET /api/bookings/my -> { bookings }
		const res = await apiFetch<{ bookings: unknown[] }>("/api/bookings/my", {
			token,
		});
		return res.bookings;
	},

	async cancelBooking(bookingId: number, token: string) {
		// Backend: DELETE /api/bookings/:bookingId
		return apiFetch<{ booking: unknown }>(`/api/bookings/${bookingId}`, {
			method: "DELETE",
			token,
		});
	},
};