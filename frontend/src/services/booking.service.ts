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

	async getTripBookings(tripId: number, token: string) {
		// Backend: GET /api/bookings/trip/:tripId -> { bookings }
		const res = await apiFetch<{ bookings: unknown[] }>(`/api/bookings/trip/${tripId}`, {
			token,
		});
		return res.bookings;
	},

	async updateBookingStatus(bookingId: number, status: "ACCEPTED" | "REJECTED", token: string) {
		// Backend: PATCH /api/bookings/:bookingId/status { status }
		return apiFetch<{ booking: unknown }>(`/api/bookings/${bookingId}/status`, {
			method: "PATCH",
			token,
			body: { status },
		});
	},
};