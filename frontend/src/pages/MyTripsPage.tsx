import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";

type BookingStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

type TripSummary = {
	id: number;
	departureCity: string;
	arrivalCity: string;
	departureTime: string;
	availableSeats: number;
	pricePerSeat: number;
};

type BookingSummary = {
	id: number;
	status: BookingStatus;
	createdAt: string;
	trip: TripSummary;
};

type ProfileResponse = {
	success: boolean;
	data: {
		user: {
			id: number;
			firstName: string;
			lastName: string;
			email: string;
			tripsPosted?: TripSummary[];
			bookings?: BookingSummary[];
		};
		stats: unknown;
	};
};

type Tab = "driver" | "passenger";

function formatDateTime(value: string) {
	return new Date(value).toLocaleString("fr-CA", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function MyTripsPage() {
	const { token, user } = useAuth();
	const [tab, setTab] = useState<Tab>("driver");

	const profileQuery = useQuery({
		queryKey: ["me", "profile"],
		enabled: Boolean(token),
		queryFn: async () => {
			if (!token) throw new Error("Non authentifié");
			return apiFetch<ProfileResponse>("/api/users/profile", { token });
		},
	});

	const tripsPosted = useMemo(() => profileQuery.data?.data.user.tripsPosted ?? [], [profileQuery.data]);
	const bookings = useMemo(() => profileQuery.data?.data.user.bookings ?? [], [profileQuery.data]);

	if (!user || !token) return <p>Vous devez être connecté</p>;
	if (profileQuery.isLoading) return <p>Chargement…</p>;
	if (profileQuery.isError) return <div className="gc-alert">Erreur chargement</div>;

	return (
		<div className="gc-grid" style={{ gap: 16, maxWidth: 900 }}>
			<header>
				<h1 className="gc-title">Mes trajets</h1>
				<p className="gc-subtitle" style={{ margin: 0 }}>
					Conducteur: trajets publiés · Passager: réservations
				</p>
			</header>

			<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={() => setTab("driver")}
					className={tab === "driver" ? "gc-btn gc-btnPrimary" : "gc-btn gc-btnSecondary"}
				>
					Conducteur
				</button>
				<button
					type="button"
					onClick={() => setTab("passenger")}
					className={tab === "passenger" ? "gc-btn gc-btnPrimary" : "gc-btn gc-btnSecondary"}
				>
					Passager
				</button>
				<Link className="gc-btn gc-btnSecondary" to="/create-trip">
					Publier un trajet
				</Link>
			</div>

			{tab === "driver" ? (
				<section className="gc-card">
					<div className="gc-cardBody" style={{ display: "grid", gap: 10 }}>
						<h2 style={{ marginTop: 0 }}>Trajets publiés</h2>
						{tripsPosted.length === 0 ? (
							<p style={{ margin: 0, color: "var(--muted)" }}>Aucun trajet publié.</p>
						) : (
							<div style={{ display: "grid", gap: 10 }}>
								{tripsPosted.map((t) => (
									<div key={t.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
										<div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
											<div>
												<div style={{ fontWeight: 800 }}>
													{t.departureCity} → {t.arrivalCity}
												</div>
												<div style={{ fontSize: 13, color: "var(--muted)" }}>🕐 {formatDateTime(t.departureTime)}</div>
												<div style={{ fontSize: 13, color: "var(--muted)" }}>
													Places: {t.availableSeats} · {t.pricePerSeat.toFixed(2)} $
												</div>
											</div>
											<Link className="gc-btn gc-btnSecondary" to={`/trip/${t.id}`}>
												Ouvrir
											</Link>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</section>
			) : (
				<section className="gc-card">
					<div className="gc-cardBody" style={{ display: "grid", gap: 10 }}>
						<h2 style={{ marginTop: 0 }}>Réservations</h2>
						{bookings.length === 0 ? (
							<p style={{ margin: 0, color: "var(--muted)" }}>Aucune réservation.</p>
						) : (
							<div style={{ display: "grid", gap: 10 }}>
								{bookings.map((b) => (
									<div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
										<div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
											<div>
												<div style={{ fontWeight: 800 }}>
													{b.trip.departureCity} → {b.trip.arrivalCity}
												</div>
												<div style={{ fontSize: 13, color: "var(--muted)" }}>🕐 {formatDateTime(b.trip.departureTime)}</div>
												<div style={{ fontSize: 13, color: "var(--muted)" }}>Statut: <b>{b.status}</b></div>
											</div>
											<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
												<Link className="gc-btn gc-btnSecondary" to={`/trip/${b.trip.id}`}>
													Ouvrir
												</Link>
												<Link className="gc-btn gc-btnSecondary" to={`/messages/${b.trip.id}`}>
													Messages
												</Link>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</section>
			)}
		</div>
	);
}
