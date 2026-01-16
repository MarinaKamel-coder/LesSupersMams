import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";

type GlobalStats = {
	usersCount: number;
	tripsTotal: number;
	tripsPast: number;
	tripsShared: number;
	totalPassengers: number;
	totalDistanceKm: number;
	totalPassengerKm: number;
	totalCO2Saved: number;
	co2Equivalent: { treesPlanted: number; carKmAvoided: number };
};

type GlobalStatsResponse = { success: boolean; data: GlobalStats };

type AdminUser = {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: "USER" | "ADMIN";
	rating: number;
	createdAt: string;
	_count: { tripsPosted: number; bookings: number };
};

type UsersResponse = { success: boolean; data: AdminUser[] };

export function AdministrationPage() {
	const { token } = useAuth();
	const queryClient = useQueryClient();

	const statsQuery = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: async () => {
			if (!token) throw new Error("Non authentifié");
			return apiFetch<GlobalStatsResponse>("/api/admin/stats", { token });
		},
		enabled: Boolean(token),
	});

	const usersQuery = useQuery({
		queryKey: ["admin", "users"],
		queryFn: async () => {
			if (!token) throw new Error("Non authentifié");
			return apiFetch<UsersResponse>("/api/admin/users", { token });
		},
		enabled: Boolean(token),
	});

	const roleMutation = useMutation({
		mutationFn: async (input: { userId: number; role: "USER" | "ADMIN" }) => {
			if (!token) throw new Error("Non authentifié");
			return apiFetch("/api/admin/users/" + input.userId + "/role", {
				method: "PATCH",
				token,
				body: { role: input.role },
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
		},
	});

	const users = usersQuery.data?.data ?? [];
	const counts = useMemo(() => {
		const adminCount = users.filter((u) => u.role === "ADMIN").length;
		return { adminCount, userCount: users.length };
	}, [users]);

	if (!token) {
		return <p>Connecte-toi avec un compte admin pour accéder à l’administration.</p>;
	}

	const anyError = statsQuery.isError || usersQuery.isError;
	const errorMessage =
		(statsQuery.error instanceof Error && statsQuery.error.message) ||
		(usersQuery.error instanceof Error && usersQuery.error.message) ||
		"Impossible de charger";

	return (
		<div className="gc-grid" style={{ gap: 16 }}>
			<header>
				<h1 className="gc-title">Administration</h1>
				<p className="gc-subtitle">Stats plateforme, utilisateurs et modération.</p>
			</header>

			{anyError ? <div className="gc-alert">Erreur: {errorMessage}</div> : null}

			<section className="gc-grid gc-grid-3">
				<div className="gc-stat">
					<div className="gc-statLabel">CO₂ économisé (global)</div>
					<div className="gc-statValue">
						{statsQuery.data?.data.totalCO2Saved ?? "—"} kg
					</div>
				</div>
				<div className="gc-stat">
					<div className="gc-statLabel">Trajets partagés (passés)</div>
					<div className="gc-statValue">{statsQuery.data?.data.tripsShared ?? "—"}</div>
				</div>
				<div className="gc-stat">
					<div className="gc-statLabel">Passagers transportés</div>
					<div className="gc-statValue">{statsQuery.data?.data.totalPassengers ?? "—"}</div>
				</div>
			</section>

			<section className="gc-grid gc-grid-2">
				<div className="gc-card">
					<div className="gc-cardBody">
						<h2 style={{ marginTop: 0 }}>Équivalents</h2>
						<p style={{ margin: 0, color: "var(--muted)" }}>
							Arbres: <b>{statsQuery.data?.data.co2Equivalent.treesPlanted ?? "—"}</b> ·
							 km voiture évités: <b>{statsQuery.data?.data.co2Equivalent.carKmAvoided ?? "—"}</b>
						</p>
						<div style={{ marginTop: 12, display: "grid", gap: 6, fontSize: 13, color: "var(--muted)" }}>
							<div>Utilisateurs: <b>{statsQuery.data?.data.usersCount ?? "—"}</b></div>
							<div>Trajets publiés (total): <b>{statsQuery.data?.data.tripsTotal ?? "—"}</b></div>
							<div>Distance covoiturée (km): <b>{statsQuery.data?.data.totalDistanceKm ?? "—"}</b></div>
							<div>Passenger-km: <b>{statsQuery.data?.data.totalPassengerKm ?? "—"}</b></div>
						</div>
					</div>
				</div>

				<div className="gc-card">
					<div className="gc-cardBody">
						<h2 style={{ marginTop: 0 }}>Utilisateurs</h2>
						<p style={{ margin: 0, color: "var(--muted)" }}>
							Admins: <b>{counts.adminCount}</b> · Total: <b>{counts.userCount}</b>
						</p>
						<p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
							Astuce: si tu vois une erreur 403, connecte-toi avec un compte role=ADMIN.
						</p>
					</div>
				</div>
			</section>

			<section className="gc-card">
				<div className="gc-cardBody">
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
						<h2 style={{ marginTop: 0, marginBottom: 0 }}>Modération utilisateurs</h2>
						{usersQuery.isLoading ? (
							<span style={{ fontSize: 13, color: "var(--muted)" }}>Chargement…</span>
						) : null}
					</div>

					<div style={{ overflowX: "auto", marginTop: 12 }}>
						<table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
							<thead>
								<tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
									<th style={{ padding: "10px 8px" }}>Utilisateur</th>
									<th style={{ padding: "10px 8px" }}>Email</th>
									<th style={{ padding: "10px 8px" }}>Rôle</th>
									<th style={{ padding: "10px 8px" }}>Note</th>
									<th style={{ padding: "10px 8px" }}>Trajets</th>
									<th style={{ padding: "10px 8px" }}>Réservations</th>
									<th style={{ padding: "10px 8px" }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => {
									const fullName = `${u.firstName} ${u.lastName}`.trim();
									const nextRole: "USER" | "ADMIN" = u.role === "ADMIN" ? "USER" : "ADMIN";
									return (
										<tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
											<td style={{ padding: "10px 8px", fontWeight: 700 }}>{fullName || `#${u.id}`}</td>
											<td style={{ padding: "10px 8px", color: "var(--muted)" }}>{u.email}</td>
											<td style={{ padding: "10px 8px" }}>
												<span style={{
													display: "inline-block",
													padding: "4px 10px",
													borderRadius: 999,
													border: "1px solid var(--border)",
													background: "var(--surface-2)",
												}}>
													{u.role}
												</span>
											</td>
											<td style={{ padding: "10px 8px" }}>{u.rating.toFixed(1)}</td>
											<td style={{ padding: "10px 8px" }}>{u._count.tripsPosted}</td>
											<td style={{ padding: "10px 8px" }}>{u._count.bookings}</td>
											<td style={{ padding: "10px 8px" }}>
												<button
													type="button"
													disabled={roleMutation.isPending}
													onClick={() => roleMutation.mutate({ userId: u.id, role: nextRole })}
												>
													Passer {nextRole}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{roleMutation.isError ? (
						<div className="gc-alert" style={{ marginTop: 12 }}>
							{roleMutation.error instanceof Error ? roleMutation.error.message : "Erreur mise à jour"}
						</div>
					) : null}
				</div>
			</section>
		</div>
	);
}
