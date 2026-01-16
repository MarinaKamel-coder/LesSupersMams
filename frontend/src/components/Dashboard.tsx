import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../services/api";

type DashboardStats = {
  tripsCompleted: number;
  tripsAsDriver: number;
  tripsAsPassenger: number;
  totalCO2Saved: number;
  co2Equivalent: { treesPlanted: number; carKmAvoided: number };
  moneySaved: number;
  moneyEarned: number;
  totalSpent: number;
  pendingRequests: { received: number; sent: number };
  vehiclesCount: number;
  averageRating: number;
  totalDistance: number;
  totalPassengers: number;
};

type UpcomingTrip = {
  id: number;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  pricePerSeat: number;
};

type DashboardResponse = {
  success: boolean;
  data: {
    stats: DashboardStats;
    upcomingTrips: UpcomingTrip[];
    pendingRequests: { received: number; sent: number };
    leaderboardPosition: number;
    badges: string[];
  };
};

export function Dashboard() {
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      if (!token) throw new Error("Non authentifié");
      return apiFetch<DashboardResponse>("/api/users/dashboard", { token });
    },
    enabled: Boolean(token),
  });

  if (!token) {
    return <p>Connecte-toi pour voir ton tableau de bord.</p>;
  }

  if (query.isLoading) return <p>Chargement du tableau de bord…</p>;
  if (query.isError) {
    return (
      <div className="gc-alert">
        Erreur: {query.error instanceof Error ? query.error.message : "Impossible de charger"}
      </div>
    );
  }

  if (!query.data) {
    return <p>Impossible de charger le tableau de bord.</p>;
  }

  const payload = query.data;
  const stats = payload.data.stats;

  return (
    <div className="gc-grid">
      <header>
        <h1 className="gc-title">Tableau de bord</h1>
        <p className="gc-subtitle">
          Résumé de ton impact et de tes activités.
        </p>
      </header>

      <section className="gc-grid gc-grid-3">
        <div className="gc-stat">
          <div className="gc-statLabel">CO₂ économisé</div>
          <div className="gc-statValue">{stats.totalCO2Saved} kg</div>
        </div>
        <div className="gc-stat">
          <div className="gc-statLabel">Équivalent arbres</div>
          <div className="gc-statValue">{stats.co2Equivalent.treesPlanted}</div>
        </div>
        <div className="gc-stat">
          <div className="gc-statLabel">Gains (conducteur)</div>
          <div className="gc-statValue">{stats.moneyEarned} $</div>
        </div>
      </section>

      <section className="gc-grid gc-grid-2">
        <div className="gc-card">
          <div className="gc-cardBody">
            <h2 style={{ marginTop: 0 }}>Prochains trajets</h2>
          {payload.data.upcomingTrips.length === 0 ? (
            <p className="gc-subtitle">Aucun trajet à venir.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {payload.data.upcomingTrips.map((t) => (
                <li key={t.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)" }}>
                  <div style={{ fontWeight: 700 }}>
                    {t.departureCity} → {t.arrivalCity}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(t.departureTime).toLocaleString("fr-CA")}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{t.pricePerSeat} $/place</div>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>

        <div className="gc-grid">
          <div className="gc-card">
            <div className="gc-cardBody">
              <h2 style={{ marginTop: 0 }}>Badges</h2>
            {payload.data.badges.length === 0 ? (
              <p className="gc-subtitle">Aucun badge pour l’instant.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {payload.data.badges.map((b) => (
                  <span key={b} style={{ border: "1px solid var(--border)", borderRadius: 999, padding: "6px 10px", background: "var(--surface-2)" }}>
                    {b}
                  </span>
                ))}
              </div>
            )}
            </div>
          </div>

          <div className="gc-success">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900 }}>Demandes en attente</div>
                <div style={{ marginTop: 6 }}>
                  Reçues: <b>{payload.data.pendingRequests.received}</b> · Envoyées: <b>{payload.data.pendingRequests.sent}</b>
                </div>
              </div>
              <div style={{ fontWeight: 900 }}>#{payload.data.leaderboardPosition}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
