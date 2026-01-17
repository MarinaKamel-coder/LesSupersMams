import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";

type PublicStatsResponse = {
  success: boolean;
  data: {
    tripsTotal: number;
    tripsPast: number;
    tripsShared: number;
    totalPassengers: number;
    totalDistanceKm: number;
    totalPassengerKm: number;
    totalCO2Saved: number;
    co2Equivalent: {
      treesPlanted: number;
      carKmAvoided: number;
    };
  };
};

export function HomePage() {
  const { user, isLoading} = useAuth();
    const navigate = useNavigate();
    //Recherche Rapide
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState("");

  function onSearch(e: React.FormEvent) {
        e.preventDefault();
      const params = new URLSearchParams();
      if (from.trim()) params.set("departure", from.trim());
      if (to.trim()) params.set("arrival", to.trim());
      if (date) params.set("date", date);
      navigate(`/booking?${params.toString()}`);
    }
     if (isLoading) {
    return <p>Chargement...</p>;
  }

	const statsQuery = useQuery({
		queryKey: ["publicStats"],
		queryFn: async () => apiFetch<PublicStatsResponse>("/api/public/stats"),
	});

	const stats = statsQuery.data?.data;

  return (
    <div className="gc-grid" style={{ gap: 18 }}>
      <section className="gc-hero gc-homeHero">
        <div className="gc-grid gc-grid-2" style={{ alignItems: "center", gap: 18 }}>
          <div>
            <h1 className="gc-title" style={{ fontSize: 34, marginBottom: 6 }}>GreenCommute</h1>
            <p className="gc-subtitle" style={{ fontSize: 15, maxWidth: 520 }}>
              Plateforme de covoiturage écologique — réduis tes émissions en partageant tes trajets.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="gc-btn gc-btnPrimary"
                onClick={() => navigate("/booking")}
              >
                Rechercher / Réserver
              </button>

              {user ? (
                <>
                  <Link className="gc-btn gc-btnSecondary" to="/create-trip">
                    Publier un trajet
                  </Link>
                  <Link className="gc-link" to="/dashboard">Aller au dashboard</Link>
                </>
              ) : (
                <Link className="gc-btn gc-btnSecondary" to="/login">
                  Se connecter
                </Link>
              )}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", color: "var(--muted)", fontSize: 13 }}>
              <span>⚡ Réservation en quelques clics</span>
              <span>•</span>
              <span>🌿 CO₂ estimé par passager</span>
              <span>•</span>
              <span>💬 Messagerie intégrée</span>
            </div>
          </div>

        <div className="gc-grid gc-grid-3" style={{ gap: 12 }}>
          <div className="gc-stat">
            <div className="gc-statLabel">CO₂ économisé</div>
            <div className="gc-statValue">
              {statsQuery.isLoading ? "…" : stats ? `${stats.totalCO2Saved} kg` : "—"}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {stats ? `≈ ${stats.co2Equivalent.treesPlanted} arbres` : "Impact de la communauté"}
            </div>
          </div>
          <div className="gc-stat">
            <div className="gc-statLabel">Trajets partagés</div>
            <div className="gc-statValue">
              {statsQuery.isLoading ? "…" : stats ? stats.tripsShared : "—"}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {stats ? `${stats.totalPassengers} passagers acceptés` : "Basé sur les trajets passés"}
            </div>
          </div>
          <div className="gc-stat">
            <div className="gc-statLabel">Trajets publiés</div>
            <div className="gc-statValue">
              {statsQuery.isLoading ? "…" : stats ? stats.tripsTotal : "—"}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {stats ? `≈ ${stats.co2Equivalent.carKmAvoided} km auto évités` : "Total plateforme"}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="gc-card">
        <div className="gc-cardBody">
          <h2 style={{ marginTop: 0 }}>Recherche rapide</h2>
          <form onSubmit={onSearch} className="gc-grid" style={{ maxWidth: 680 }}>
            <div className="gc-grid gc-grid-3" style={{ gap: 12 }}>
              <input
                placeholder="Ville de départ"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                placeholder="Ville d'arrivée"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit">Rechercher</button>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Astuce: commence par Montréal → Québec.
              </span>
            </div>
          </form>
        </div>
      </section>

      <section className="gc-grid" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>Comment ça marche</h2>
        <div className="gc-grid gc-grid-3" style={{ gap: 12 }}>
          <div className="gc-stepCard gc-stepCardGreen">
            <div className="gc-stepIcon">🔍</div>
            <h3 className="gc-stepTitle">1. Recherchez un trajet</h3>
            <p className="gc-stepText">
              Trouvez facilement un covoiturage qui correspond à votre itinéraire et vos horaires.
              Filtrez par ville, date et nombre de places.
            </p>
          </div>

          <div className="gc-stepCard gc-stepCardBlue">
            <div className="gc-stepIcon">👥</div>
            <h3 className="gc-stepTitle">2. Réservez ou Publiez</h3>
            <p className="gc-stepText">
              Réservez des places pour voyager ou publiez votre propre trajet pour partager vos frais
              et votre empreinte carbone.
            </p>
          </div>

          <div className="gc-stepCard gc-stepCardGreen">
            <div className="gc-stepIcon">🍃</div>
            <h3 className="gc-stepTitle">3. Sauvez la planète</h3>
            <p className="gc-stepText">
              Suivez votre impact écologique en temps réel. Chaque trajet partagé contribue à réduire
              les émissions de CO₂.
            </p>
          </div>
        </div>
      </section>

      <section className="gc-ctaBanner">
        <h2 className="gc-ctaTitle">Prêt à faire la différence ?</h2>
        <p className="gc-ctaText">
          Rejoignez la communauté GreenCommute et commencez à réduire votre empreinte carbone dès aujourd’hui.
        </p>
        {user ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="gc-ctaBtn" type="button" onClick={() => navigate("/booking")}>
              Rechercher / Réserver
            </button>
            <button className="gc-ctaBtn gc-ctaBtnGhost" type="button" onClick={() => navigate("/create-trip")}>
              Publier un trajet
            </button>
          </div>
        ) : (
          <button className="gc-ctaBtn" type="button" onClick={() => navigate("/login")}>
            Créer mon compte gratuitement
          </button>
        )}
      </section>
    </div>
  );
}