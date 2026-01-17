import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";
import { bookingService } from "../services/booking.service";

type TripDetails = {
	id: number;
	departureCity: string;
	arrivalCity: string;
	departureTime: string;
	availableSeats: number;
	pricePerSeat: number;
	description: string | null;
	distanceKm: number;
	durationMin: number;
	co2SavedPerPass: number;
	driverId: number;
	driver: {
		id: number;
		firstName: string;
		lastName: string;
		avatarUrl: string | null;
		bio: string | null;
		rating: number;
	};
	vehicle: {
		id: number;
		brand: string;
		model: string;
		color: string;
		plate: string;
		fuelType: string;
		seats: number;
		consumption: number;
	};
};

function formatDateTime(value: string) {
	return new Date(value).toLocaleString("fr-CA", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getErrorMessage(err: unknown, fallback: string) {
	if (err instanceof Error) return err.message;
	if (err && typeof err === "object" && "message" in err) {
		const maybeMessage = (err as { message?: unknown }).message;
		if (typeof maybeMessage === "string") return maybeMessage;
	}
	return fallback;
}

export function TripDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { token, user } = useAuth();

	const tripId = useMemo(() => {
		if (!id) return null;
		const n = Number(id);
		return Number.isFinite(n) ? n : null;
	}, [id]);

	const tripQuery = useQuery({
		queryKey: ["trip", tripId],
		enabled: tripId != null,
		queryFn: async () => {
			if (tripId == null) throw new Error("Trajet invalide");
			return apiFetch<TripDetails>(`/api/trips/${tripId}`);
		},
	});

	const bookMutation = useMutation({
		mutationFn: async () => {
			if (!tripId) throw new Error("Trajet invalide");
			if (!token) throw new Error("Connecte-toi pour réserver");
			return bookingService.requestBooking(tripId, token);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
			alert("Réservation demandée avec succès !");
		},
	});

	if (tripId == null) {
		return <div className="gc-alert">ID de trajet invalide.</div>;
	}

	if (tripQuery.isLoading) return <p>Chargement…</p>;
	if (tripQuery.isError) {
		return (
			<div className="gc-alert">
				Erreur: {getErrorMessage(tripQuery.error, "Impossible de charger le trajet")}
			</div>
		);
	}

	const trip = tripQuery.data;
	if (!trip) {
		return <div className="gc-alert">Trajet introuvable.</div>;
	}

	const isDriver = Boolean(user && (user as unknown as { id?: number }).id === trip.driverId);
	const canBook = trip.availableSeats > 0 && !isDriver;

	return (
		<div className="gc-grid" style={{ gap: 16 }}>
			<header>
				<h1 className="gc-title" style={{ marginBottom: 6 }}>
					{trip.departureCity} → {trip.arrivalCity}
				</h1>
				<p className="gc-subtitle" style={{ margin: 0 }}>
					🕐 {formatDateTime(trip.departureTime)}
				</p>
			</header>

			<section className="gc-card">
				<div className="gc-cardBody" style={{ display: "grid", gap: 10 }}>
					<div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
						<div>
							<div style={{ fontWeight: 700 }}>
								Conducteur: {trip.driver.firstName} {trip.driver.lastName} · ⭐ {trip.driver.rating}/5
							</div>
							<div style={{ fontSize: 13, opacity: 0.85 }}>
								{trip.driver.bio ? trip.driver.bio : "Aucune bio"}
							</div>
							<div style={{ marginTop: 6 }}>
								<Link className="gc-link" to={`/profile/${trip.driver.id}`}>
									Voir le profil public
								</Link>
							</div>
						</div>

						<div style={{ textAlign: "right" }}>
							<div style={{ fontSize: 26, fontWeight: 800, color: "var(--brand)" }}>
								{trip.pricePerSeat.toFixed(2)} $
							</div>
							<div style={{ fontSize: 13, opacity: 0.8 }}>par place</div>
						</div>
					</div>

					<div style={{ display: "grid", gap: 6, fontSize: 14 }}>
						<div>🚗 Véhicule: {trip.vehicle.brand} {trip.vehicle.model} ({trip.vehicle.fuelType})</div>
						<div>🎨 Couleur: {trip.vehicle.color} · Plaque: {trip.vehicle.plate}</div>
						<div>👥 Places disponibles: {trip.availableSeats}</div>
						<div>🛣️ Distance: {trip.distanceKm} km · Durée: {trip.durationMin} min</div>
						<div>🌿 CO₂ économisé / passager: {trip.co2SavedPerPass} kg</div>
					</div>

					{trip.description ? (
						<div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
							<div style={{ fontWeight: 700, marginBottom: 4 }}>Description</div>
							<p style={{ margin: 0, opacity: 0.9 }}>{trip.description}</p>
						</div>
					) : null}
				</div>
			</section>

			<section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={() => navigate(-1)}
					style={{ background: "transparent", border: "1px solid var(--border)" }}
				>
					Retour
				</button>

				{token ? (
					<Link className="gc-btn gc-btnSecondary" to={`/messages/${trip.id}`}>
						Messages
					</Link>
				) : (
					<Link className="gc-link" to="/login">
						Se connecter pour envoyer un message
					</Link>
				)}

				<button
					type="button"
					disabled={!canBook || bookMutation.isPending}
					onClick={() => {
						if (!token) {
							navigate("/login");
							return;
						}
						if (!window.confirm("Confirmer la réservation ?")) return;
						bookMutation.mutate();
					}}
				>
					{trip.availableSeats <= 0 ? "Complet" : "Réserver"}
				</button>

				{bookMutation.isError ? (
					<div className="gc-alert" style={{ width: "100%" }}>
						{getErrorMessage(bookMutation.error, "Erreur lors de la réservation")}
					</div>
				) : null}
			</section>
		</div>
	);
}
