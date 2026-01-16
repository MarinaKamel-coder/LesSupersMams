import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext";
import {useState} from "react";

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
              <div className="gc-statLabel">Trajets</div>
              <div className="gc-statValue">Rapide</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Recherche + filtre en 1 écran</div>
            </div>
            <div className="gc-stat">
              <div className="gc-statLabel">Réservation</div>
              <div className="gc-statValue">Simple</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Statut: attente / acceptée</div>
            </div>
            <div className="gc-stat">
              <div className="gc-statLabel">Impact</div>
              <div className="gc-statValue">+Vert</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Moins d’autos, moins d’émissions</div>
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

      <section className="gc-grid gc-grid-3">
        <div className="gc-card"><div className="gc-cardBody">
          <h3 style={{ marginTop: 0 }}>Impact</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>Chaque trajet partagé divise les émissions par passager.</p>
        </div></div>
        <div className="gc-card"><div className="gc-cardBody">
          <h3 style={{ marginTop: 0 }}>Confiance</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>Avis et notes après chaque trajet.</p>
        </div></div>
        <div className="gc-card"><div className="gc-cardBody">
          <h3 style={{ marginTop: 0 }}>Communauté</h3>
          <p style={{ margin: 0, color: "var(--muted)" }}>Badges éco et stats personnelles.</p>
        </div></div>
      </section>
    </div>
  );
}